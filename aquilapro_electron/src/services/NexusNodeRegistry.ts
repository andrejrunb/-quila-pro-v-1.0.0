/**
 * NEXUS NODE REGISTRY (v3650)
 * --------------------------
 * Static configuration for the sovereign campus cluster.
 * Defines node roles, sharding identifiers, and P2P priority.
 */

export interface NexusNodeConfig {
  id: string;
  campusName: string;
  role: 'primary' | 'satellite' | 'edge';
  shardRange: [number, number]; // 0-100% of global namespace
  priority: number;
}

export const NEXUS_CLUSTER_CONFIG: NexusNodeConfig[] = [
  {
    id: 'nexus_alpha',
    campusName: 'Câmpus-Matriz (Central HQ)',
    role: 'primary',
    shardRange: [0, 40],
    priority: 1
  },
  {
    id: 'nexus_beta',
    campusName: 'Câmpus-Leste (Technology Wing)',
    role: 'satellite',
    shardRange: [41, 70],
    priority: 2
  },
  {
    id: 'nexus_gamma',
    campusName: 'Câmpus-Oeste (Research Lab)',
    role: 'satellite',
    shardRange: [71, 90],
    priority: 2
  },
  {
    id: 'nexus_delta',
    campusName: 'Câmpus-Sul (Gate Entrance)',
    role: 'edge',
    shardRange: [91, 100],
    priority: 3
  }
];

export const getNexusConfigById = (id: string) => 
  NEXUS_CLUSTER_CONFIG.find(c => c.id === id);

export const getClusterNamespace = () => 'aquila.sovereign.nexus.v3650';
