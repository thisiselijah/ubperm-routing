"use client";

import { useEffect, useState } from "react";
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
  const [algo, setAlgo] = useState<'merge' | 'bfs'>('merge');
  const [isRouting, setIsRouting] = useState(false);
  const [activeSwap, setActiveSwap] = useState<{ node1: number, node2: number } | null>(null);
  const [swapList, setSwapList] = useState<{ node1: number, node2: number }[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [state, setState] = useState<AppState>({
    dimension: 3,
    nodes: Array.from({ length: 8 }, (_, i) => ({ id: i, packet: i }))
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setState(data);
    } catch (e) {
      console.error("Failed to fetch state", e);
    }
  };

  useEffect(() => {
    // Polling API every 1000ms
    if (isRouting) return; // Pause polling during routing animation
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [isRouting]);

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
    try {
        await fetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newState)
        });
    } catch (e) {
        console.error("Error posting state", e);
    }
  };

  const handleRoute = async () => {
    if (isRouting) return;
    setIsRouting(true);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algo, nodes: state.nodes })
      });
      const data = await res.json();
      
      if (data.success && data.swaps) {
        let currentStateNodes = [...state.nodes];
        setSwapList(data.swaps);
        setCurrentStep(-1);
        
        let stepIdx = 0;
        for (const swap of data.swaps) {
          setActiveSwap(swap);
          setCurrentStep(stepIdx);
          
          // Pause before next swap
          await new Promise(r => setTimeout(r, 800));
          
          // Send to backend state to sync
          await fetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'swap', node1: swap.node1, node2: swap.node2 })
          });
          
          // Update local state directly so UI updates smoothly
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
      } else {
        alert("Routing failed: " + (data.error || "Unknown error"));
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
    try {
        await fetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newState)
        });
    } catch (e) {
        console.error("Error posting state", e);
    }
  };

  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden bg-[var(--color-canvas)]">
      <div className="absolute top-8 left-8 z-10 p-6 bg-[var(--color-surface-soft)] rounded-lg shadow-md border border-[var(--color-hairline-soft)] max-w-sm">
        <h1 className="text-3xl mb-2 text-[var(--color-ink)]">Routing Visualizer</h1>
        <p className="text-[var(--color-muted-soft)] mb-6 text-sm">
            Hypercube Deflection Routing Configuration
        </p>

        <div className="mb-4">
            <span className="block text-sm font-medium mb-1 text-[var(--color-body-strong)]">Dimension</span>
            <div className="flex gap-2">
                <button 
                  onClick={() => handleDimensionChange(3)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${state.dimension === 3 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-card)] text-[var(--color-body)]'}`}
                >3-Cube</button>
                <button 
                  onClick={() => handleDimensionChange(4)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${state.dimension === 4 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-card)] text-[var(--color-body)]'}`}
                >4-Cube</button>
            </div>
        </div>

        <div className="mb-4">
            <span className="block text-sm font-medium mb-1 text-[var(--color-body-strong)]">Label Method</span>
            <div className="flex gap-2">
                <button 
                  onClick={() => setDisplayMethod('text')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${displayMethod === 'text' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-card)] text-[var(--color-body)]'}`}
                >Detailed</button>
                <button 
                  onClick={() => setDisplayMethod('color')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${displayMethod === 'color' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-card)] text-[var(--color-body)]'}`}
                >Compact</button>
            </div>
            {displayMethod === 'color' && (
                <p className="mt-2 text-xs text-[var(--color-muted-soft)]">
                    Format: <span className="text-[var(--color-ink)]">Node</span> | <span className="text-[var(--color-primary)] font-medium">Packet</span>
                </p>
            )}
        </div>

        <div className="mb-4">
            <span className="block text-sm font-medium mb-1 text-[var(--color-body-strong)]">Algorithm</span>
            <div className="flex gap-2">
                <button 
                  onClick={() => setAlgo('merge')}
                  disabled={isRouting}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${algo === 'merge' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-card)] text-[var(--color-body)]'} disabled:opacity-50`}
                >Merge Sort</button>
                <button 
                  onClick={() => setAlgo('bfs')}
                  disabled={isRouting}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${algo === 'bfs' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-card)] text-[var(--color-body)]'} disabled:opacity-50`}
                >BFS</button>
            </div>
        </div>

        <button 
          onClick={handleShuffle}
          disabled={isRouting}
          className="w-full mt-4 bg-[var(--color-ink)] hover:bg-[var(--color-body-strong)] disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Randomly Permutate
        </button>

        <button 
          onClick={handleRoute}
          disabled={isRouting}
          className="w-full mt-2 bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isRouting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Routing...
            </>
          ) : "Route"}
        </button>
      </div>

      {/* Right panel: Swap Steps */}
      <div className="absolute top-8 right-8 z-10 w-64 max-h-[80vh] flex flex-col bg-[var(--color-surface-soft)] rounded-lg shadow-md border border-[var(--color-hairline-soft)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-card)]">
          <h2 className="font-medium text-sm text-[var(--color-ink)]">Swap Steps</h2>
          <div className="text-xs text-[var(--color-muted-soft)] mt-1">Total: {swapList.length} swaps</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {swapList.map((swap, idx) => (
            <div key={idx} className={`p-2 rounded text-xs border ${idx === currentStep ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)] text-blue-800 font-medium' : 'bg-[var(--color-surface)] border-[var(--color-hairline-soft)] text-[var(--color-body)]'}`}>
              <span className="font-bold">Step {idx + 1}:</span> Node {swap.node1} ↔ Node {swap.node2}
            </div>
          ))}
          {swapList.length === 0 && (
            <div className="text-xs text-[var(--color-muted-soft)] text-center italic py-4">No routing sequence active</div>
          )}
        </div>
      </div>

      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <OrbitControls makeDefault />
          <Hypercube dimension={state.dimension} nodes={state.nodes} displayMethod={displayMethod} shuffleTrigger={shuffleTrigger} activeSwap={activeSwap} />
        </Canvas>
      </div>
    </main>
  );
}