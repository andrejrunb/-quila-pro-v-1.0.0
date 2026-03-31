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
