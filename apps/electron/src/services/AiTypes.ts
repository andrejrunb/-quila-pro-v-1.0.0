/**
 * AiTypes.ts
 * Pure-type definitions for AI analysis and security events.
 * This file MUST NOT import any Node.js modules (fs, path, events, etc.)
 * so it can be safely imported by React components in the renderer process.
 */

export type SecurityEventType = 'weapon' | 'group' | 'fall' | 'intrusion' | 'vandalism';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  title?: string;
  message?: string;
  timestamp: number;
  cameraId: string;
  cameraName?: string;
  zone?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'treating' | 'resolved' | 'dismissed';
  confidence: number;
  imageUrl?: string;
  metadata?: any;
}

export interface FaceDetectedPayload {
  student_id: string;
  confidence: number;
  ts: string | number;
  occlusion_score?: number;
  mask_detected?: boolean;
  gesture?: 'thumbs_up' | 'thumbs_down' | 'none';
  box?: [number, number, number, number];
  behavior?: 'normal' | 'running' | 'loitering' | 'falling' | 'cellphone';
  zone?: string;
  camera_id?: string;
  simulated?: boolean;
  behavior_metadata?: {
    duration_in_zone?: number;
    nearby_count?: number;
    pose_score?: number;
  };
}

export interface FaceEncoding {
  photo_path: string;
  vector: number[];
  simulated?: boolean;
}

export interface CameraConfig {
  id: string;
  rtspUrl: string;
  zone: string;
  performanceProfile?: string;
  ip?: string;
  isActive?: boolean;
}

export interface NexusNodeConfig {
  id: string;
  campusName: string;
  role: 'primary' | 'satellite' | 'edge';
  shardRange: [number, number];
  priority: number;
}

export interface NexusNode {
  id: string;
  name: string;
  load: number;
  syncStatus: 'synced' | 'pending' | 'offline';
  lastHeartbeat: number;
  aiEnabled?: boolean;
  specialization?: string[]; // e.g., ['finance', 'pedagogy', 'security']
  hardwareProfile?: 'low' | 'medium' | 'high'; // Capabilidade de I.A local (v3465)
  isCloudCreditNode?: boolean;
  endpoint?: string;
  peerId?: string; // Libp2p Peer ID (v1.6+)
}

export interface SyncPacket {
  id: string;
  sourceNode: string;
  targetNode: string;
  tenantId?: string; // ID da Instituição para Isolamento P2P (v1.3)
  payloadType: 'identity' | 'telemetry' | 'schedule' | 'session_sync' | 'parity_request' | 'parity_response' | 'admin_command' | 'evolution_pulse' | 'CORTEX_PULSE' | 'RESOURCE_ANNOUNCEMENT' | 'RESOURCE_DISCOVERY_REQUEST' | 'RESOURCE_DISCOVERY_RESPONSE' | 'SWARM_SEARCH_REQUEST' | 'SWARM_SEARCH_RESPONSE' | 'CONSENSUS_PROPOSAL' | 'CONSENSUS_VOTE' | 'RAG_QUERY' | 'RAG_RESPONSE' | 'REPUTATION_VOUCH' | 'BRIDGE_HELP_REQUEST' | 'HELP_RESPONSE' | 'GLOBAL_INSIGHT_PULSE' | 'REPAIR_REQUEST' | 'REPAIR_RESPONSE' | 'backup_shard' | 'cloud_shard_sync' | 'inference_request' | 'inference_result' | 'capability_announcement';
  timestamp: number;
  payload?: any; 
  securityLevel?: string;
  signature?: string; 
  publicKey?: string; 
}

export const NEXUS_CLUSTER_CONFIG: NexusNode[] = [
  { id: 'nexus_alpha', name: 'Alpha Core (Central)', load: 0.12, syncStatus: 'synced', lastHeartbeat: Date.now(), aiEnabled: true, specialization: ['general'], hardwareProfile: 'high' },
  { id: 'nexus_beta', name: 'Beta Wing (Coordenação)', load: 0.45, syncStatus: 'synced', lastHeartbeat: Date.now(), aiEnabled: true, specialization: ['pedagogy', 'attendance'], hardwareProfile: 'medium' },
  { id: 'nexus_gamma', name: 'Gamma Lab (Direção)', load: 0.22, syncStatus: 'synced', lastHeartbeat: Date.now(), aiEnabled: true, specialization: ['finance', 'legal'], hardwareProfile: 'medium' },
  { id: 'nexus_delta', name: 'Delta Gate (Câmeras)', load: 0.08, syncStatus: 'synced', lastHeartbeat: Date.now(), aiEnabled: true, specialization: ['security', 'vision'], hardwareProfile: 'high' }
];

// ---- PORTFÓLIO & PEDAGOGIA ----
export interface PortfolioEvent {
  id: string;
  studentId: string;
  type: 'restlessness' | 'sleep_warning' | 'focus_period' | 'high_activity' | 'normal' | 'anomaly';
  description: string;
  timestamp: number;
  location: string;
  severity?: 'low' | 'normal' | 'medium' | 'high' | 'critical';
}

export interface PedagogicalInsight {
  studentId: string;
  category: 'cognitive' | 'social' | 'academic' | 'well-being';
  trend: 'improving' | 'stable' | 'declining';
  observation: string;
  recommendation: string;
  confidence: number;
  timestamp: number;
}

// ---- LOGÍSTICA & INVENTÁRIO (Crate-Grid) ----
export interface StockDetection {
  itemId: string;
  name: string;
  count: number;
  confidence: number;
  lastDetected: string;
  zone: 'pantry' | 'storage_a' | 'storage_b';
}

export interface ReplenishmentOrder {
  orderId: string;
  itemId: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

// ---- GEOFENCING & CHEGADA (Arrival Board) ----
export interface ParentArrival {
  parentId: string;
  parentName: string;
  studentNames: string[];
  distanceMeters: number;
  status: 'ARRIVING' | 'AT_GATE' | 'IDLE';
}


// ---- MONITORAMENTO PASSIVO (WiFi Dense Pose) ----
export interface GhostPresence {
  id: string;
  x: number; 
  y: number;
  z?: number; // Altura estimada do centro de massa
  posture: 'STANDING' | 'SITTING' | 'HORIZONTAL' | 'MOVING' | 'FALLEN';
  confidence: number;
  timestamp: string;
  zoneId: string;
  lastSeen?: number;
}

// ---- ANÁLISE PREDITIVA (Dropout Predictor) ----
export interface RiskAnalysis {
  studentId: string;
  riskScore: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  trend: 'stable' | 'improving' | 'declining';
  factors: string[];
  recommendation: string;
}

// ---- MENSAGERIA & COMUNICAÇÃO (Eagle Messenger) ----
export interface NpuStatus {
  npuUsed: boolean;
  modelAcceleration: number; 
  activeKernels: string[];
  temperature: number;
  powerDraw: number; 
  quantMode: 'FP16' | 'INT8' | 'TQ_3BIT';
  vramSavedMB: number;
}

export type StaffRole = 'TEACHER' | 'JANITOR' | 'HR' | 'ADMIN' | 'LEGAL' | 'FINANCE' | 'TECH_SUPPORT';

export interface StaffRecord {
  id: string;
  name: string;
  role: StaffRole;
  department: string;
  email?: string;
  nodeId?: string; 
  status: string;
  baseSalary?: number;
  contractType?: string;
  performanceScore?: number;
  onboardingStep?: number;
}

export interface SmartMessage {
  id: string;
  senderId: string;
  senderRole: StaffRole;
  recipientId?: string;
  recipientRole?: StaffRole; // Para broadcasts
  originalContent: string;
  adaptedContent: string;
  timestamp: number;
  priority?: number; // 1-10
  status?: 'pending' | 'sent' | 'failed';
}

export interface SecureMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: number;
  encrypted: boolean;
  iv?: string;
  isSilentAlarm?: boolean;
  channelId: string;
}

export interface MessageChannel {
  id: string;
  name: string;
  type: 'general' | 'secretaria' | 'pedagogico' | 'financeiro';
  lastMessage?: string;
  unreadCount?: number;
}

// ---- FROTA & LOGÍSTICA (Fleet Monitor) ----
export interface TransportFleet {
  busId: string;
  driverName: string;
  plate?: string; // Mantendo opcional para compatibilidade
  route: string;
  studentCount: number;
  location: {
    lat: number;
    lng: number;
  };
  status: 'en_route' | 'delayed' | 'finished' | 'stopped' | 'boarding' | 'maintenance';
}

