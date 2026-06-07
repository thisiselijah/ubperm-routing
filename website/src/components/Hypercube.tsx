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
  isSwapping?: boolean | null;
}

const Node = ({ id, packet, position, displayMethod, shuffleTrigger, isSwapping }: NodeProps) => {
  const activeColor = "#e91d2a"; // Dell red for swapping nodes
  const baseColor = "#a5b8c0"; // Steel tint for resting nodes

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial 
          color={isSwapping ? activeColor : baseColor} 
          emissive="#000000" 
          emissiveIntensity={0} 
        />
      </mesh>
      
      <Html center position={[0, 0.35, 0]} className="pointer-events-none">
        {displayMethod === 'text' ? (
          <div className="bg-white text-black border border-black p-1 font-body text-[12px] whitespace-nowrap shadow-[2px_2px_0_rgba(0,0,0,1)]">
            <div className="font-heading font-bold border-b border-black mb-1 pb-1 uppercase">Node {id}</div>
            <div className="flex gap-1">
              Packet: <span key={`${id}-${packet}`} className={shuffleTrigger > 0 ? "text-[var(--color-primary)] font-bold animate-spin-packet inline-block" : "font-bold"}>{packet}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white text-black border border-black px-1.5 py-0.5 font-heading font-bold text-[12px] whitespace-nowrap shadow-[1px_1px_0_rgba(0,0,0,1)] flex gap-1.5">
            <span title="Node ID">{id}</span>
            <span>|</span>
            <span key={`${id}-${packet}`} className={`text-[var(--color-primary)] ${shuffleTrigger > 0 ? "animate-spin-packet inline-block" : ""}`} title="Packet ID">{packet}</span>
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
  activeSwap?: { node1: number, node2: number } | null;
}

export default function Hypercube({ dimension, nodes, displayMethod, shuffleTrigger, activeSwap }: HypercubeProps) {
  const numNodes = Math.pow(2, dimension);
  
  const { positions, edges } = useMemo(() => {
    const pos: [number, number, number][] = [];
    const edgeLines: { pts: [number, number, number][]; n1: number; n2: number }[] = [];
    
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
                edgeLines.push({ pts: [pos[i], pos[j]], n1: i, n2: j });
            }
        }
    }

    return { positions: pos, edges: edgeLines };
  }, [dimension, numNodes]);

  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      {edges.map(({ pts, n1, n2 }, idx) => {
        const isActive = activeSwap && ((activeSwap.node1 === n1 && activeSwap.node2 === n2) || (activeSwap.node1 === n2 && activeSwap.node2 === n1));
        return (
          <Line 
            key={`edge-${idx}`} 
            points={pts} 
            color={isActive ? "#e91d2a" : "#000000"} 
            lineWidth={isActive ? 4 : 1} 
          />
        );
      })}
      {nodes.slice(0, numNodes).map((node, idx) => {
        const isSwapping = activeSwap && (activeSwap.node1 === node.id || activeSwap.node2 === node.id);
        return (
          <Node key={node.id} id={node.id} packet={node.packet} position={positions[idx]} displayMethod={displayMethod} shuffleTrigger={shuffleTrigger} isSwapping={isSwapping} />
        );
      })}
    </group>
  );
}
