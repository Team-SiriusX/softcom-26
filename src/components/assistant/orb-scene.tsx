"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float, Stars, Sparkles } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

interface OrbProps {
  isListening: boolean;
  isSpeaking: boolean;
}

function AnimatedSphere({ isListening, isSpeaking }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  
  // Random noise offset for "organic" feel
  const noiseOffset = useMemo(() => Math.random() * 100, []);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = state.clock.getElapsedTime();

    // Base rotation
    meshRef.current.rotation.y = time * 0.1;
    meshRef.current.rotation.z = time * 0.05;

    // Dynamic properties based on state
    // Listening: Active, alert, pulsing
    // Speaking: Fluid, flowing, expressive
    // Idle: Calm, breathing
    
    let targetDistort = 0.3;
    let targetSpeed = 1.5;
    let targetScale = 1;
    let targetColor = new THREE.Color("#3b82f6"); // Blue

    if (isListening) {
      // Simulate voice reaction with sine waves
      const pulse = Math.sin(time * 10) * 0.1 + 1;
      targetDistort = 0.6 + Math.sin(time * 5) * 0.2;
      targetSpeed = 4;
      targetScale = 1.2 * pulse;
      targetColor = new THREE.Color("#60a5fa"); // Lighter Blue
    } else if (isSpeaking) {
      // Flowing speech
      targetDistort = 0.5 + Math.sin(time * 3) * 0.1;
      targetSpeed = 3;
      targetScale = 1.1;
      targetColor = new THREE.Color("#2dd4bf"); // Teal/Cyan
    } else {
      // Idle breathing
      targetScale = 1 + Math.sin(time) * 0.05;
    }

    // Smooth transitions
    materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, targetDistort, 0.05);
    materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, targetSpeed, 0.05);
    
    const currentScale = meshRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
    meshRef.current.scale.setScalar(nextScale);
    
    materialRef.current.color.lerp(targetColor, 0.05);
  });

  return (
    <Sphere args={[1, 128, 128]} ref={meshRef}>
      <MeshDistortMaterial
        ref={materialRef}
        color="#3b82f6"
        attach="material"
        distort={0.3}
        speed={1.5}
        roughness={0.1}
        metalness={0.1}
        bumpScale={0.01}
        clearcoat={1}
        clearcoatRoughness={0.1}
        radius={1}
      />
    </Sphere>
  );
}

export function OrbScene({ isListening, isSpeaking }: OrbProps) {
  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#60a5fa" />
        
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
        <Sparkles count={50} scale={4} size={2} speed={0.2} opacity={0.4} color="#ffffff" />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
          <AnimatedSphere isListening={isListening} isSpeaking={isSpeaking} />
        </Float>
      </Canvas>
    </div>
  );
}
