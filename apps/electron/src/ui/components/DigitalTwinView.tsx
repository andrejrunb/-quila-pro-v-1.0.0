import React, { useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PointerLockControls, Text, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

// --- DATA MOCKS ---
interface RoomData {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  capacity: number;
  occupancy: number;
  tempC: number;
  co2Ppm: number;
  students: Array<{ id: string; name: string; localPos: [number, number, number] }>;
}

const ROOMS_MOCK: RoomData[] = [
  { 
    id: 'sala-101', name: 'Sala 101', position: [-15, 2, -10], size: [12, 4, 10], 
    capacity: 30, occupancy: 28, tempC: 24.5, co2Ppm: 850,
    students: [{ id: 's1', name: 'João', localPos: [-3, 0.5, -2] }, { id: 's2', name: 'Maria', localPos: [3, 0.5, 2] }]
  },
  { 
    id: 'sala-102', name: 'Sala 102', position: [0, 2, -10], size: [12, 4, 10], 
    capacity: 30, occupancy: 12, tempC: 22.0, co2Ppm: 400, students: [] 
  },
  { 
    id: 'lab-ciencias', name: 'Laboratório', position: [15, 2, -10], size: [12, 4, 10], 
    capacity: 20, occupancy: 5, tempC: 21.5, co2Ppm: 390, students: [] 
  },
  { 
    id: 'patio', name: 'Pátio Central', position: [0, 1, 10], size: [40, 2, 20], 
    capacity: 200, occupancy: 120, tempC: 26.0, co2Ppm: 410, students: [] 
  },
  { 
    id: 'biblioteca', name: 'Biblioteca', position: [-20, 2, 10], size: [15, 4, 15], 
    capacity: 50, occupancy: 45, tempC: 23.0, co2Ppm: 1200, students: [] 
  }
];

// Rotas de fuga (Line coords)
const ESCAPE_ROUTES = [
  [[-15, 0.5, -10], [-15, 0.5, 10], [0, 0.5, 25]], // Sala 101 -> Patio -> Saída
  [[0, 0.5, -10], [0, 0.5, 10], [0, 0.5, 25]],     // Sala 102 -> Patio -> Saída
  [[15, 0.5, -10], [15, 0.5, 10], [0, 0.5, 25]],   // Lab -> Patio -> Saída
  [[-20, 0.5, 10], [0, 0.5, 10], [0, 0.5, 25]]     // Biblioteca -> Patio -> Saída
];

// --- COMPONENTS ---

const FirstPersonCamera = () => {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 2, 30); // Starting walking position
  }, [camera]);

  return <PointerLockControls />;
};

const HeatmapRoom = ({ 
  room, onClick, nightMode 
}: { 
  room: RoomData; onClick: (id: string) => void; nightMode: boolean; 
}) => {
  const [hovered, setHover] = useState(false);
  
  const density = room.occupancy / room.capacity;
  const heatColor = useMemo(() => {
    if (nightMode) return '#052e16'; // Dark green base for night vision
    if (density > 0.8) return '#ef4444';
    if (density > 0.5) return '#f59e0b';
    if (density > 0.1) return '#10b981';
    return '#374151';
  }, [density, nightMode]);

  const outlineColor = nightMode ? '#4ade80' : '#000000'; // Neon green outline in night mode

  return (
    <group position={room.position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(room.id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
      >
        <boxGeometry args={room.size} />
        <meshStandardMaterial 
          color={hovered && !nightMode ? '#60a5fa' : heatColor} 
          transparent={true} 
          opacity={nightMode ? 0.4 : 0.8}
          roughness={0.2}
          metalness={0.8}
          emissive={nightMode ? '#065f46' : '#000000'}
          emissiveIntensity={nightMode ? 0.5 : 0}
        />
      </mesh>
      
      {/* 3D Title */}
      <Text
        position={[0, room.size[1] / 2 + 1, 0]}
        fontSize={1.2}
        color={nightMode ? '#4ade80' : 'white'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor={outlineColor}
      >
        {room.name}
      </Text>

      {/* Virtual Sensors (Passo 178) */}
      <Html position={[0, room.size[1] / 2 + 2, 0]} center style={{ pointerEvents: 'none', transition: 'all 0.2s' }}>
        <div style={{
          background: nightMode ? 'rgba(6, 95, 70, 0.8)' : 'rgba(17, 24, 39, 0.8)',
          padding: '4px 8px', borderRadius: '4px', border: `1px solid ${nightMode ? '#4ade80' : '#4b5563'}`,
          color: nightMode ? '#4ade80' : 'white', fontSize: '10px', fontWeight: 'bold',
          whiteSpace: 'nowrap', display: 'flex', gap: '8px'
        }}>
          <span>🌡 {room.tempC}°C</span>
          <span style={{ color: room.co2Ppm > 1000 ? '#ef4444' : 'inherit' }}>☁ {room.co2Ppm}ppm</span>
        </div>
      </Html>

      {/* Avatares */}
      {room.students.map(student => (
        <mesh key={student.id} position={student.localPos}>
          <cylinderGeometry args={[0.3, 0.3, 1.5, 16]} />
          <meshStandardMaterial color={nightMode ? '#86efac' : '#3b82f6'} emissive={nightMode ? '#86efac' : '#000'} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
};

export const DigitalTwinView: React.FC = () => {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [nightMode, setNightMode] = useState(false); // Passo 180
  const [emergency, setEmergency] = useState(false); // Passo 177
  const [cameraMode, setCameraMode] = useState<'orbital' | 'fps'>('orbital'); // Passo 176

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: nightMode ? '#020617' : '#000' }}>
      
      {/* Top HUD */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: nightMode ? '#4ade80' : 'white' }}>
          Gêmeo Digital Escolar 3D
        </h2>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button 
            onClick={() => setNightMode(!nightMode)}
            style={{ padding: '6px 12px', background: nightMode ? '#4ade80' : '#374151', color: nightMode ? '#000' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {nightMode ? '🌙 Night Sentry (ON)' : '☀️ Dia'}
          </button>
          <button 
            onClick={() => setEmergency(!emergency)}
            style={{ padding: '6px 12px', background: emergency ? '#ef4444' : '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', animation: emergency ? 'pulse 1s infinite' : 'none' }}>
            {emergency ? '🚨 EVACUAR!' : '⚠️ Simular Alarme'}
          </button>
          <button 
            onClick={() => setCameraMode(prev => prev === 'orbital' ? 'fps' : 'orbital')}
            style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            🎥 Modo: {cameraMode.toUpperCase()}
          </button>
        </div>
      </div>

      <Canvas camera={{ position: [0, 30, 40], fov: 45 }} shadows>
        {/* LUZES */}
        {nightMode ? (
          <>
            <ambientLight intensity={0.1} color="#4ade80" />
            <pointLight position={[0, 10, 10]} intensity={0.5} color="#4ade80" distance={50} />
          </>
        ) : (
          <>
            <ambientLight intensity={0.4} />
            <directionalLight 
              position={[50, 50, 20]} 
              intensity={1.2} 
              castShadow 
              shadow-mapSize-width={2048} 
              shadow-mapSize-height={2048} 
            />
          </>
        )}
        
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color={nightMode ? '#020617' : '#030712'} roughness={0.8} />
        </mesh>

        <gridHelper args={[200, 200, nightMode ? '#064e3b' : '#1f2937', nightMode ? '#022c22' : '#111827']} position={[0, 0, 0]} />

        {/* Quartos e Zonas */}
        {ROOMS_MOCK.map(room => (
          <HeatmapRoom key={room.id} room={room} onClick={setActiveRoom} nightMode={nightMode} />
        ))}

        {/* Linhas de Fuga (Passo 177) */}
        {emergency && ESCAPE_ROUTES.map((route, idx) => (
          <Line
            key={idx}
            points={route as [number, number, number][]}
            color="#ef4444"
            lineWidth={5}
            dashed={true}
            dashScale={50}
            dashSize={1}
            dashOffset={0}
          />
        ))}

        {/* Controles de Câmera (Passo 176) */}
        {cameraMode === 'orbital' ? (
          <OrbitControls enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2 - 0.1} />
        ) : (
          <FirstPersonCamera />
        )}
      </Canvas>

      {/* Diário de Classe Modal overlay (Passo 179) */}
      {activeRoom && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: nightMode ? 'rgba(2, 44, 34, 0.95)' : 'rgba(17, 24, 39, 0.95)', 
          padding: '24px', borderRadius: '16px',
          border: `1px solid ${nightMode ? '#4ade80' : 'rgba(255, 255, 255, 0.1)'}`,
          boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px ${nightMode ? 'rgba(74, 222, 128, 0.2)' : 'transparent'}`,
          color: nightMode ? '#4ade80' : 'white', width: '400px', zIndex: 50,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Diário de Classe: {ROOMS_MOCK.find(r => r.id === activeRoom)?.name}</h3>
            <button onClick={() => setActiveRoom(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>Ocupação atual</span>
              <strong style={{ fontSize: '1.2rem' }}>{ROOMS_MOCK.find(r => r.id === activeRoom)?.occupancy} / {ROOMS_MOCK.find(r => r.id === activeRoom)?.capacity}</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>Condição (CO2)</span>
              <strong style={{ fontSize: '1.2rem', color: (ROOMS_MOCK.find(r => r.id === activeRoom)?.co2Ppm || 0) > 1000 ? '#ef4444' : 'inherit' }}>
                {ROOMS_MOCK.find(r => r.id === activeRoom)?.co2Ppm} ppm
              </strong>
            </div>
          </div>

          <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Alunos Presentes ({ROOMS_MOCK.find(r => r.id === activeRoom)?.students.length})</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
            {ROOMS_MOCK.find(r => r.id === activeRoom)?.students.length === 0 ? (
              <li style={{ opacity: 0.5, fontStyle: 'italic' }}>Nenhum aluno identificado no perímetro.</li>
            ) : (
              ROOMS_MOCK.find(r => r.id === activeRoom)?.students.map(st => (
                <li key={st.id} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{st.name}</span>
                  <span style={{ background: '#10b981', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '12px' }}>Check-in</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DigitalTwinView;
