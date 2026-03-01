"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
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
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <MeshDistortMaterial
        color="#4a9eff"
        attach="material"
        distort={0.3 + audioLevel * 0.5} // More distortion with audio
        speed={2 + audioLevel * 3}
        roughness={0.2}
        metalness={0.8}
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
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        // Create audio context and analyser
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);



        // Start analyzing audio
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
        
        // Calculate average audio level
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = average / 255; // Normalize to 0-1
        
        setAudioLevel(normalized);
        
        animationFrameRef.current = requestAnimationFrame(update);
      };
      
      update();
    };

    initAudio();

    // Cleanup
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
    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-gray-900 to-black p-10 rounded-3xl">
      <div style={{ width: '100%', height: '500px' }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <color attach="background" args={['#ffffff']} />
          <ambientLight intensity={0.9} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
          <AudioReactiveSphere audioLevel={audioLevel} />
        </Canvas>
      </div>
      <div className="mt-4 text-white text-center">
        <p className="text-sm">
          {micActive ? "🎤 Microphone Active" : "🎤 Connecting..."}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Audio Level: {(audioLevel * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

export default AudioBubble;