import React from 'react';
import { User, Shield, Layout, Users, Activity, Globe } from 'lucide-react';
import { usePerformance } from '../hooks/PerformanceContext';
import './HierarchyMap.css';

interface HierarchyNode {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline';
  children?: HierarchyNode[];
}

interface HierarchyMapProps {
  users: any[];
  coordinations: any[];
  students: any[]; // [NEW] Adicionado nível de alunos
  currentUser: { id: string; role: 'admin' | 'teacher' | 'staff' };
}

export const HierarchyMap: React.FC<HierarchyMapProps> = ({ users, coordinations, students, currentUser }) => {
  const { isLiteMode } = usePerformance();
  const isManagement = currentUser.role === 'admin' || currentUser.role === 'staff';

  // [SQA-UI-202] Construção da Hierarquia com Filtro RBAC (v3469)
  const buildHierarchy = (): HierarchyNode => {
    const root: HierarchyNode = {
      id: 'root',
      name: 'Diretoria Executiva',
      role: 'director',
      status: 'online',
      children: []
    };

    const filteredCoords = isManagement 
      ? coordinations 
      : coordinations.filter(c => users.some(u => u.id === currentUser.id && u.coordinationId === c.id));

    root.children = filteredCoords.map(coord => ({
      id: coord.id,
      name: coord.name,
      role: 'coordinator',
      status: 'online',
      children: users
        .filter(u => u.coordinationId === coord.id && (isManagement || u.id === currentUser.id))
        .map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          status: 'online',
          children: students
            .filter(s => s.teacherId === u.id) // Alunos vinculados ao professor
            .map(s => ({
              id: s.id,
              name: s.name,
              role: 'student',
              status: s.online ? 'online' : 'offline'
            }))
        }))
    }));

    return root;
  };

  const hierarchy = buildHierarchy();

  const renderNode = (node: HierarchyNode, level: number = 0) => {
    return (
      <div key={node.id} className={`hierarchy-node-container level-${level}`}>
        <div className={`hierarchy-node glass-premium status-${node.status}`}>
          <div className="node-icon">
             {node.role === 'director' && <Shield size={18} className="text-blue-400" />}
             {node.role === 'coordinator' && <Layout size={18} className="text-indigo-400" />}
             {node.role === 'admin' && <Globe size={18} className="text-emerald-400" />}
             {node.role === 'teacher' && <Users size={18} className="text-purple-400" />}
             {node.role === 'student' && <User size={18} className="text-amber-400" />}
             {!['director', 'coordinator', 'admin', 'teacher', 'student'].includes(node.role) && <User size={18} />}
          </div>
          <div className="node-info">
             <span className="node-name">{node.name}</span>
             <span className="node-role">{node.role.toUpperCase()}</span>
          </div>
          <div className="node-status-pulse">
             <Activity size={10} className={node.status === 'online' ? 'animate-pulse' : ''} />
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="node-children">
            <svg className="hierarchy-connector-svg">
               {node.children.map((child, index) => {
                  // In a real SVG tree we would calculate paths here. 
                  // For this UI component, we'll use CSS for layout and SVG for aesthetic pulses.
                  return null; 
               })}
            </svg>
            <div className="children-grid">
               {node.children.map(child => renderNode(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`hierarchy-map-container custom-scroll ${isLiteMode ? 'mode-lite' : ''}`}>
      <header className="map-controls">
         <div className="map-info">
            <h3>MAPA DE HIERARQUIA ORGANIZACIONAL</h3>
            <p>Visualização dinâmica de soberania e níveis de acesso.</p>
         </div>
      </header>

      <div className="map-viewport">
         <div className="zoom-pan-layer">
            {renderNode(hierarchy)}
         </div>
      </div>

      <footer className="map-legend">
         <div className="legend-item"><div className="dot dot-director"></div> Direção</div>
         <div className="legend-item"><div className="dot dot-coord"></div> Coordenação</div>
         <div className="legend-item"><div className="dot dot-staff"></div> Staff</div>
      </footer>
    </div>
  );
};
