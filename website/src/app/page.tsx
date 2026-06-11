"use client";

import { useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { animate } from 'animejs';
import CuteHelper from '../components/CuteHelper';
import Hypercube from "@/components/Hypercube";

interface AppState {
  dimension: number;
  nodes: { id: number; packet: number }[];
}

export default function Home() {
  const [displayMethod, setDisplayMethod] = useState<'text' | 'color'>('text');
  const [shuffleTrigger, setShuffleTrigger] = useState(0);
  const [algo, setAlgo] = useState<'merge' | 'bfs' | 'astar' | 'entropy_cycle' | 'beam_search' | 'stochastic'>('merge');
  const [isRouting, setIsRouting] = useState(false);
  const [activeSwap, setActiveSwap] = useState<{ node1: number, node2: number } | null>(null);
  const [swapList, setSwapList] = useState<{ node1: number, node2: number }[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasmModule, setWasmModule] = useState<any>(null);
  const [state, setState] = useState<AppState>({
    dimension: 3,
    nodes: Array.from({ length: 8 }, (_, i) => ({ id: i, packet: i }))
  });

  const stepListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    const basePath = process.env.NODE_ENV === 'production' ? '/ubperm-routing' : '';
    script.src = `${basePath}/router.js`;
    script.async = true;
    script.onload = () => {
      if ((window as any).createRouterModule) {
        (window as any).createRouterModule().then((instance: any) => {
          setWasmModule(instance);
        });
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);


  useEffect(() => {
    if (stepListRef.current && currentStep >= 0) {
      const activeElement = stepListRef.current.children[currentStep] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentStep]);



  const handleShuffle = async () => {
    if (isRouting) return;
    setSwapList([]);
    setCurrentStep(-1);
    setActiveSwap(null);
    const newNodes = [...state.nodes];
    const packets = newNodes.map(n => n.packet);
    for (let i = packets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = packets[i];
        packets[i] = packets[j];
        packets[j] = temp;
    }
    
    for (let i = 0; i < newNodes.length; i++) {
        newNodes[i].packet = packets[i];
    }

    const newState = { ...state, nodes: newNodes };
    
    setState(newState);
    setShuffleTrigger(s => s + 1);
  };

  const handleRoute = async () => {
    if (isRouting || !wasmModule) {
      if (!wasmModule) alert("WASM Module not loaded yet!");
      return;
    }
    setIsRouting(true);
    try {
      const vecIn = new wasmModule.VectorInt();
      for (const n of state.nodes) {
        vecIn.push_back(n.packet);
      }
      
      const flatSwaps = wasmModule.route_packets(algo, vecIn);
      const swaps = [];
      
      if (flatSwaps.size() > 0 && flatSwaps.get(0) === -1) {
          alert("Routing failed: No valid bit-level routing path found.");
          vecIn.delete();
          flatSwaps.delete();
          setIsRouting(false);
          return;
      }

      for (let i = 0; i < flatSwaps.size(); i += 2) {
        swaps.push({ node1: flatSwaps.get(i), node2: flatSwaps.get(i+1) });
      }

      vecIn.delete();
      flatSwaps.delete();

      if (swaps.length >= 0) {
        let currentStateNodes = [...state.nodes];
        setSwapList(swaps);
        setCurrentStep(-1);
        setIsPlaying(true);
        setActiveSwap(null);
      }
    } catch (e) {
      console.error("Routing execution error", e);
      alert("Routing execution error");
    } finally {
      setIsRouting(false);
    }
  };


  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= swapList.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      handleNextStep();
    }, 800);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, swapList.length]);

  const handleNextStep = () => {
    if (currentStep >= swapList.length - 1) return;
    const nextStep = currentStep + 1;
    const swap = swapList[nextStep];
    
    const newNodes = state.nodes.map(n => {
      if (n.id === swap.node1) {
        const otherNode = state.nodes.find(x => x.id === swap.node2);
        return { ...n, packet: otherNode ? otherNode.packet : n.packet };
      }
      if (n.id === swap.node2) {
        const otherNode = state.nodes.find(x => x.id === swap.node1);
        return { ...n, packet: otherNode ? otherNode.packet : n.packet };
      }
      return n;
    });
    
    setState({ ...state, nodes: newNodes });
    setCurrentStep(nextStep);
    setActiveSwap(swap);
  };

  useEffect(() => {
    if (activeSwap) {
      const timer = setTimeout(() => {
        setActiveSwap(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [activeSwap, currentStep]);

  // Animate the active step in the right panel list
  useEffect(() => {
    if (stepListRef.current && currentStep >= 0 && currentStep < swapList.length) {
      const container = stepListRef.current;
      const activeEl = container.children[currentStep] as HTMLElement;
      if (activeEl) {
        // Mechanical scroll to center
        const targetScrollTop = activeEl.offsetTop - container.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
        
        animate(container, {
          scrollTop: targetScrollTop,
          duration: 400,
          ease: 'outExpo'
        });

        // Reset all other children
        Array.from(container.children).forEach((child: Element, idx: number) => {
          if (idx !== currentStep) {
            animate(child, {
              translateX: 0,
              boxShadow: '0px 0px 0px rgba(0,0,0,0)',
              duration: 200,
              ease: 'outQuad'
            });
          }
        });

        // Punch out the active element with elastic Brutalism
        const isDark = document.documentElement.classList.contains('dark');
        animate(activeEl, {
          translateX: -8,
          boxShadow: isDark ? '8px 8px 0px #fff' : '8px 8px 0px #000',
          duration: 500,
          ease: 'easeOutElastic(1, .6)'
        });
      }
    }
  }, [currentStep, swapList.length]);

  // Terminal blinking cursor for empty state
  useEffect(() => {
    if (swapList.length === 0) {
      const cursor = document.querySelector('.cursor-blink');
      if (cursor) {
        const anim = animate(cursor, {
          opacity: [1, 0],
          loop: true,
          duration: 800,
          ease: 'steps(2)' // Hard mechanical blink
        });
        return () => { anim.pause(); };
      }
    }
  }, [swapList.length]);

  // Global Button Animations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isDarkModeCurrent = document.documentElement.classList.contains('dark');

    const handleMouseOver = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('button, a.shrink-0');
      if (!btn || (btn as HTMLButtonElement).disabled) return;
      const related = (e.relatedTarget as HTMLElement)?.closest('button, a.shrink-0');
      if (btn === related) return; // Still inside the same button
      
      animate(btn, { scale: 1.03, rotate: 0, duration: 200, ease: 'outExpo' });
    };

    const handleMouseOut = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('button, a.shrink-0');
      if (!btn || (btn as HTMLButtonElement).disabled) return;
      const related = (e.relatedTarget as HTMLElement)?.closest('button, a.shrink-0');
      if (btn === related) return; // Still inside the same button
      
      animate(btn, { scale: 1, rotate: 0, duration: 200, ease: 'outExpo' });
    };

    const handleMouseDown = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('button, a.shrink-0');
      if (!btn || (btn as HTMLButtonElement).disabled) return;
      
      animate(btn, { scale: 0.96, duration: 100, ease: 'outQuad' });
    };

    const handleMouseUp = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('button, a.shrink-0');
      if (!btn || (btn as HTMLButtonElement).disabled) return;
      
      animate(btn, { scale: 1.03, duration: 200, ease: 'outExpo' });
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handlePrevStep = () => {
    if (currentStep < 0) return;
    const swap = swapList[currentStep];
    
    const newNodes = state.nodes.map(n => {
      if (n.id === swap.node1) {
        const otherNode = state.nodes.find(x => x.id === swap.node2);
        return { ...n, packet: otherNode ? otherNode.packet : n.packet };
      }
      if (n.id === swap.node2) {
        const otherNode = state.nodes.find(x => x.id === swap.node1);
        return { ...n, packet: otherNode ? otherNode.packet : n.packet };
      }
      return n;
    });
    
    setState({ ...state, nodes: newNodes });
    setCurrentStep(currentStep - 1);
    setActiveSwap(swap);
  };

  const handleDimensionChange = async (dim: number) => {
    setSwapList([]);
    setCurrentStep(-1);
    setActiveSwap(null);
    const numNodes = Math.pow(2, dim);
    const newState = {
        dimension: dim,
        nodes: Array.from({ length: numNodes }, (_, i) => ({ id: i, packet: i }))
    };
    setState(newState);
  };

  return (
    <main className={`h-screen w-screen flex flex-col lg:overflow-hidden overflow-y-auto text-black dark:text-white ${isDarkMode ? 'dark bg-black' : 'bg-[var(--color-canvas)]'}`}>
      {/* Top Header */}
      <div className="shrink-0 h-16 bg-white dark:bg-black text-black dark:text-white px-4 md:px-6 flex items-center justify-between border-b-[4px] border-black dark:border-white dark:border-white z-30 sticky top-0">
        <h1 className="text-lg sm:text-xl md:text-2xl font-display font-black uppercase m-0 leading-none truncate flex-1 min-w-0 mr-4">
          Routing Visualizer
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="shrink-0 flex items-center gap-1 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white px-2 py-1 hover:opacity-80 transition-opacity">
            <span className="font-heading font-bold uppercase text-[12px] leading-none">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <a href="https://github.com/thisiselijah/ubperm-routing.git" target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1 bg-[var(--color-yellow-sticker)] text-black border border-black dark:border-white px-2 py-1">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
          <span className="font-heading font-bold uppercase text-[12px] leading-none hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col lg:block">

        {/* Controls Panel */}
        <div className="order-2 lg:order-none w-full lg:w-80 p-4 lg:p-8 lg:absolute lg:left-0 lg:top-0 z-10 lg:h-full lg:overflow-y-auto">
          <CuteHelper />
          <div className="bg-white dark:bg-black p-4 shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] border-2 border-black dark:border-white w-full">
        <div className="mb-4">
            <span className="block text-sm font-heading font-bold mb-1 uppercase">Dimension</span>
            <div className="flex gap-2">
                <button 
                  onClick={() => handleDimensionChange(3)}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black dark:border-white ${state.dimension === 3 ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white'}`}
                >3-Cube</button>
                <button 
                  onClick={() => handleDimensionChange(4)}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black dark:border-white ${state.dimension === 4 ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white'}`}
                >4-Cube</button>
            </div>
        </div>

        <div className="mb-4">
            <span className="block text-sm font-heading font-bold mb-1 uppercase">Label Method</span>
            <div className="flex gap-2">
                <button 
                  onClick={() => setDisplayMethod('text')}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black dark:border-white ${displayMethod === 'text' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white'}`}
                >Detailed</button>
                <button 
                  onClick={() => setDisplayMethod('color')}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black dark:border-white ${displayMethod === 'color' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white'}`}
                >Compact</button>
            </div>
            {displayMethod === 'color' && (
                <p className="mt-2 text-xs font-body text-black dark:text-white">
                    Format: <span className="font-bold">Node</span> | <span className="text-[var(--color-primary)] font-bold">Packet</span>
                </p>
            )}
        </div>

        <div className="mb-4 flex flex-col items-start gap-1">
            <label htmlFor="algo-select" className="block text-sm font-heading font-bold uppercase">Algorithm</label>
            <select 
              id="algo-select"
              value={algo} 
              onChange={(e) => setAlgo(e.target.value as any)}
              disabled={isRouting}
              className="bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white font-body px-1.5 py-1 rounded-none w-full outline-none disabled:opacity-50"
            >
                <option value="merge">Merge Sort</option>
                <option value="bfs">Breadth-First Search (BFS)</option>
                <option value="astar">A* Search</option>
                <option value="entropy_cycle">Entropy-Cycle Search</option>
                <option value="beam_search">Beam Search</option>
                <option value="stochastic">Stochastic Search (Tabu)</option>
            </select>
        </div>

        <button 
          onClick={handleShuffle}
          disabled={isRouting}
          className="w-full mt-4 bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white px-4 py-1.5 text-[12px] font-heading font-bold uppercase disabled:opacity-50"
        >
          Randomly Permutate
        </button>

        <button 
          onClick={handleRoute}
          disabled={isRouting}
          className="w-full mt-2 bg-[var(--color-primary)] text-white border border-black dark:border-white px-4 py-1.5 text-[12px] font-heading font-bold uppercase disabled:opacity-50"
        >
          {isRouting ? "Routing..." : "Route"}
        </button>
        </div>
      </div>

        {/* Right panel: Swap Steps */}
        <div className="hidden lg:flex order-3 lg:order-none w-full lg:w-80 p-4 lg:p-8 lg:absolute lg:right-0 lg:top-0 z-10 lg:h-full flex-col lg:items-end">
          <div className="bg-white dark:bg-black border-2 border-black dark:border-white shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] w-full flex flex-col h-[300px] lg:h-[calc(100vh-250px)] overflow-hidden">
            <div className="p-4 border-b-2 border-black dark:border-white bg-[var(--color-tint-periwinkle)] text-black">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-heading font-bold text-sm uppercase m-0">Swap Steps</h2>
                  <div className="text-xs font-body mt-1">Step: {currentStep + 1} / {swapList.length}</div>
                </div>
              </div>
            </div>
            <div ref={stepListRef} className="flex-1 overflow-y-auto p-4 space-y-2 font-body">
              {swapList.map((swap, idx) => (
                <div key={idx} className={`p-2 text-xs border border-black dark:border-white ${idx === currentStep ? 'bg-black dark:bg-white text-white dark:text-black font-bold' : 'bg-white dark:bg-black text-black dark:text-white'}`}>
                  <span className="font-bold">Step {idx + 1}:</span> Node {swap.node1} ↔ Node {swap.node2}
                </div>
              ))}
              {swapList.length === 0 && (
                <div className="empty-state-text text-sm text-center font-heading font-bold py-10 tracking-widest text-black/50 dark:text-white/50 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-1">
                    [ WAITING FOR SEQUENCE 
                    <span className="cursor-blink w-2.5 h-4 bg-black/50 dark:bg-white/50 inline-block"></span> ]
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* 1996 Catalog-style Retro Playback Controls */}
          <div className="w-full mt-4 bg-white dark:bg-black border-2 border-black dark:border-white shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] flex-shrink-0 relative z-20 flex flex-col p-3 gap-2">
            <div className="font-heading font-bold text-[10px] uppercase tracking-widest text-center border-b-2 border-black dark:border-white pb-1 mb-1">
              Playback Controls
            </div>
            <div className="flex justify-between items-center gap-2">
              <button 
                onClick={() => { setIsPlaying(false); handlePrevStep(); }} 
                disabled={currentStep < 0} 
                className="flex-1 h-10 bg-[var(--color-tint-periwinkle)] text-black border-2 border-black dark:border-white flex items-center justify-center disabled:opacity-40 disabled:grayscale transition-colors"
                title="Previous Step"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <polygon points="18,4 6,12 18,20" />
                  <rect x="4" y="4" width="4" height="16" />
                </svg>
              </button>
              
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                disabled={currentStep < 0 && currentStep >= swapList.length - 1} 
                className={`flex-[2] h-12 border-2 border-black dark:border-white flex items-center justify-center font-heading font-bold uppercase text-[12px] tracking-wider disabled:opacity-40 disabled:grayscale transition-colors ${isPlaying ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-[var(--color-primary)] text-white'}`}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                   <div className="flex items-center gap-2">
                     <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                       <rect x="5" y="4" width="5" height="16" />
                       <rect x="14" y="4" width="5" height="16" />
                     </svg>
                     PAUSE
                   </div>
                ) : (
                   <div className="flex items-center gap-2">
                     <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                       <polygon points="6,4 20,12 6,20" />
                     </svg>
                     PLAY
                   </div>
                )}
              </button>

              <button 
                onClick={() => { setIsPlaying(false); handleNextStep(); }} 
                disabled={currentStep >= swapList.length - 1} 
                className="flex-1 h-10 bg-[var(--color-tint-periwinkle)] text-black border-2 border-black dark:border-white flex items-center justify-center disabled:opacity-40 disabled:grayscale transition-colors"
                title="Next Step"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <polygon points="6,4 18,12 6,20" />
                  <rect x="16" y="4" width="4" height="16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="order-1 lg:order-none w-full h-[45vh] min-h-[350px] lg:h-full lg:min-h-0 p-4 lg:pt-8 lg:pb-8 lg:px-[352px]">
          <div className="w-full h-full bg-white dark:bg-black border-4 border-black dark:border-white overflow-hidden relative">
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
              <OrbitControls makeDefault />
              <Hypercube dimension={state.dimension} nodes={state.nodes} displayMethod={displayMethod} shuffleTrigger={shuffleTrigger} activeSwap={activeSwap} isDarkMode={isDarkMode} currentStep={currentStep} />
            </Canvas>
          </div>
        </div>

      </div>
    </main>
  );
}