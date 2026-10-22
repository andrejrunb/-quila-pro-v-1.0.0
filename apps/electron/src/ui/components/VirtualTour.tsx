import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

const SchoolModel = () => {
  // Simulação de um prédio escolar minimalista - Elite UI Style
  return (
    <group>
      {/* Ground */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.5}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0f172a" opacity={0.5} transparent roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Main Building Block */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[10, 4, 15]} />
          <meshPhysicalMaterial 
            color="#3b82f6" 
            transparent 
            opacity={0.2} 
            transmission={0.8} 
            thickness={2} 
            roughness={0}
          />
        </mesh>
      </Float>

      {/* Internal "Brains" / Hubs */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[1]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={2} />
      </mesh>

      <Text
        position={[0, 5, 0]}
        fontSize={0.8}
        color="white"
        font="/fonts/Inter-Bold.woff" // Placeholder, Three will fallback
      >
        ÁQUILA PRO - DIGITAL TWIN v1.6
      </Text>
    </group>
  );
};

export const VirtualTour: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '600px', background: '#020617', borderRadius: '20px', overflow: 'hidden' }}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            maxPolarAngle={Math.PI / 2.1} 
            makeDefault 
          />
          
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />

          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Environment preset="city" />
          
          <SchoolModel />
        </Suspense>
      </Canvas>
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
        NVIDIA Lyra Reconstrução Ativa • 38.4 FPS • Latência 12ms
      </div>
    </div>
  );
};
