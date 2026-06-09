"use client";

import { useMemo, useRef, useState, useEffect } from 'react';
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
  isDarkMode?: boolean;
}


const SwappingPackets = ({ p1, p2 }: { p1: [number,number,number], p2: [number,number,number] }) => {
  const meshRef1 = useRef<THREE.Mesh>(null);
  const meshRef2 = useRef<THREE.Mesh>(null);
  const [start] = useState(Date.now());

  const { A, B } = useMemo(() => {
    const A = new THREE.Vector3(...p1);
    const B = new THREE.Vector3(...p2);
    return { A, B };
  }, [p1, p2]);

  useFrame(() => {
    const elapsed = Date.now() - start;
    let t = elapsed / 600; // Match the 600ms timeout
    if (t > 1) t = 1;
    
    // Smooth ease-in-out
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    if (meshRef1.current) {
      const basePos = A.clone().lerp(B, easeT);
      meshRef1.current.position.copy(basePos);
      meshRef1.current.rotation.x = elapsed * 0.005;
      meshRef1.current.rotation.y = elapsed * 0.005;
    }
    if (meshRef2.current) {
      const basePos = B.clone().lerp(A, easeT);
      meshRef2.current.position.copy(basePos);
      meshRef2.current.rotation.x = -elapsed * 0.005;
      meshRef2.current.rotation.y = -elapsed * 0.005;
    }
  });

  return (
    <group>
      <mesh ref={meshRef1} position={p1}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshBasicMaterial color="#fcc20f" />
      </mesh>
      <mesh ref={meshRef2} position={p2}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshBasicMaterial color="#fcc20f" />
      </mesh>
    </group>
  );
};

const Node = ({ id, packet, position, displayMethod, shuffleTrigger, isSwapping, isDarkMode }: NodeProps) => {
  const activeColor = "#e91d2a"; // Dell red for swapping nodes
  const baseColor = isDarkMode ? "#ffffff" : "#a5b8c0"; // White in dark mode, Steel tint for resting nodes
  const [justFinished, setJustFinished] = useState(false);
  const prevIsSwapping = useRef(isSwapping);
  const prevShuffleTrigger = useRef(shuffleTrigger);

  const [justShuffled, setJustShuffled] = useState(false);

  useEffect(() => {
    if (prevIsSwapping.current && !isSwapping && shuffleTrigger === prevShuffleTrigger.current) {
      setJustFinished(true);
      const timer = setTimeout(() => setJustFinished(false), 600);
      prevIsSwapping.current = isSwapping;
      return () => clearTimeout(timer);
    }
    
    if (shuffleTrigger !== prevShuffleTrigger.current && shuffleTrigger > 0) {
      setJustShuffled(true);
      const timer = setTimeout(() => setJustShuffled(false), 600);
      prevShuffleTrigger.current = shuffleTrigger;
      prevIsSwapping.current = isSwapping;
      return () => clearTimeout(timer);
    }
    
    prevIsSwapping.current = isSwapping;
    prevShuffleTrigger.current = shuffleTrigger;
  }, [isSwapping, shuffleTrigger]);

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
          <div className="bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white p-1 font-body text-[12px] whitespace-nowrap shadow-[2px_2px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(255,255,255,1)]">
            <div className="font-heading font-bold border-b border-black dark:border-white mb-1 pb-1 uppercase">Node {id}</div>
            <div className="flex gap-1">
              Packet: <span key={isSwapping ? `swapping-${id}` : `${id}-${packet}`} className={(justFinished || justShuffled) && !isSwapping ? "text-[var(--color-primary)] font-bold animate-spin-packet inline-block" : "font-bold"}>{isSwapping ? <span className="opacity-50">...</span> : packet}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white px-1.5 py-0.5 font-heading font-bold text-[12px] whitespace-nowrap shadow-[1px_1px_0_rgba(0,0,0,1)] dark:shadow-[1px_1px_0_rgba(255,255,255,1)] flex gap-1.5">
            <span title="Node ID">{id}</span>
            <span>|</span>
            <span key={isSwapping ? `swapping-${id}` : `${id}-${packet}`} className={`text-[var(--color-primary)] ${(justFinished || justShuffled) && !isSwapping ? "animate-spin-packet inline-block" : ""}`} title="Packet ID">{isSwapping ? <span className="opacity-50">...</span> : packet}</span>
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
  isDarkMode?: boolean;
  currentStep?: number;
}

export default function Hypercube({ dimension, nodes, displayMethod, shuffleTrigger, activeSwap, isDarkMode, currentStep }: HypercubeProps) {
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

  const activePts = useMemo(() => {
    if (!activeSwap) return null;
    const n1 = activeSwap.node1;
    const n2 = activeSwap.node2;
    if (positions[n1] && positions[n2]) {
      return { p1: positions[n1], p2: positions[n2] };
    }
    return null;
  }, [activeSwap, positions]);

  const animKey = activeSwap ? `swap-${activeSwap.node1}-${activeSwap.node2}-${currentStep}` : 'none';

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
            color={isActive ? "#e91d2a" : isDarkMode ? "#ffffff" : "#000000"} 
            lineWidth={isActive ? 4 : 1} 
          />
        );
      })}
      {activePts && (
        <SwappingPackets key={animKey} p1={activePts.p1} p2={activePts.p2} />
      )}
      {nodes.slice(0, numNodes).map((node, idx) => {
        const isSwapping = activeSwap && (activeSwap.node1 === node.id || activeSwap.node2 === node.id);
        return (
          <Node key={node.id} id={node.id} packet={node.packet} position={positions[idx]} displayMethod={displayMethod} shuffleTrigger={shuffleTrigger} isSwapping={isSwapping} isDarkMode={isDarkMode} />
        );
      })}
    </group>
  );
}
