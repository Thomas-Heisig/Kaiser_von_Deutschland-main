/**
 * Advanced Espionage System
 * Double agents, sabotage, assassinations, propaganda
 */

export interface EspionageOperation {
  id: string;
  name: string;
  description: string;
  cost: Record<string, number>;
  duration: number;
  successRate: number;
  requiresAgents?: number;
  detectionRisk?: number;
  effects: Record<string, any>;
  consequences?: string;
}

export interface PropagandaCampaign {
  id: string;
  name: string;
  description: string;
  cost: Record<string, number>;
  duration: number;
  yearAvailable?: number;
  effects: Record<string, number>;
}

export interface SecretSociety {
  id: string;
  name: string;
  description: string;
  yearFounded: number;
  influence: number;
  members: number;
  goals: string[];
  activities?: string[];
}

export interface CipherSystem {
  id: string;
  name: string;
  era: string;
  yearAvailable: number;
  security: number;
  cost: Record<string, number>;
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  skill: number;
  loyalty: number;
  location: string;
  cover: string;
  isDoubleAgent: boolean;
  assignedTo?: string;
}

export class AdvancedEspionageSystem {
  private operations: EspionageOperation[] = [];
  private propagandaCampaigns: PropagandaCampaign[] = [];
  // @ts-expect-error - Reserved for future secret society mechanics
  private secretSocieties: SecretSociety[] = [];
  private cipherSystems: CipherSystem[] = [];
  
  private agents: Map<string, Agent> = new Map();
  // @ts-expect-error - Reserved for future ongoing operations tracking
  private activeOperations: Map<string, EspionageOperation> = new Map();
  private activePropaganda: Set<string> = new Set();
  private infiltratedKingdoms: Set<string> = new Set();
  private currentCipher: string | null = null;
  private stolenTechnologies: Set<string> = new Set();

  constructor() {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/espionage-systems.json');
      const data = await response.json();
      
      this.operations = data.espionageOperations || [];
      this.propagandaCampaigns = data.propagandaCampaigns || [];
      this.secretSocieties = data.secretSocieties || [];
      this.cipherSystems = data.cipherSystems || [];
    } catch (error) {
      console.error('Failed to load espionage systems data:', error);
    }
  }

  /**
   * Recruit a new agent
   */
  public recruitAgent(name: string, location: string): {
    success: boolean;
    agent?: Agent;
    cost: number;
  } {
    const recruitOp = this.operations.find(op => op.id === 'recruit_agent');
    if (!recruitOp) {
      return { success: false, cost: 0 };
    }

    const agent: Agent = {
      id: `agent_${Date.now()}_${Math.random()}`,
      name,
      skill: Math.random() * 0.5 + 0.5, // 0.5-1.0
      loyalty: Math.random() * 0.3 + 0.7, // 0.7-1.0
      location,
      cover: this.generateCover(),
      isDoubleAgent: false
    };

    this.agents.set(agent.id, agent);

    return {
      success: true,
      agent,
      cost: recruitOp.cost.gold || 0
    };
  }

  /**
   * Execute espionage operation
   */
  public executeOperation(
    operationId: string,
    targetKingdom: string,
    assignedAgents: string[]
  ): {
    success: boolean;
    detected: boolean;
    effects: Record<string, any>;
    message: string;
  } {
    const operation = this.operations.find(op => op.id === operationId);
    if (!operation) {
      return {
        success: false,
        detected: false,
        effects: {},
        message: 'Operation not found'
      };
    }

    // Check if enough agents
    if (operation.requiresAgents && assignedAgents.length < operation.requiresAgents) {
      return {
        success: false,
        detected: false,
        effects: {},
        message: `Requires ${operation.requiresAgents} agents`
      };
    }

    // Calculate success chance based on agent skills
    let totalSkill = 0;
    for (const agentId of assignedAgents) {
      const agent = this.agents.get(agentId);
      if (agent) {
        totalSkill += agent.skill;
      }
    }
    const avgSkill = totalSkill / assignedAgents.length;
    const successChance = operation.successRate * avgSkill;

    const success = Math.random() < successChance;
    const detected = Math.random() < (operation.detectionRisk || 0);

    // Handle special operations
    if (success) {
      switch (operationId) {
        case 'steal_technology':
          // Add random technology to stolen techs
          this.stolenTechnologies.add(`tech_${Date.now()}`);
          break;
        case 'build_network':
          this.infiltratedKingdoms.add(targetKingdom);
          break;
        case 'plant_double_agent':
          // Turn one agent into double agent
          const agent = this.agents.get(assignedAgents[0]);
          if (agent) {
            agent.isDoubleAgent = true;
          }
          break;
      }
    }

    // If detected, reduce agent loyalty
    if (detected) {
      for (const agentId of assignedAgents) {
        const agent = this.agents.get(agentId);
        if (agent) {
          agent.loyalty *= 0.8;
          if (Math.random() < 0.3) {
            this.agents.delete(agentId); // Agent captured
          }
        }
      }
    }

    return {
      success,
      detected,
      effects: success ? operation.effects : {},
      message: success 
        ? `Operation ${operation.name} successful!${detected ? ' (But detected)' : ''}`
        : `Operation ${operation.name} failed${detected ? ' and was detected' : ''}`
    };
  }

  /**
   * Launch propaganda campaign
   */
  public launchPropaganda(campaignId: string): {
    success: boolean;
    effects: Record<string, number>;
  } {
    const campaign = this.propagandaCampaigns.find(c => c.id === campaignId);
    if (!campaign) {
      return { success: false, effects: {} };
    }

    this.activePropaganda.add(campaignId);

    return {
      success: true,
      effects: campaign.effects
    };
  }

  /**
   * Adopt cipher system
   */
  public adoptCipher(cipherId: string): {
    success: boolean;
    security: number;
  } {
    const cipher = this.cipherSystems.find(c => c.id === cipherId);
    if (!cipher) {
      return { success: false, security: 0 };
    }

    this.currentCipher = cipherId;

    return {
      success: true,
      security: cipher.security
    };
  }

  /**
   * Get agent network strength in kingdom
   */
  public getNetworkStrength(kingdom: string): number {
    let strength = 0;
    for (const agent of this.agents.values()) {
      if (agent.location === kingdom) {
        strength += agent.skill * agent.loyalty;
      }
    }
    return strength;
  }

  /**
   * Get all agents
   */
  public getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get available operations for year
   */
  public getAvailableOperations(_year: number): EspionageOperation[] {
    // All operations are available - filter by specific requirements if needed
    return this.operations;
  }

  /**
   * Get available propaganda for year
   */
  public getAvailablePropaganda(year: number): PropagandaCampaign[] {
    return this.propagandaCampaigns.filter(
      campaign => !campaign.yearAvailable || year >= campaign.yearAvailable
    );
  }

  /**
   * Get stolen technologies
   */
  public getStolenTechnologies(): string[] {
    return Array.from(this.stolenTechnologies);
  }

  /**
   * Get current cipher security level
   */
  public getCipherSecurity(): number {
    if (!this.currentCipher) return 0;
    
    const cipher = this.cipherSystems.find(c => c.id === this.currentCipher);
    return cipher ? cipher.security : 0;
  }

  /**
   * Generate random cover identity
   */
  private generateCover(): string {
    const covers = [
      'Merchant', 'Scholar', 'Priest', 'Diplomat', 'Traveler',
      'Artist', 'Teacher', 'Doctor', 'Engineer', 'Journalist'
    ];
    return covers[Math.floor(Math.random() * covers.length)];
  }
}
