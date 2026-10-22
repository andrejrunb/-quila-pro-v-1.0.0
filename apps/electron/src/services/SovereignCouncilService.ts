/**
 * SOVEREIGN COUNCIL SERVICE (v4001 - Safe Proxy)
 * ---------------------------------------------
 * Camada de abstração que detecta o ambiente (Main ou Renderer).
 * No Renderer: Usa IPC (window.aquila.invoke).
 * No Main: Deve-se usar a implementação real em src/main/services/
 */

export type ProposalStatus = 'draft' | 'whitelisted' | 'active' | 'closed';
export type AuthorType = 'ai' | 'director' | 'coordinator' | 'teacher';
export type SovereignRole = 'DIRECTOR' | 'COORDINATOR' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'STAFF';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  scientific_grounds: string; // JSON
  author_type: AuthorType;
  author_id?: string;
  target_roles: SovereignRole[];
  status: ProposalStatus;
  createdAt: string;
}

export class SovereignCouncilServiceProxy {
  private static instance: SovereignCouncilServiceProxy;

  public static getInstance(): SovereignCouncilServiceProxy {
    if (!SovereignCouncilServiceProxy.instance) {
      SovereignCouncilServiceProxy.instance = new SovereignCouncilServiceProxy();
    }
    return SovereignCouncilServiceProxy.instance;
  }

  /**
   * Invoca o comando via IPC se estiver no Renderer
   */
  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && window.aquila) {
      return window.aquila.invoke(`council:${method}`, ...args);
    }
    throw new Error(`[CouncilProxy] IPC não disponível para ${method}. Verifique o processo.`);
  }

  public async createProposal(data: Partial<Proposal>): Promise<string> {
    return this.invoke('createProposal', data);
  }

  public async whitelistByDirector(proposalId: string, directorId: string): Promise<void> {
    return this.invoke('whitelistByDirector', proposalId, directorId);
  }

  public async activatePoll(proposalId: string, actorRole: SovereignRole): Promise<void> {
    return this.invoke('activatePoll', proposalId, actorRole);
  }

  public async castVote(proposalId: string, voterId: string, role: SovereignRole, choice: string): Promise<void> {
    return this.invoke('castVote', proposalId, voterId, role, choice);
  }

  public async getProposal(id: string): Promise<Proposal | null> {
    return this.invoke('getProposal', id);
  }

  public async listActivePollsForRole(role: SovereignRole): Promise<Proposal[]> {
    return this.invoke('listActivePollsForRole', role);
  }

  public async generateAiProposal(type: 'social' | 'pedagogic'): Promise<string> {
    return this.invoke('generateAiProposal', type);
  }
}

export const councilService = SovereignCouncilServiceProxy.getInstance();
export default councilService;
