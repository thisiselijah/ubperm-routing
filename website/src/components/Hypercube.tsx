"use client";

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';

interface NodeProps {
  id: number;
  packet: number;
  position: [number, number, number];
  displayMethod: 'text' | 'color';
  shuffleTrigger: number;
}

const Node = ({ id, packet, position, displayMethod, shuffleTrigger }: NodeProps) => {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color="#cc785c" />
      </mesh>
      
      <Html center position={[0, 0.35, 0]} className="pointer-events-none">
        {displayMethod === 'text' ? (
          <div className="bg-[var(--color-surface-dark)] text-[var(--color-on-dark)] px-2 py-1 rounded text-xs whitespace-nowrap shadow-md">
            <div className="font-bold border-b border-[var(--color-surface-dark-elevated)] mb-1 pb-1">Node {id}</div>
            <div className="text-[var(--color-primary)] flex gap-1">
              Packet: <span key={shuffleTrigger} className={shuffleTrigger > 0 ? "animate-spin-packet" : ""}>{packet}</span>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-surface-dark)] px-1.5 py-0.5 rounded text-xs whitespace-nowrap shadow-md font-bold flex gap-1.5 border border-[var(--color-surface-dark-elevated)] shadow-lg shadow-black/20">
            <span className="text-[var(--color-on-dark)]" title="Node ID">{id}</span>
            <span className="text-[var(--color-surface-dark-elevated)]">|</span>
            <span key={shuffleTrigger} className={`text-[var(--color-primary)] ${shuffleTrigger > 0 ? "animate-spin-packet" : ""}`} title="Packet ID">{packet}</span>
          </div>
        )}
      </Html>
    </group>
  );
};

interface HypercubeProps {
  dimension: number;
  nodes: { id: number; packet: number }[];
  displayMethod: 'text' | 'color';
  shuffleTrigger: number;
}

export default function Hypercube({ dimension, nodes, displayMethod, shuffleTrigger }: HypercubeProps) {
  const numNodes = Math.pow(2, dimension);
  
  const { positions, edges } = useMemo(() => {
    const pos: [number, number, number][] = [];
    const edgeLines: [number, number, number][][] = [];
    
    for (let i = 0; i < numNodes; i++) {
        let x = 0, y = 0, z = 0;
        
        if (dimension === 3) {
            x = (i & 1) ? 2 : -2;
            y = (i & 2) ? 2 : -2;
            z = (i & 4) ? 2 : -2;
        } else if (dimension === 4) {
            const inner = (i & 8) === 0;
            const size = inner ? 1.5 : 3.5;
            x = (i & 1) ? size : -size;
            y = (i & 2) ? size : -size;
            z = (i & 4) ? size : -size;
        }
        
        pos.push([x, y, z]);
    }

    for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
            // Check if they differ by exactly 1 bit
            const xor = i ^ j;
            if ((xor & (xor - 1)) === 0) {
                edgeLines.push([pos[i], pos[j]]);
            }
        }
    }

    return { positions: pos, edges: edgeLines };
  }, [dimension, numNodes]);

  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      {edges.map((pts, idx) => (
        <Line key={`edge-${idx}`} points={pts} color="#8e8b82" lineWidth={1} />
      ))}
      {nodes.slice(0, numNodes).map((node, idx) => (
        <Node key={node.id} id={node.id} packet={node.packet} position={positions[idx]} displayMethod={displayMethod} shuffleTrigger={shuffleTrigger} />
      ))}
    </group>
  );
}
