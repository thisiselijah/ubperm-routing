"use client";

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Edges } from '@react-three/drei';

const PlayIcon = ({ disabled }: { disabled: boolean }) => (
  // Points Right (+X)
  <mesh position={[0, 0.26, 0]}>
    <cylinderGeometry args={[0.5, 0.5, 0.1, 3]} />
    <meshStandardMaterial color={disabled ? "#888888" : "#e91d2a"} />
    <Edges color="black" />
  </mesh>
);

const PauseIcon = ({ disabled }: { disabled: boolean }) => (
  <group position={[0, 0.26, 0]}>
    <mesh position={[-0.2, 0, 0]}>
      <boxGeometry args={[0.2, 0.1, 0.8]} />
      <meshStandardMaterial color={disabled ? "#888888" : "#e91d2a"} />
      <Edges color="black" />
    </mesh>
    <mesh position={[0.2, 0, 0]}>
      <boxGeometry args={[0.2, 0.1, 0.8]} />
      <meshStandardMaterial color={disabled ? "#888888" : "#e91d2a"} />
      <Edges color="black" />
    </mesh>
  </group>
);

const ArrowLeftIcon = ({ disabled }: { disabled: boolean }) => (
  // Points Left (-X)
  <mesh position={[0, 0.26, 0]} rotation={[0, Math.PI, 0]}>
    <cylinderGeometry args={[0.5, 0.5, 0.1, 3]} />
    <meshStandardMaterial color={disabled ? "#888888" : "#000000"} />
    <Edges color="black" />
  </mesh>
);

const ArrowRightIcon = ({ disabled }: { disabled: boolean }) => (
  // Points Right (+X)
  <mesh position={[0, 0.26, 0]}>
    <cylinderGeometry args={[0.5, 0.5, 0.1, 3]} />
    <meshStandardMaterial color={disabled ? "#888888" : "#000000"} />
    <Edges color="black" />
  </mesh>
);

const KeyboardKey = ({
  position,
  icon: Icon,
  onClick,
  disabled,
}: any) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Depth of the key press (Y-axis)
  const yOffset = pressed && !disabled ? -0.15 : 0;
  
  return (
    <group 
      position={[position[0], position[1] + yOffset, position[2]]}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      onPointerDown={(e) => { e.stopPropagation(); if(!disabled) setPressed(true); }}
      onPointerUp={(e) => { e.stopPropagation(); setPressed(false); }}
      onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); setPressed(false); document.body.style.cursor = 'auto'; }}
      onPointerEnter={(e) => { e.stopPropagation(); if(!disabled) { setHovered(true); document.body.style.cursor = 'pointer'; } }}
    >
      {/* Key Base */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[1.8, 0.4, 1.8]} />
        <meshStandardMaterial color={disabled ? "#a0a0a0" : "#b0b0b0"} />
        <Edges color="black" />
      </mesh>
      {/* Key Cap */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.4, 1.5]} />
        <meshStandardMaterial color={disabled ? "#b0b0b0" : (hovered ? "#ffffff" : "#d9d9d9")} />
        <Edges color="black" />
      </mesh>
      
      {/* Icon on the cap */}
      <Icon disabled={disabled} />
    </group>
  );
};

export default function ThreeDPlaybackControls({ 
  onPrev, 
  onNext, 
  onTogglePlay, 
  isPlaying, 
  prevDisabled, 
  nextDisabled 
}: { 
  onPrev: () => void, 
  onNext: () => void, 
  onTogglePlay: () => void,
  isPlaying: boolean,
  prevDisabled: boolean,
  nextDisabled: boolean
}) {
  return (
    <div className="w-full h-24 bg-[var(--color-tint-sage)] relative overflow-hidden">
      {/* Orthographic Camera looking DOWN the Y axis */}
      <Canvas orthographic camera={{ position: [0, 10, 0], zoom: 35, up: [0, 0, -1] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
        
        <KeyboardKey 
          position={[-2.5, 0, 0]} 
          icon={ArrowLeftIcon}
          onClick={onPrev} 
          disabled={prevDisabled} 
        />
        
        <KeyboardKey 
          position={[0, 0, 0]} 
          icon={isPlaying ? PauseIcon : PlayIcon}
          onClick={onTogglePlay} 
          disabled={prevDisabled && nextDisabled} 
        />
        
        <KeyboardKey 
          position={[2.5, 0, 0]} 
          icon={ArrowRightIcon}
          onClick={onNext} 
          disabled={nextDisabled} 
        />
      </Canvas>
      {/* 1996 Inset shadow for the panel */}
      <div className="absolute inset-0 border-t-4 border-l-4 border-black/40 pointer-events-none" />
      <div className="absolute inset-0 border-b-4 border-r-4 border-white/60 pointer-events-none" />
    </div>
  );
}
