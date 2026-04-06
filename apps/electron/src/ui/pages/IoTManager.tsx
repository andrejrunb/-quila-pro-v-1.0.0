import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Cpu, 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  Zap,
  Globe,
  Bell,
  Box
} from 'lucide-react';
import './IoTManager.css';

interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  battery: number;
  lastActive: string;
  type: 'sensor' | 'camera' | 'lock' | 'light';
}

const DeviceRow: React.FC<{ device: Device }> = ({ device }) => {
  const batteryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (batteryRef.current) {
      batteryRef.current.style.width = `${device.battery}%`;
    }
  }, [device.battery]);

  return (
    <tr key={device.id}>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
            <Box size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{device.name}</div>
            <div className="text-[10px] font-mono text-gray-500">{device.id}</div>
          </div>
        </div>
      </td>
      <td>
        <div className={`status-pill ${device.status}`}>
          {device.status === 'online' && <ShieldCheck size={12} className="mr-1.5" />}
          {device.status === 'warning' && <ShieldAlert size={12} className="mr-1.5" />}
          {device.status === 'offline' && <Globe size={12} className="mr-1.5" />}
          {device.status}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
            <div ref={batteryRef} className={`h-full ${device.battery < 20 ? 'bg-red-500' : 'bg-blue-500'}`} />
          </div>
          <span className="text-xs font-mono text-gray-400">{device.battery}%</span>
        </div>
      </td>
      <td className="text-xs text-gray-500">{device.lastActive}</td>
      <td>
        <button 
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
          title="Refresh Node Connection"
        >
          <RefreshCw size={14} />
        </button>
      </td>
    </tr>
  );
};

export const IoTManager: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await window.aquila.getIoTDevices();
        setDevices(data || []);
      } catch (err) {
        console.error('Failed to fetch IoT devices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();

    const handleUpdate = (updatedDevice: Device) => {
      setDevices(prev => 
        prev.map(d => d.id === updatedDevice.id ? updatedDevice : d)
      );
    };

    if (window.aquila?.onIoTDeviceUpdated) {
      window.aquila.onIoTDeviceUpdated(handleUpdate);
    }
  }, []);

  const handleSync = async () => {
    setLoading(true);
    await window.aquila.getIoTDevices().then(setDevices);
    setLoading(false);
  };

  return (
    <div className="iot-manager-container">
      <header className="iot-header">
        <div>
          <div className="iot-sovereignty-badge">
             <Cpu size={14} className="mr-2" />
             Sovereign IoT Grid Active
          </div>
          <h1 className="iot-title">IoT Command Center</h1>
        </div>
        <div className="flex gap-4">
           <button className="iot-action-btn" title="Sync All Sovereign Nodes"><RefreshCw size={16} /> Sync Nodes</button>
           <button className="iot-action-btn primary" title="IoT Grid Configuration"><Settings size={16} /> Config</button>
        </div>
      </header>

      <div className="iot-grid">
         {/* System Health */}
         <div className="iot-card health-card">
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/20 text-green-400 rounded-2xl">
                     <ShieldCheck size={24} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Grid Integrity</h3>
                     <p className="text-xs text-gray-400">All local protocols encrypted.</p>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-2xl font-black italic text-green-400">98.2%</div>
                  <div className="text-[10px] uppercase font-black text-gray-500">Uptime</div>
               </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-green-500 w-[98.2%]"></div>
            </div>
         </div>

         <div className="iot-card energy-card">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-blue-400">
                  <Zap size={18} />
                  <span className="text-sm font-bold uppercase tracking-widest">Energy Load</span>
               </div>
               <span className="text-xs font-mono text-gray-500">PROVISIONED</span>
            </div>
            <div className="text-3xl font-black italic text-white mb-2">12.4 <span className="text-sm text-gray-500">kW/h</span></div>
            <p className="text-xs text-gray-400">Current load is within pedagogical safety margins.</p>
         </div>
      </div>

      <div className="iot-device-table-container mt-12">
         <div className="table-header">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Connected Nodes</h2>
         </div>
         <table className="iot-table">
            <thead>
               <tr>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Energy</th>
                  <th>Last Interaction</th>
                  <th>Actions</th>
               </tr>
            </thead>
            <tbody>
               {devices.map(device => (
                  <DeviceRow key={device.id} device={device} />
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};
