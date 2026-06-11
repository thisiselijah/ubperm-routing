"use client";

import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line, Edges } from '@react-three/drei';
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
    let t = elapsed / 700; // Match the 600ms timeout
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
        <octahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial color="#fcc20f" />
        <Edges color="#000000" />
      </mesh>
      <mesh ref={meshRef2} position={p2}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial color="#fcc20f" />
        <Edges color="#000000" />
      </mesh>
    </group>
  );
};

const Node = ({ id, packet, position, displayMethod, shuffleTrigger, isSwapping, isDarkMode }: NodeProps) => {
  // Dark wooden aesthetics
  const activeColor = "#ff4500"; // Glowing amber/fire for swapping
  const baseColor = isDarkMode ? "#2b1b12" : "#3e2723"; // Very dark ebony/walnut wood
  
  const [justFinished, setJustFinished] = useState(false);
  const [justShuffled, setJustShuffled] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  const prevIsSwapping = useRef(isSwapping);
  const prevShuffleTrigger = useRef(shuffleTrigger);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (materialRef.current) {
      const targetIntensity = hovered ? 0.7 : (isSwapping ? 0.4 : 0);
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity, 
        targetIntensity, 
        delta * 12
      );
    }
    if (meshRef.current) {
      const targetScale = hovered ? 1.15 : 1;
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, delta * 12)
      );
    }
  });

  const nodeGeo = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.28, 1); 
    const pos = geo.attributes.position;
    
    const displacementMap = new Map();
    // Reduce the maximum deformation ratio to keep angles obtuse and safe
    const maxDeformation = 0.12; // ±6% from the radius
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      
      const kx = Math.round(x * 1000);
      const ky = Math.round(y * 1000);
      const kz = Math.round(z * 1000);
      const key = `${kx},${ky},${kz}`;
      
      if (!displacementMap.has(key)) {
        // Displace the vertex purely along its radial direction (scale it from center)
        // This prevents vertices from crossing each other and forming sharp shards
        const scale = 1 + (Math.random() - 0.5) * maxDeformation;
        displacementMap.set(key, scale);
      }
      
      const scale = displacementMap.get(key);
      pos.setXYZ(i, x * scale, y * scale, z * scale);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

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

  // Determine emissive color (hover takes precedence with a golden/amber hue)
  const currentEmissiveColor = hovered ? "#ffaa00" : (isSwapping ? activeColor : "#000000");

  return (
    <group position={position}>
      {/* Hand-carved Wooden Node */}
      <mesh 
        ref={meshRef}
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
      >
        <primitive object={nodeGeo} attach="geometry" />
        <meshStandardMaterial 
          ref={materialRef}
          color={isSwapping ? activeColor : baseColor} 
          emissive={currentEmissiveColor} 
          emissiveIntensity={0} // Animated by useFrame
          metalness={0.05}
          roughness={0.75}
          flatShading={true}
        />
      </mesh>
      
      <Html center position={[0, 0.35, 0]} className="pointer-events-none">
        {displayMethod === 'text' ? (
          <div className="bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white p-1 font-body text-[12px] whitespace-nowrap shadow-[2px_2px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(255,255,255,1)]">
            <div className="font-heading font-bold border-b border-black dark:border-white mb-1 pb-1 uppercase">Node {id}</div>
            <div className="flex gap-1">
              Packet: <span key={isSwapping ? `swapping-${id}` : `${id}-${packet}`} className={`text-[var(--color-primary)] font-bold ${(justFinished || justShuffled) && !isSwapping ? "animate-spin-packet inline-block" : ""}`}>{isSwapping ? <span className="opacity-50">...</span> : packet}</span>
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
            // Spaced out the nodes by increasing the sizes of both the inner and outer cubes
            const size = inner ? 1.8 : 4.5;
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1.2} />
      
      <gridHelper 
        args={[20, 20, isDarkMode ? "#ffffff" : "#000000", isDarkMode ? "#333333" : "#cccccc"]} 
        position={[0, -5, 0]} 
      />

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
