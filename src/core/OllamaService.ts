// src/core/OllamaService.ts
import { Player } from './Player';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OllamaModel {
  name: string;
  displayName: string;
  size: string;
  description: string;
  personality?: string;
  expertise?: string[];
}

export interface OllamaResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
}

export interface AIPlayerDecision {
  action: 'build' | 'policy' | 'trade' | 'military' | 'wait';
  target?: string;
  reason: string;
  confidence: number;
}

export interface AIAdvisorSuggestion {
  category: 'economy' | 'military' | 'social' | 'politics' | 'general';
  suggestion: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedOutcome: string;
}

export type OllamaRole = 'player' | 'advisor' | 'observer';

export class OllamaService {
  private config: OllamaConfig;
  private availableModels: OllamaModel[] = [
    {
      name: 'llama2',
      displayName: 'Llama 2',
      size: '7B',
      description: 'General purpose AI, balanced decisions',
      personality: 'Balanced und pragmatisch',
      expertise: ['general', 'strategy']
    },
    {
      name: 'mistral',
      displayName: 'Mistral',
      size: '7B',
      description: 'Fast and efficient, quick decisions',
      personality: 'Schnell und effizient',
      expertise: ['economy', 'trade']
    },
    {
      name: 'codellama',
      displayName: 'Code Llama',
      size: '7B',
      description: 'Analytical and logical',
      personality: 'Analytisch und logisch',
      expertise: ['technology', 'infrastructure']
    },
    {
      name: 'neural-chat',
      displayName: 'Neural Chat',
      size: '7B',
      description: 'Social and diplomatic',
      personality: 'Diplomatisch und sozial',
      expertise: ['diplomacy', 'social']
    },
    {
      name: 'orca-mini',
      displayName: 'Orca Mini',
      size: '3B',
      description: 'Lightweight, conservative approach',
      personality: 'Konservativ und vorsichtig',
      expertise: ['defense', 'stability']
    },
    {
      name: 'vicuna',
      displayName: 'Vicuna',
      size: '7B',
      description: 'Creative and expansionist',
      personality: 'Kreativ und expansiv',
      expertise: ['culture', 'expansion']
    }
  ];

  private conversationHistory: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [];

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:11434',
      model: config.model || 'llama2',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 500
    };
  }

  /**
   * Check if Ollama is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.warn('Ollama service not available:', error);
      return false;
    }
  }

  /**
   * Get list of available models from Ollama
   */
  public async getInstalledModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
  }

  /**
   * Get available model configurations
   */
  public getAvailableModels(): OllamaModel[] {
    return [...this.availableModels];
  }

  /**
   * Change the active model
   */
  public setModel(modelName: string): void {
    this.config.model = modelName;
    this.conversationHistory = []; // Reset conversation when switching models
  }

  /**
   * Get current model
   */
  public getCurrentModel(): string {
    return this.config.model;
  }

  /**
   * Send a prompt to Ollama
   */
  private async sendPrompt(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }

      // Add conversation history
      messages.push(...this.conversationHistory);

      // Add current prompt
      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantResponse = data.message?.content || '';

      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: prompt },
        { role: 'assistant', content: assistantResponse }
      );

      // Keep history manageable (last 10 exchanges)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return assistantResponse;
    } catch (error) {
      console.error('Error communicating with Ollama:', error);
      throw error;
    }
  }

  /**
   * Get AI player decision
   */
  public async getAIPlayerDecision(
    player: Player,
    gameState: {
      year: number;
      month: number;
      availableActions: string[];
    }
  ): Promise<AIPlayerDecision> {
    const kingdom = player.kingdom;
    const stats = player.stats;

    const systemPrompt = `Du bist ein KI-Spieler im Spiel "Kaiser von Deutschland". 
Du spielst die Rolle: Herrscher.
Deine Persönlichkeit basiert auf dem Modell ${this.config.model}.
Treffe strategische Entscheidungen basierend auf dem aktuellen Spielzustand.`;

    const prompt = `
Aktueller Spielzustand:
- Jahr: ${gameState.year}, Monat: ${gameState.month}
- Gold: ${kingdom.resources.gold}
- Nahrung: ${kingdom.resources.food}
- Bevölkerung: ${Object.values(kingdom.population).reduce((a, b) => typeof b === 'number' ? a + b : a, 0)}
- Zufriedenheit: ${kingdom.happiness}/100
- Prestige: ${stats.prestige}
- Autorität: ${stats.authority}
- Popularität: ${stats.popularity}

Verfügbare Aktionen: ${gameState.availableActions.join(', ')}

Welche Aktion solltest du durchführen? Antworte im JSON-Format:
{
  "action": "build|policy|trade|military|wait",
  "target": "spezifisches Ziel falls relevant",
  "reason": "kurze Begründung",
  "confidence": 0.0-1.0
}`;

    try {
      const response = await this.sendPrompt(prompt, systemPrompt);
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        return decision as AIPlayerDecision;
      }
      
      // Fallback
      return {
        action: 'wait',
        reason: 'Keine klare Entscheidung möglich',
        confidence: 0.3
      };
    } catch (error) {
      console.error('Error getting AI decision:', error);
      return {
        action: 'wait',
        reason: 'Fehler bei der Entscheidungsfindung',
        confidence: 0.0
      };
    }
  }

  /**
   * Get advisor suggestions
   */
  public async getAdvisorSuggestion(
    player: Player,
    category?: AIAdvisorSuggestion['category']
  ): Promise<AIAdvisorSuggestion[]> {
    const kingdom = player.kingdom;
    const stats = player.stats;

    const systemPrompt = `Du bist ein weiser Berater für den Herrscher im Spiel "Kaiser von Deutschland".
Deine Aufgabe ist es, hilfreiche Ratschläge zu geben basierend auf dem aktuellen Zustand des Königreichs.
Sei präzise, strategisch und berücksichtige kurz- und langfristige Auswirkungen.`;

    const categoryFocus = category ? `Fokus auf: ${category}` : 'Allgemeine Beratung';

    const prompt = `
${categoryFocus}

Aktueller Zustand des Königreichs:
- Gold: ${kingdom.resources.gold}
- Nahrung: ${kingdom.resources.food}
- Zufriedenheit: ${kingdom.happiness}/100
- Stabilität: ${kingdom.stats.stability}/100
- Bevölkerung: ${Object.values(kingdom.population).reduce((a, b) => typeof b === 'number' ? a + b : a, 0)}
- Kriminalität: ${kingdom.stats.crimeRate}/100
- Prestige: ${stats.prestige}
- Autorität: ${stats.authority}/100
- Popularität: ${stats.popularity}/100
- Korruption: ${stats.corruption}/100

Gib 2-3 konkrete Empfehlungen im JSON-Format:
[
  {
    "category": "economy|military|social|politics|general",
    "suggestion": "konkrete Empfehlung",
    "priority": "low|medium|high|critical",
    "expectedOutcome": "erwartetes Ergebnis"
  }
]`;

    try {
      const response = await this.sendPrompt(prompt, systemPrompt);
      
      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions as AIAdvisorSuggestion[];
      }
      
      // Fallback
      return [{
        category: 'general',
        suggestion: 'Konzentriere dich auf Stabilität und Wirtschaftswachstum',
        priority: 'medium',
        expectedOutcome: 'Verbesserte Gesamtsituation'
      }];
    } catch (error) {
      console.error('Error getting advisor suggestions:', error);
      return [];
    }
  }

  /**
   * Analyze a specific event and suggest response
   */
  public async analyzeEvent(
    _player: Player,
    event: {
      title: string;
      description: string;
      choices?: Array<{ id: string; text: string }>;
    }
  ): Promise<{
    analysis: string;
    recommendedChoice?: string;
    reasoning: string;
  }> {
    const systemPrompt = `Du bist ein strategischer Berater. Analysiere Ereignisse und empfehle die beste Vorgehensweise.`;

    const choicesText = event.choices 
      ? `\n\nVerfügbare Optionen:\n${event.choices.map(c => `- ${c.id}: ${c.text}`).join('\n')}`
      : '';

    const prompt = `
Ereignis: ${event.title}
Beschreibung: ${event.description}${choicesText}

Analysiere dieses Ereignis und gib eine Empfehlung im JSON-Format:
{
  "analysis": "Analyse der Situation",
  "recommendedChoice": "ID der empfohlenen Option (falls verfügbar)",
  "reasoning": "Begründung für die Empfehlung"
}`;

    try {
      const response = await this.sendPrompt(prompt, systemPrompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        analysis: 'Ereignis erfordert sorgfältige Abwägung',
        reasoning: 'Keine eindeutige Empfehlung möglich'
      };
    } catch (error) {
      console.error('Error analyzing event:', error);
      return {
        analysis: 'Fehler bei der Analyse',
        reasoning: 'Technischer Fehler'
      };
    }
  }

  /**
   * Generate a chat response
   */
  public async chat(message: string, context?: {
    playerName?: string;
    role?: string;
  }): Promise<string> {
    const systemPrompt = context 
      ? `Du bist im Spiel "Kaiser von Deutschland". Chatte mit ${context.playerName || 'dem Spieler'} (Rolle: ${context.role || 'unbekannt'}).`
      : `Du bist ein Mitspieler im Spiel "Kaiser von Deutschland". Sei freundlich und hilfsbereit.`;

    try {
      return await this.sendPrompt(message, systemPrompt);
    } catch (error) {
      console.error('Error in chat:', error);
      return 'Entschuldigung, ich kann gerade nicht antworten.';
    }
  }

  /**
   * Clear conversation history
   */
  public clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  public getHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }

  /**
   * Export configuration
   */
  public exportConfig(): OllamaConfig {
    return { ...this.config };
  }

  /**
   * Import configuration
   */
  public importConfig(config: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
