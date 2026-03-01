"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

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
        color="#4a9eff"
        attach="material"
        distort={0 + audioLevel * 2}
        speed={2 + audioLevel * 3}
        roughness={0.5}
        metalness={0.2}
        // Add a slight emissive glow for audio
        emissive="#4a9eff"
        emissiveIntensity={audioLevel * 0.2}
      />
    </mesh>
  );
}

function AudioBubble() {
  const [audioLevel, setAudioLevel] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setMicActive(true);

        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        analyzeAudio();
      } catch (err) {
        console.error("❌ Microphone access denied:", err);
      }
    };

    const analyzeAudio = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const update = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = average / 255;
        setAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      
      update();
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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

      <div style={{ width: '100%', height: '500px' }}>
        {/* 1. Enable shadows on the Canvas */}
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          
          {/* 2. Add a strong directional light to create highlights and shadows */}
          <directionalLight
            position={[5, 5, 5]}
            intensity={2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          <AudioReactiveSphere audioLevel={audioLevel} />
          
          {/* 4. Add realistic shadows underneath */}
          <ContactShadows
            position={[0, -2, 0]} // Fixed typo here (was [0, , 0])
            opacity={0.5}
            scale={10}
            blur={2}
            far={4}
          />

          {/* 5. Add an environment map for reflections */}
          <Environment preset="city" />
        </Canvas>
      </div>
    </div>
  );
}

export default AudioBubble;