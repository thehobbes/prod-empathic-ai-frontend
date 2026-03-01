"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Environment, ContactShadows, OrbitControls } from '@react-three/drei';

function AudioReactiveSphere({ audioLevel }) {
  const meshRef = useRef();
  
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (meshRef.current) {
      // Rotate the sphere
      meshRef.current.rotation.y = time * 0.15;
      meshRef.current.rotation.x = time * 0.15;
      
      // Scale based on audio level
      const scale = 1 + audioLevel * 0.0005;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    // 3. Enable shadows on the mesh
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[1.5, 64, 64]} />
      <MeshDistortMaterial
        color="#419a49"
        attach="material"
        distort={0 + audioLevel * 0.5}
        speed={2 + audioLevel * 3}
        roughness={0.5}
        metalness={0.2}
        // Add a slight emissive glow for audio
        emissive="#4a9eff"
        emissiveIntensity={audioLevel * 0.3}
      />
    </mesh>
  );
}

function AudioBubble({ audioLevel = 0, micActive = false }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-10 rounded-3xl">
      
      {/* TEXT MOVED ABOVE THE CANVAS */}
      <div className="mb-4 text-white text-center">
        <p className="text-sm text-gray-700">
          {micActive ? "🎤 Microphone Active" : "🎤 Connecting..."}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Audio Level: {(audioLevel * 100).toFixed(1)}%
        </p>
      </div>

      <div style={{ width: '100%', height: '500px', cursor: 'grab' }}>
        <Canvas shadows camera={{ position: [0, 0, 6.5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <AudioReactiveSphere audioLevel={audioLevel} />
          <ContactShadows
            position={[0, -2, 0]}
            opacity={0.5}
            scale={8}
            blur={2.5}
            far={4}
            resolution={512}
          />

          <Environment preset="city" />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            makeDefault 
          />
        </Canvas>
      </div>
    </div>
  );
}

export default AudioBubble;
