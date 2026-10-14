// src/ui/NewFeaturesPanel.ts
import { GameEngine } from '../core/GameEngine';
import { Player } from '../core/Player';
import { Policy, PolicyCategory } from '../core/PolicySystem';
import { NotificationSystem } from './NotificationSystem';

export class NewFeaturesPanel {
  private container: HTMLElement;
  private game: GameEngine;
  private currentPlayer?: Player;
  private notificationSystem: NotificationSystem;

  constructor(game: GameEngine, containerId: string, notificationSystem?: NotificationSystem) {
    this.game = game;
    this.container = document.getElementById(containerId) || this.createContainer(containerId);
    this.notificationSystem = notificationSystem || new NotificationSystem();
    this.render();
  }

  private createContainer(id: string): HTMLElement {
    const container = document.createElement('div');
    container.id = id;
    container.className = 'new-features-panel';
    document.body.appendChild(container);
    return container;
  }

  public setPlayer(player: Player): void {
    this.currentPlayer = player;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="features-tabs">
        <button class="tab-btn active" data-tab="policies">📋 Politik</button>
        <button class="tab-btn" data-tab="ollama">🤖 KI Berater</button>
        <button class="tab-btn" data-tab="multiplayer">🌐 Multiplayer</button>
        <button class="tab-btn" data-tab="wiki">📚 Wiki</button>
      </div>
      
      <div class="tab-content active" id="policies-tab">
        ${this.renderPoliciesTab()}
      </div>
      
      <div class="tab-content" id="ollama-tab">
        ${this.renderOllamaTab()}
      </div>
      
      <div class="tab-content" id="multiplayer-tab">
        ${this.renderMultiplayerTab()}
      </div>
      
      <div class="tab-content" id="wiki-tab">
        ${this.renderWikiTab()}
      </div>
    `;

    this.setupEventListeners();
  }

  private renderPoliciesTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const policySystem = this.game.getPolicySystem();
    const activePolicies = policySystem.getActivePolicies(this.currentPlayer.id);
    const allPolicies = policySystem.getAllPolicies();
    const currentYear = this.game.getCurrentYear();

    // Group policies by category
    const categories: Record<PolicyCategory, Policy[]> = {} as any;
    allPolicies.forEach(policy => {
      if (!categories[policy.category]) {
        categories[policy.category] = [];
      }
      categories[policy.category].push(policy);
    });

    const categoryNames: Record<PolicyCategory, string> = {
      asylum_immigration: '🌍 Asyl & Zuwanderung',
      economy_domestic: '💰 Wirtschaft - Inland',
      economy_foreign: '🚢 Wirtschaft - Außenhandel',
      health: '🏥 Gesundheit',
      social_positive: '🤝 Soziales - Förderung',
      social_negative: '⛓️ Soziales - Restriktion',
      social_tensions: '⚡ Soziale Spannungen',
      social_urban: '🏙️ Ballungsräume',
      environment: '🌱 Umweltpolitik',
      digital: '💻 Digitalpolitik',
      science: '🔬 Wissenschaftspolitik',
      security: '🛡️ Sicherheitspolitik'
    };

    let html = `
      <div class="policies-header">
        <h3>Aktive Politiken (${activePolicies.length})</h3>
      </div>
      
      <div class="active-policies">
        ${activePolicies.length === 0 
          ? '<p class="info-text">Keine aktiven Politiken</p>' 
          : activePolicies.map(policy => `
            <div class="policy-card active">
              <div class="policy-header">
                <strong>${policy.name}</strong>
                <button class="btn-small btn-danger" data-repeal="${policy.id}">Widerrufen</button>
              </div>
              <p class="policy-description">${policy.description}</p>
              <div class="policy-meta">
                <span class="policy-impact ${policy.impact}">${policy.impact}</span>
                <span>Aktiv seit: ${policy.enactedYear} (${policy.monthsActive} Monate)</span>
              </div>
            </div>
          `).join('')
        }
      </div>
      
      <div class="policies-categories">
        <h3>Verfügbare Politiken</h3>
        ${Object.entries(categories).map(([category, policies]) => `
          <details class="policy-category" open>
            <summary>
              <strong>${categoryNames[category as PolicyCategory]}</strong>
              <span class="badge">${policies.length}</span>
            </summary>
            <div class="policies-list">
              ${policies.map(policy => {
                const check = policySystem.canEnactPolicy(policy.id, this.currentPlayer!, currentYear);
                const isActive = activePolicies.some(ap => ap.id === policy.id);
                
                return `
                  <div class="policy-card ${isActive ? 'disabled' : ''} ${check.canEnact ? 'available' : 'unavailable'}">
                    <div class="policy-header">
                      <strong>${policy.name}</strong>
                      ${policy.introduced ? `<span class="policy-year">ab ${policy.introduced}</span>` : ''}
                    </div>
                    <p class="policy-description">${policy.description}</p>
                    <div class="policy-effects">
                      ${this.renderPolicyEffects(policy)}
                    </div>
                    ${!check.canEnact ? `
                      <div class="policy-requirements">
                        <small>⚠️ ${check.reasons.join(', ')}</small>
                      </div>
                    ` : ''}
                    ${!isActive && check.canEnact ? `
                      <button class="btn-small btn-primary" data-enact="${policy.id}">Einführen</button>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </details>
        `).join('')}
      </div>
    `;

    return html;
  }

  private renderPolicyEffects(policy: Policy): string {
    const effects: string[] = [];
    
    if (policy.immediateEffects) {
      if (policy.immediateEffects.happiness) {
        effects.push(`Zufriedenheit: ${policy.immediateEffects.happiness > 0 ? '+' : ''}${policy.immediateEffects.happiness}`);
      }
      if (policy.immediateEffects.stats?.prestige) {
        effects.push(`Prestige: ${policy.immediateEffects.stats.prestige > 0 ? '+' : ''}${policy.immediateEffects.stats.prestige}`);
      }
    }
    
    if (policy.monthlyEffects) {
      if (policy.monthlyEffects.resources?.gold) {
        effects.push(`Gold/Monat: ${policy.monthlyEffects.resources.gold > 0 ? '+' : ''}${policy.monthlyEffects.resources.gold}`);
      }
    }
    
    if (policy.maintenanceCost?.goldPerMonth) {
      effects.push(`Kosten: ${policy.maintenanceCost.goldPerMonth} Gold/Monat`);
    }
    
    return effects.length > 0 
      ? `<div class="effects-list">${effects.map(e => `<span class="effect-badge">${e}</span>`).join('')}</div>`
      : '';
  }

  private renderOllamaTab(): string {
    const ollamaService = this.game.getOllamaService();
    
    if (!ollamaService) {
      return `
        <div class="ollama-status">
          <h3>🤖 Ollama KI-Integration</h3>
          <p class="info-text">Ollama ist nicht aktiviert.</p>
          <button class="btn-primary" id="enable-ollama-btn">Ollama aktivieren</button>
          <div class="ollama-info">
            <h4>Was ist Ollama?</h4>
            <p>Ollama ermöglicht die Integration von KI-Modellen als Spieler und Berater.</p>
            <h4>Installation:</h4>
            <ol>
              <li>Ollama herunterladen: <a href="https://ollama.ai" target="_blank">ollama.ai</a></li>
              <li>Installieren und starten</li>
              <li>Modell herunterladen: <code>ollama pull llama2</code></li>
            </ol>
          </div>
        </div>
      `;
    }

    const models = ollamaService.getAvailableModels();
    const currentModel = ollamaService.getCurrentModel();

    return `
      <div class="ollama-panel">
        <h3>🤖 KI-Berater (Ollama)</h3>
        
        <div class="model-selector">
          <label>Aktives Modell:</label>
          <select id="ollama-model-select">
            ${models.map(model => `
              <option value="${model.name}" ${model.name === currentModel ? 'selected' : ''}>
                ${model.displayName} (${model.size}) - ${model.personality}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="ollama-actions">
          <button class="btn-primary" id="get-advisor-suggestion">💡 Rat einholen</button>
          <button class="btn-primary" id="get-ai-decision">🎲 KI-Entscheidung</button>
        </div>
        
        <div class="ollama-chat">
          <h4>Chat mit KI</h4>
          <div id="ollama-chat-history" class="chat-history"></div>
          <div class="chat-input-group">
            <input type="text" id="ollama-chat-input" placeholder="Nachricht an KI...">
            <button class="btn-primary" id="send-ollama-chat">Senden</button>
          </div>
        </div>
        
        <div id="ollama-response" class="response-area"></div>
      </div>
    `;
  }

  private renderMultiplayerTab(): string {
    const multiplayerSystem = this.game.getMultiplayerSystem();
    
    if (!multiplayerSystem) {
      return `
        <div class="multiplayer-status">
          <h3>🌐 Multiplayer</h3>
          <p class="info-text">Multiplayer ist nicht aktiviert.</p>
          <button class="btn-primary" id="enable-multiplayer-btn">Multiplayer aktivieren</button>
        </div>
      `;
    }

    const session = multiplayerSystem.getSession();
    const status = multiplayerSystem.getConnectionStatus();

    if (!session) {
      return `
        <div class="multiplayer-lobby">
          <h3>🌐 Multiplayer Lobby</h3>
          <p>Status: ${status}</p>
          
          <div class="lobby-actions">
            <button class="btn-primary" id="create-session-btn">Session erstellen</button>
            <button class="btn-secondary" id="join-session-btn">Session beitreten</button>
          </div>
        </div>
      `;
    }

    const players = multiplayerSystem.getPlayers();
    const chatHistory = multiplayerSystem.getChatHistory(20);

    return `
      <div class="multiplayer-session">
        <h3>🌐 ${session.name}</h3>
        <p>Status: ${session.status} | Spieler: ${players.length}/${session.config.maxPlayers}</p>
        
        <div class="players-grid">
          ${players.map(player => `
            <div class="player-card ${player.type}">
              <span class="player-name">${player.name}</span>
              <span class="player-type">${player.type}</span>
              ${player.isHost ? '<span class="badge">Host</span>' : ''}
              ${player.isReady ? '<span class="badge ready">Bereit</span>' : '<span class="badge">Nicht bereit</span>'}
            </div>
          `).join('')}
        </div>
        
        ${session.status === 'lobby' ? `
          <div class="lobby-controls">
            <button class="btn-primary" id="add-ai-player-btn">KI-Spieler hinzufügen</button>
            <button class="btn-primary" id="start-multiplayer-btn">Spiel starten</button>
          </div>
        ` : ''}
        
        <div class="multiplayer-chat">
          <h4>Chat</h4>
          <div id="multiplayer-chat-history" class="chat-history">
            ${chatHistory.map(msg => `
              <div class="chat-message ${msg.isSystem ? 'system' : ''}">
                <strong>${msg.senderName}:</strong> ${msg.message}
              </div>
            `).join('')}
          </div>
          <div class="chat-input-group">
            <input type="text" id="multiplayer-chat-input" placeholder="Nachricht...">
            <button class="btn-primary" id="send-multiplayer-chat">Senden</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderWikiTab(): string {
    const wikiIntegration = this.game.getWikiIntegration();
    
    if (!wikiIntegration) {
      return '<p class="info-text">Wikipedia-Integration ist nicht verfügbar.</p>';
    }

    return `
      <div class="wiki-panel">
        <h3>📚 Wikipedia-Integration</h3>
        
        <div class="wiki-search">
          <input type="text" id="wiki-search-input" placeholder="Wikipedia durchsuchen...">
          <button class="btn-primary" id="wiki-search-btn">Suchen</button>
        </div>
        
        <div id="wiki-results" class="wiki-results"></div>
        
        <div class="wiki-suggestions">
          <h4>Vorgeschlagene Themen</h4>
          <div id="wiki-suggestions"></div>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Tab switching
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tab = target.dataset.tab;
        
        // Update active tab
        this.container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        target.classList.add('active');
        this.container.querySelector(`#${tab}-tab`)?.classList.add('active');
      });
    });

    // Policy enactment
    this.container.querySelectorAll('[data-enact]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const policyId = (e.target as HTMLElement).dataset.enact!;
        this.enactPolicy(policyId);
      });
    });

    // Policy repeal
    this.container.querySelectorAll('[data-repeal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const policyId = (e.target as HTMLElement).dataset.repeal!;
        this.repealPolicy(policyId);
      });
    });

    // Enable Ollama
    const enableOllamaBtn = this.container.querySelector('#enable-ollama-btn');
    if (enableOllamaBtn) {
      enableOllamaBtn.addEventListener('click', () => {
        this.game.enableOllama();
        this.render();
      });
    }

    // Enable Multiplayer
    const enableMultiplayerBtn = this.container.querySelector('#enable-multiplayer-btn');
    if (enableMultiplayerBtn) {
      enableMultiplayerBtn.addEventListener('click', () => {
        this.game.enableMultiplayer();
        this.render();
      });
    }

    // Ollama chat
    const sendChatBtn = this.container.querySelector('#send-ollama-chat');
    if (sendChatBtn) {
      sendChatBtn.addEventListener('click', () => this.sendOllamaChat());
    }

    // Multiplayer chat
    const sendMultiplayerChatBtn = this.container.querySelector('#send-multiplayer-chat');
    if (sendMultiplayerChatBtn) {
      sendMultiplayerChatBtn.addEventListener('click', () => this.sendMultiplayerChat());
    }

    // Wiki search
    const wikiSearchBtn = this.container.querySelector('#wiki-search-btn');
    if (wikiSearchBtn) {
      wikiSearchBtn.addEventListener('click', () => this.searchWiki());
    }
  }

  private enactPolicy(policyId: string): void {
    if (!this.currentPlayer) return;
    
    const policySystem = this.game.getPolicySystem();
    const success = policySystem.enactPolicy(
      policyId, 
      this.currentPlayer, 
      this.game.getCurrentYear(),
      this.game.getCurrentMonth()
    );
    
    if (success) {
      this.notificationSystem.show('Politik', 'Politik erfolgreich eingeführt!', 'success');
      this.render();
    } else {
      this.notificationSystem.show('Fehler', 'Politik konnte nicht eingeführt werden.', 'error');
    }
  }

  private repealPolicy(policyId: string): void {
    if (!this.currentPlayer) return;
    
    const policySystem = this.game.getPolicySystem();
    const success = policySystem.repealPolicy(
      policyId,
      this.currentPlayer,
      this.game.getCurrentYear()
    );
    
    if (success) {
      this.notificationSystem.show('Politik', 'Politik erfolgreich widerrufen!', 'success');
      this.render();
    } else {
      this.notificationSystem.show('Fehler', 'Politik konnte nicht widerrufen werden.', 'error');
    }
  }

  private async sendOllamaChat(): Promise<void> {
    const input = this.container.querySelector('#ollama-chat-input') as HTMLInputElement;
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    input.value = '';
    
    const ollamaService = this.game.getOllamaService();
    if (!ollamaService) return;
    
    const responseArea = this.container.querySelector('#ollama-response');
    if (responseArea) {
      responseArea.innerHTML = '<p>⏳ KI denkt nach...</p>';
    }
    
    try {
      const response = await ollamaService.chat(message, {
        playerName: this.currentPlayer?.name,
        role: 'Spieler'
      });
      
      if (responseArea) {
        responseArea.innerHTML = `<div class="ai-response"><strong>KI:</strong> ${response}</div>`;
      }
    } catch (error) {
      if (responseArea) {
        responseArea.innerHTML = '<p class="error">❌ Fehler bei der Kommunikation mit Ollama</p>';
      }
    }
  }

  private sendMultiplayerChat(): void {
    const input = this.container.querySelector('#multiplayer-chat-input') as HTMLInputElement;
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    input.value = '';
    
    const multiplayerSystem = this.game.getMultiplayerSystem();
    if (!multiplayerSystem) return;
    
    multiplayerSystem.sendChatMessage(message);
    this.render();
  }

  private async searchWiki(): Promise<void> {
    const input = this.container.querySelector('#wiki-search-input') as HTMLInputElement;
    if (!input || !input.value.trim()) return;
    
    const query = input.value.trim();
    const wikiIntegration = this.game.getWikiIntegration();
    if (!wikiIntegration) return;
    
    const resultsArea = this.container.querySelector('#wiki-results');
    if (resultsArea) {
      resultsArea.innerHTML = '<p>🔍 Suche läuft...</p>';
    }
    
    try {
      const results = await wikiIntegration.search(query, 5);
      
      if (resultsArea) {
        resultsArea.innerHTML = results.length > 0 
          ? results.map(r => `
              <div class="wiki-result">
                <h4>${r.title}</h4>
                <p>${r.snippet}</p>
              </div>
            `).join('')
          : '<p>Keine Ergebnisse gefunden.</p>';
      }
    } catch (error) {
      if (resultsArea) {
        resultsArea.innerHTML = '<p class="error">❌ Fehler bei der Wikipedia-Suche</p>';
      }
    }
  }
}
