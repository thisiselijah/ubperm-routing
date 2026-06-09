"use client";

import { useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Hypercube from "@/components/Hypercube";

interface AppState {
  dimension: number;
  nodes: { id: number; packet: number }[];
}

export default function Home() {
  const [displayMethod, setDisplayMethod] = useState<'text' | 'color'>('text');
  const [shuffleTrigger, setShuffleTrigger] = useState(0);
  const [algo, setAlgo] = useState<'merge' | 'bfs' | 'astar' | 'entropy_cycle' | 'beam_search'>('merge');
  const [isRouting, setIsRouting] = useState(false);
  const [activeSwap, setActiveSwap] = useState<{ node1: number, node2: number } | null>(null);
  const [swapList, setSwapList] = useState<{ node1: number, node2: number }[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
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
        
        let stepIdx = 0;
        for (const swap of swaps) {
          setActiveSwap(swap);
          setCurrentStep(stepIdx);
          
          await new Promise(r => setTimeout(r, 800));
          
          const n1 = currentStateNodes.find(n => n.id === swap.node1);
          const n2 = currentStateNodes.find(n => n.id === swap.node2);
          if (n1 && n2) {
            const temp = n1.packet;
            n1.packet = n2.packet;
            n2.packet = temp;
          }
          
          setState({ ...state, nodes: [...currentStateNodes] });
          setShuffleTrigger(s => s + 1);
          stepIdx++;
        }
        setActiveSwap(null);
      }
    } catch (e) {
      console.error("Routing execution error", e);
      alert("Routing execution error");
    } finally {
      setIsRouting(false);
    }
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
    <main className="h-screen w-screen flex flex-col bg-[var(--color-canvas)] lg:overflow-hidden overflow-y-auto">
      {/* Top Header */}
      <div className="shrink-0 h-16 bg-white text-black px-4 md:px-6 flex items-center justify-between border-b-[4px] border-black z-30 sticky top-0">
        <h1 className="text-xl md:text-2xl font-display font-black uppercase m-0 leading-none truncate">Routing Visualizer</h1>
        <a href="https://github.com/thisiselijah/ubperm-routing.git" target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1 bg-[var(--color-yellow-sticker)] text-black border border-black px-2 py-1 shadow-[2px_2px_0_#000] ml-2">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
          <span className="font-heading font-bold uppercase text-[12px] leading-none hidden sm:inline">GitHub</span>
        </a>
      </div>

      <div className="flex-1 relative flex flex-col lg:block">

        {/* Controls Panel */}
        <div className="w-full lg:w-80 p-4 lg:p-8 lg:absolute lg:left-0 lg:top-0 z-10 lg:h-full lg:overflow-y-auto">
          <div className="bg-white p-4 shadow-[4px_4px_0_#000] border-2 border-black w-full lg:w-72">
        <div className="mb-4">
            <span className="block text-sm font-heading font-bold mb-1 uppercase">Dimension</span>
            <div className="flex gap-2">
                <button 
                  onClick={() => handleDimensionChange(3)}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black ${state.dimension === 3 ? 'bg-black text-white' : 'bg-white text-black'}`}
                >3-Cube</button>
                <button 
                  onClick={() => handleDimensionChange(4)}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black ${state.dimension === 4 ? 'bg-black text-white' : 'bg-white text-black'}`}
                >4-Cube</button>
            </div>
        </div>

        <div className="mb-4">
            <span className="block text-sm font-heading font-bold mb-1 uppercase">Label Method</span>
            <div className="flex gap-2">
                <button 
                  onClick={() => setDisplayMethod('text')}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black ${displayMethod === 'text' ? 'bg-black text-white' : 'bg-white text-black'}`}
                >Detailed</button>
                <button 
                  onClick={() => setDisplayMethod('color')}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black ${displayMethod === 'color' ? 'bg-black text-white' : 'bg-white text-black'}`}
                >Compact</button>
            </div>
            {displayMethod === 'color' && (
                <p className="mt-2 text-xs font-body">
                    Format: <span className="font-bold">Node</span> | <span className="text-[var(--color-primary)] font-bold">Packet</span>
                </p>
            )}
        </div>

        <div className="mb-4">
            <span className="block text-sm font-heading font-bold mb-1 uppercase">Algorithm</span>
            <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setAlgo('merge')}
                  disabled={isRouting}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black ${algo === 'merge' ? 'bg-black text-white' : 'bg-white text-black'} disabled:opacity-50`}
                >Merge Sort</button>
                <button 
                  onClick={() => setAlgo('bfs')}
                  disabled={isRouting}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black ${algo === 'bfs' ? 'bg-black text-white' : 'bg-white text-black'} disabled:opacity-50`}
                >BFS</button>
                <button 
                  onClick={() => setAlgo('astar')}
                  disabled={isRouting}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black ${algo === 'astar' ? 'bg-black text-white' : 'bg-white text-black'} disabled:opacity-50`}
                >A* Search</button>
                <button 
                  onClick={() => setAlgo('entropy_cycle')}
                  disabled={isRouting}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black ${algo === 'entropy_cycle' ? 'bg-black text-white' : 'bg-white text-black'} disabled:opacity-50`}
                >Entropy-Cycle</button>
                <button 
                  onClick={() => setAlgo('beam_search')}
                  disabled={isRouting}
                  className={`px-4 py-1.5 text-[12px] font-heading font-bold uppercase border border-black ${algo === 'beam_search' ? 'bg-black text-white' : 'bg-white text-black'} disabled:opacity-50`}
                >Beam Search</button>
            </div>
        </div>

        <button 
          onClick={handleShuffle}
          disabled={isRouting}
          className="w-full mt-4 bg-white text-black border border-black px-4 py-1.5 text-[12px] font-heading font-bold uppercase disabled:opacity-50"
        >
          Randomly Permutate
        </button>

        <button 
          onClick={handleRoute}
          disabled={isRouting}
          className="w-full mt-2 bg-[var(--color-primary)] text-white border border-black px-4 py-1.5 text-[12px] font-heading font-bold uppercase disabled:opacity-50"
        >
          {isRouting ? "Routing..." : "Route"}
        </button>
        </div>
      </div>

        {/* Right panel: Swap Steps */}
        <div className="w-full lg:w-80 p-4 lg:p-8 lg:absolute lg:right-0 lg:top-0 z-10 lg:h-full flex flex-col lg:items-end">
          <div className="bg-white border-2 border-black shadow-[4px_4px_0_#000] w-full lg:w-64 flex flex-col h-[400px] lg:h-auto lg:max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b-2 border-black bg-[var(--color-tint-periwinkle)]">
              <h2 className="font-heading font-bold text-sm uppercase m-0">Swap Steps</h2>
              <div className="text-xs font-body mt-1">Total: {swapList.length} swaps</div>
            </div>
            <div ref={stepListRef} className="flex-1 overflow-y-auto p-4 space-y-2 font-body">
              {swapList.map((swap, idx) => (
                <div key={idx} className={`p-2 text-xs border border-black ${idx === currentStep ? 'bg-black text-white font-bold' : 'bg-white text-black'}`}>
                  <span className="font-bold">Step {idx + 1}:</span> Node {swap.node1} ↔ Node {swap.node2}
                </div>
              ))}
              {swapList.length === 0 && (
                <div className="text-xs text-center italic py-4">No routing sequence active</div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="w-full h-[50vh] min-h-[400px] lg:h-full lg:min-h-0 p-4 lg:pt-8 lg:pb-8 lg:pl-[352px] lg:pr-[320px]">
          <div className="w-full h-full bg-white border-4 border-black overflow-hidden relative shadow-[4px_4px_0_#000] lg:shadow-none">
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
              <OrbitControls makeDefault />
              <Hypercube dimension={state.dimension} nodes={state.nodes} displayMethod={displayMethod} shuffleTrigger={shuffleTrigger} activeSwap={activeSwap} />
            </Canvas>
          </div>
        </div>

      </div>
    </main>
  );
}