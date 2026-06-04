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
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShuffle = async () => {
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

  const handleDimensionChange = async (dim: number) => {
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

        <button 
          onClick={handleShuffle}
          className="w-full mt-4 bg-[var(--color-ink)] hover:bg-[var(--color-body-strong)] text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Randomly Permutate
        </button>
      </div>

      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <OrbitControls makeDefault />
          <Hypercube dimension={state.dimension} nodes={state.nodes} displayMethod={displayMethod} shuffleTrigger={shuffleTrigger} />
        </Canvas>
      </div>
    </main>
  );
}