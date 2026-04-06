/**
 * NEXUS NODE REGISTRY (v3650)
 * --------------------------
 * Static configuration for the sovereign campus cluster.
 * Defines node roles, sharding identifiers, and P2P priority.
 */

import { NexusNodeConfig, NEXUS_CLUSTER_CONFIG } from './AiTypes';

export const getNexusConfigById = (id: string) => 
  NEXUS_CLUSTER_CONFIG.find(c => c.id === id);

export const getClusterNamespace = () => 'aquila.sovereign.nexus.v3650';
