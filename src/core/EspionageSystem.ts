/**
 * Espionage and Subversion System
 * 
 * Manages spies, intelligence networks, sabotage, and propaganda.
 * Complete intelligence warfare simulation.
 */

export interface SpyAgent {
  id: string;
  name: string;
  owner: string; // kingdom/player ID
  location: string; // kingdom ID where deployed
  
  /** Skills (0-100) */
  intelligence: number;
  stealth: number;
  deception: number;
  loyalty: number;
  
  /** Status */
  level: number; // 1-10
  experience: number;
  cover: 'merchant' | 'diplomat' | 'scholar' | 'servant' | 'soldier' | 'noble';
  detected: boolean;
  captured: boolean;
  
  /** Network */
  networkSize: number; // Number of local contacts
  influence: number; // 0-100, ability to affect target
  
  /** Mission */
  currentMission?: SpyMission;
}

export interface SpyMission {
  id: string;
  type: 'intelligence' | 'sabotage' | 'assassination' | 'propaganda' | 'recruitment' | 'counter_intel';
  agentId: string;
  targetKingdom: string;
  target?: string; // Specific target (building, person, etc.)
  
  /** Progress */
  startDate: number;
  duration: number; // days
  progress: number; // 0-100
  
  /** Difficulty and risk */
  difficulty: number; // 0-100
  detectionRisk: number; // 0-100
  
  /** Rewards */
  intelligenceValue: number;
  sabotageImpact: number;
  
  status: 'planning' | 'ongoing' | 'completed' | 'failed' | 'compromised';
}

export interface IntelligenceReport {
  id: string;
  source: string; // Agent ID
  targetKingdom: string;
  type: 'military' | 'economic' | 'diplomatic' | 'technological' | 'social';
  
  /** Content */
  subject: string;
  details: string;
  reliability: number; // 0-100
  
  /** Value */
  strategicValue: number; // 0-100
  timestamp: number;
  expiryDate: number;
}

export interface SpyNetwork {
  kingdomId: string; // Where network is based
  owner: string; // Who owns it
  agents: string[]; // Agent IDs
  safehouses: number;
  contacts: number;
  funding: number; // Monthly gold cost
  security: number; // 0-100, resistance to enemy counter-intel
  influence: number; // 0-100, ability to affect kingdom
}

export interface SabotageEvent {
  id: string;
  agentId: string;
  targetKingdom: string;
  targetType: 'production' | 'infrastructure' | 'military' | 'morale' | 'economy';
  target: string; // Specific target name
  
  /** Impact */
  damage: number; // 0-100
  duration: number; // days affected
  goldLoss: number;
  
  /** Detection */
  detected: boolean;
  attributedTo?: string; // Kingdom blamed
  
  timestamp: number;
}

export interface PropagandaCampaign {
  id: string;
  owner: string;
  targetKingdom: string;
  message: string;
  type: 'morale_boost' | 'enemy_demoralize' | 'misinformation' | 'cultural' | 'political';
  
  /** Effectiveness */
  reach: number; // Number of people affected
  believability: number; // 0-100
  impact: number; // 0-100
  
  /** Counter-propaganda */
  countered: boolean;
  counterStrength: number;
  
  duration: number; // days active
  startDate: number;
}

export class EspionageSystem {
  private agents: Map<string, SpyAgent> = new Map();
  private missions: Map<string, SpyMission> = new Map();
  private networks: Map<string, SpyNetwork> = new Map();
  private intelligenceReports: IntelligenceReport[] = [];
  private sabotageEvents: SabotageEvent[] = [];
  private propagandaCampaigns: Map<string, PropagandaCampaign> = new Map();
  
  private maxReportHistory = 500;
  private maxSabotageHistory = 200;

  /**
   * Recruit and train a new spy
   */
  public recruitAgent(
    id: string,
    owner: string,
    name: string,
    baseSkills: { intelligence: number; stealth: number; deception: number }
  ): SpyAgent {
    const agent: SpyAgent = {
      id,
      name,
      owner,
      location: owner, // Starts at home
      intelligence: baseSkills.intelligence,
      stealth: baseSkills.stealth,
      deception: baseSkills.deception,
      loyalty: 70 + Math.random() * 20,
      level: 1,
      experience: 0,
      cover: this.assignCover(baseSkills.intelligence),
      detected: false,
      captured: false,
      networkSize: 0,
      influence: 0
    };

    this.agents.set(id, agent);
    return agent;
  }

  /**
   * Assign cover identity based on skills
   */
  private assignCover(intelligence: number): SpyAgent['cover'] {
    if (intelligence > 80) return 'scholar';
    if (intelligence > 60) return 'diplomat';
    if (intelligence > 40) return 'merchant';
    return 'servant';
  }

  /**
   * Deploy agent to target kingdom
   */
  public deployAgent(agentId: string, targetKingdom: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent || agent.captured) return false;

    agent.location = targetKingdom;
    agent.networkSize = 0;
    agent.influence = 0;

    return true;
  }

  /**
   * Build spy network in target kingdom
   */
  public buildNetwork(
    kingdomId: string,
    owner: string,
    agentIds: string[],
    initialFunding: number
  ): SpyNetwork {
    const network: SpyNetwork = {
      kingdomId,
      owner,
      agents: agentIds,
      safehouses: 1,
      contacts: 10,
      funding: initialFunding,
      security: 30,
      influence: 5
    };

    this.networks.set(`${owner}_${kingdomId}`, network);

    // Update agents
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.location = kingdomId;
      }
    }

    return network;
  }

  /**
   * Expand spy network
   */
  public expandNetwork(networkKey: string, funding: number): {
    success: boolean;
    safehouses: number;
    contacts: number;
    influence: number;
  } {
    const network = this.networks.get(networkKey);
    if (!network) return { success: false, safehouses: 0, contacts: 0, influence: 0 };

    // Calculate expansion based on funding
    const expansion = Math.floor(funding / 1000);
    
    network.safehouses += Math.floor(expansion * 0.5);
    network.contacts += expansion * 10;
    network.influence = Math.min(100, network.influence + expansion * 2);
    network.security = Math.min(100, network.security + expansion);
    network.funding += funding;

    return {
      success: true,
      safehouses: network.safehouses,
      contacts: network.contacts,
      influence: network.influence
    };
  }

  /**
   * Assign mission to agent
   */
  public assignMission(
    missionId: string,
    agentId: string,
    type: SpyMission['type'],
    targetKingdom: string,
    target?: string
  ): SpyMission | null {
    const agent = this.agents.get(agentId);
    if (!agent || agent.captured || agent.currentMission) return null;

    // Calculate difficulty based on mission type
    const difficulty = this.calculateMissionDifficulty(type, agent, targetKingdom);
    const detectionRisk = this.calculateDetectionRisk(type, agent, difficulty);

    const mission: SpyMission = {
      id: missionId,
      type,
      agentId,
      targetKingdom,
      target,
      startDate: Date.now(),
      duration: this.getMissionDuration(type),
      progress: 0,
      difficulty,
      detectionRisk,
      intelligenceValue: type === 'intelligence' ? 50 + Math.random() * 50 : 0,
      sabotageImpact: type === 'sabotage' ? 30 + Math.random() * 70 : 0,
      status: 'planning'
    };

    this.missions.set(missionId, mission);
    agent.currentMission = mission;

    return mission;
  }

  /**
   * Calculate mission difficulty
   */
  private calculateMissionDifficulty(
    type: SpyMission['type'],
    agent: SpyAgent,
    targetKingdom: string
  ): number {
    let baseDifficulty = 50;

    switch (type) {
      case 'intelligence':
        baseDifficulty = 30;
        break;
      case 'sabotage':
        baseDifficulty = 60;
        break;
      case 'assassination':
        baseDifficulty = 90;
        break;
      case 'propaganda':
        baseDifficulty = 40;
        break;
      case 'recruitment':
        baseDifficulty = 50;
        break;
      case 'counter_intel':
        baseDifficulty = 70;
        break;
    }

    // Agent's network reduces difficulty
    baseDifficulty -= agent.networkSize * 2;
    baseDifficulty -= agent.influence;

    // Foreign location increases difficulty
    if (agent.location !== targetKingdom) {
      baseDifficulty += 20;
    }

    return Math.max(10, Math.min(100, baseDifficulty));
  }

  /**
   * Calculate detection risk
   */
  private calculateDetectionRisk(
    type: SpyMission['type'],
    agent: SpyAgent,
    difficulty: number
  ): number {
    let baseRisk = difficulty * 0.5;

    // Agent skills reduce risk
    baseRisk -= agent.stealth * 0.3;
    baseRisk -= agent.deception * 0.2;

    // Mission type affects risk
    if (type === 'assassination' || type === 'sabotage') {
      baseRisk += 30;
    }

    return Math.max(5, Math.min(95, baseRisk));
  }

  /**
   * Get mission duration in days
   */
  private getMissionDuration(type: SpyMission['type']): number {
    switch (type) {
      case 'intelligence':
        return 7 + Math.floor(Math.random() * 14); // 1-3 weeks
      case 'sabotage':
        return 14 + Math.floor(Math.random() * 28); // 2-6 weeks
      case 'assassination':
        return 30 + Math.floor(Math.random() * 60); // 1-3 months
      case 'propaganda':
        return 7 + Math.floor(Math.random() * 7); // 1-2 weeks
      case 'recruitment':
        return 30; // 1 month
      case 'counter_intel':
        return 60; // 2 months
    }
  }

  /**
   * Process mission progress (call daily)
   */
  public processMission(missionId: string): {
    completed: boolean;
    failed: boolean;
    detected: boolean;
    result?: any;
  } {
    const mission = this.missions.get(missionId);
    if (!mission || mission.status !== 'planning' && mission.status !== 'ongoing') {
      return { completed: false, failed: false, detected: false };
    }

    const agent = this.agents.get(mission.agentId);
    if (!agent) return { completed: false, failed: true, detected: false };

    mission.status = 'ongoing';

    // Daily progress
    const skillFactor = (agent.intelligence + agent.stealth + agent.deception) / 300;
    const dailyProgress = (100 / mission.duration) * skillFactor;
    mission.progress = Math.min(100, mission.progress + dailyProgress);

    // Check for detection
    const detected = Math.random() * 100 < mission.detectionRisk / mission.duration;
    if (detected) {
      mission.status = 'compromised';
      agent.detected = true;
      
      // Chance of capture
      if (Math.random() < 0.3) {
        agent.captured = true;
      }

      return { completed: false, failed: true, detected: true };
    }

    // Check for completion
    if (mission.progress >= 100) {
      mission.status = 'completed';
      const result = this.completeMission(mission, agent);
      return { completed: true, failed: false, detected: false, result };
    }

    return { completed: false, failed: false, detected: false };
  }

  /**
   * Complete mission and generate results
   */
  private completeMission(mission: SpyMission, agent: SpyAgent): any {
    agent.experience += 10 + mission.difficulty / 10;
    agent.currentMission = undefined;

    // Level up
    if (agent.experience >= agent.level * 100) {
      agent.level++;
      agent.experience = 0;
      agent.intelligence = Math.min(100, agent.intelligence + 5);
      agent.stealth = Math.min(100, agent.stealth + 5);
      agent.deception = Math.min(100, agent.deception + 5);
    }

    switch (mission.type) {
      case 'intelligence':
        return this.generateIntelligenceReport(mission, agent);
      case 'sabotage':
        return this.executeSabotage(mission, agent);
      case 'propaganda':
        return this.launchPropaganda(mission, agent);
      case 'recruitment':
        agent.networkSize += 5;
        agent.influence += 10;
        return { recruited: 5 };
      default:
        return { success: true };
    }
  }

  /**
   * Generate intelligence report
   */
  private generateIntelligenceReport(mission: SpyMission, agent: SpyAgent): IntelligenceReport {
    const report: IntelligenceReport = {
      id: `intel_${Date.now()}`,
      source: agent.id,
      targetKingdom: mission.targetKingdom,
      type: ['military', 'economic', 'diplomatic', 'technological', 'social'][Math.floor(Math.random() * 5)] as any,
      subject: `Intelligence on ${mission.targetKingdom}`,
      details: `Gathered by ${agent.name}`,
      reliability: agent.intelligence,
      strategicValue: mission.intelligenceValue,
      timestamp: Date.now(),
      expiryDate: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };

    this.intelligenceReports.push(report);
    if (this.intelligenceReports.length > this.maxReportHistory) {
      this.intelligenceReports.shift();
    }

    return report;
  }

  /**
   * Execute sabotage
   */
  private executeSabotage(mission: SpyMission, agent: SpyAgent): SabotageEvent {
    const sabotage: SabotageEvent = {
      id: `sabotage_${Date.now()}`,
      agentId: agent.id,
      targetKingdom: mission.targetKingdom,
      targetType: 'production', // Could be randomized or specified
      target: mission.target || 'Unknown',
      damage: mission.sabotageImpact,
      duration: 30 + Math.floor(Math.random() * 60),
      goldLoss: mission.sabotageImpact * 1000,
      detected: false,
      timestamp: Date.now()
    };

    this.sabotageEvents.push(sabotage);
    if (this.sabotageEvents.length > this.maxSabotageHistory) {
      this.sabotageEvents.shift();
    }

    return sabotage;
  }

  /**
   * Launch propaganda campaign
   */
  private launchPropaganda(mission: SpyMission, agent: SpyAgent): PropagandaCampaign {
    const campaign: PropagandaCampaign = {
      id: `propaganda_${Date.now()}`,
      owner: agent.owner,
      targetKingdom: mission.targetKingdom,
      message: 'Propaganda message',
      type: 'enemy_demoralize',
      reach: agent.networkSize * 1000,
      believability: agent.deception,
      impact: 50 + Math.random() * 50,
      countered: false,
      counterStrength: 0,
      duration: 60,
      startDate: Date.now()
    };

    this.propagandaCampaigns.set(campaign.id, campaign);
    return campaign;
  }

  /**
   * Counter enemy propaganda
   */
  public counterPropaganda(campaignId: string, strength: number): boolean {
    const campaign = this.propagandaCampaigns.get(campaignId);
    if (!campaign) return false;

    campaign.countered = true;
    campaign.counterStrength = strength;
    campaign.impact = Math.max(0, campaign.impact - strength);

    return true;
  }

  /**
   * Get active intelligence reports
   */
  public getActiveIntelligence(targetKingdom?: string): IntelligenceReport[] {
    const now = Date.now();
    return this.intelligenceReports.filter(
      r => r.expiryDate > now && (!targetKingdom || r.targetKingdom === targetKingdom)
    );
  }

  /**
   * Serialize for save
   */
  public serialize(): any {
    return {
      agents: Array.from(this.agents.entries()),
      missions: Array.from(this.missions.entries()),
      networks: Array.from(this.networks.entries()),
      intelligenceReports: this.intelligenceReports.slice(-200),
      sabotageEvents: this.sabotageEvents.slice(-100),
      propagandaCampaigns: Array.from(this.propagandaCampaigns.entries())
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.agents) {
      this.agents = new Map(data.agents);
    }
    if (data.missions) {
      this.missions = new Map(data.missions);
    }
    if (data.networks) {
      this.networks = new Map(data.networks);
    }
    if (data.intelligenceReports) {
      this.intelligenceReports = data.intelligenceReports;
    }
    if (data.sabotageEvents) {
      this.sabotageEvents = data.sabotageEvents;
    }
    if (data.propagandaCampaigns) {
      this.propagandaCampaigns = new Map(data.propagandaCampaigns);
    }
  }
}
