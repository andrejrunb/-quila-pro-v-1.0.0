/**
 * Shared IoT Types for Áquila Pro
 */

export type DeviceType = 'turnstile' | 'lock' | 'sensor' | 'alarm' | 'network' | 'hvac' | 'light';
export type DeviceStatus = 'online' | 'offline' | 'busy' | 'error';

export interface IoTDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  lastSync: number;
  ipAddress?: string;
}

export interface DeviceConfig {
  id: string;
  ip: string;
  port: number;
  brand: 'controlid' | 'intelbras' | 'generic';
}

