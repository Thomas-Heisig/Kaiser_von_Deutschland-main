// src/ui/TradeRoutesPanel.ts
import { GameEngine } from '../core/GameEngine';
import { Player } from '../core/Player';
import { TradeRoute, TransportType } from '../core/TransportSystem';
import { NotificationSystem } from './NotificationSystem';

/**
 * UI Panel for managing trade routes (v2.6.0)
 */
export class TradeRoutesPanel {
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
    container.className = 'trade-routes-panel';
    document.body.appendChild(container);
    return container;
  }

  public setPlayer(player: Player): void {
    this.currentPlayer = player;
    this.render();
  }

  public refresh(): void {
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="trade-routes-header">
        <h2>🚢 Handelsrouten & Transport</h2>
        <p class="subtitle">Verwalte deine Handelsrouten und Transportnetzwerke</p>
      </div>
      
      <div class="features-tabs">
        <button class="tab-btn active" data-tab="active-routes">🔄 Aktive Routen</button>
        <button class="tab-btn" data-tab="available-routes">🗺️ Verfügbare Routen</button>
        <button class="tab-btn" data-tab="transport-types">🚂 Transportmittel</button>
        <button class="tab-btn" data-tab="statistics">📊 Statistiken</button>
      </div>
      
      <div class="tab-content active" id="active-routes-tab">
        ${this.renderActiveRoutesTab()}
      </div>
      
      <div class="tab-content" id="available-routes-tab">
        ${this.renderAvailableRoutesTab()}
      </div>
      
      <div class="tab-content" id="transport-types-tab">
        ${this.renderTransportTypesTab()}
      </div>
      
      <div class="tab-content" id="statistics-tab">
        ${this.renderStatisticsTab()}
      </div>
    `;

    this.setupEventListeners();
  }

  private renderActiveRoutesTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const activeRouteIds = this.currentPlayer.kingdom.getActiveTradeRoutes();
    
    if (activeRouteIds.length === 0) {
      return `
        <div class="empty-state">
          <p>🚫 Keine aktiven Handelsrouten</p>
          <p class="hint">Wechseln Sie zum Tab "Verfügbare Routen", um Routen zu aktivieren.</p>
        </div>
      `;
    }

    const transportSystem = this.game.getTransportSystem();
    const routes = activeRouteIds
      .map(id => transportSystem.getTradeRoute(id))
      .filter((r): r is TradeRoute => r !== undefined);

    let html = '<div class="active-routes-list">';
    
    for (const route of routes) {
      const monthlyIncome = Math.floor(route.effects.trade_income / 12);
      const culturalValue = route.culturalExchange || route.effects.cultural_influence || 0;
      
      html += `
        <div class="route-card active">
          <div class="route-header">
            <h4>${route.name}</h4>
            <button class="btn-deactivate" data-route-id="${route.id}">❌ Deaktivieren</button>
          </div>
          <div class="route-details">
            <p><strong>Von:</strong> ${route.origin} <strong>Nach:</strong> ${route.destination}</p>
            <p><strong>Distanz:</strong> ${route.length} km</p>
            <p><strong>Hauptgüter:</strong> ${route.mainGoods.join(', ')}</p>
          </div>
          <div class="route-stats">
            <div class="stat">
              <span class="label">💰 Einkommen/Monat:</span>
              <span class="value">+${monthlyIncome} Gold</span>
            </div>
            <div class="stat">
              <span class="label">🎭 Kultureinfluss:</span>
              <span class="value">${culturalValue.toFixed(1)}</span>
            </div>
            <div class="stat">
              <span class="label">⚠️ Gefahr:</span>
              <span class="value">${this.getDangerLevel(route.danger)}</span>
            </div>
            <div class="stat">
              <span class="label">👑 Prestige:</span>
              <span class="value">+${route.effects.prestige || 0}</span>
            </div>
          </div>
          ${route.effects.technology_transfer ? 
            `<div class="route-bonus">🔬 Technologietransfer: +${route.effects.technology_transfer}</div>` : ''}
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }

  private renderAvailableRoutesTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const availableRoutes = this.game.getAvailableTradeRoutes(this.currentPlayer);
    const activeRouteIds = new Set(this.currentPlayer.kingdom.getActiveTradeRoutes());
    
    // Filter out already active routes
    const inactiveRoutes = availableRoutes.filter(route => !activeRouteIds.has(route.id));
    
    if (inactiveRoutes.length === 0) {
      return `
        <div class="empty-state">
          <p>✅ Alle verfügbaren Routen sind bereits aktiv!</p>
          <p class="hint">Schalte neue Technologien frei oder warte auf neue historische Epochen für weitere Routen.</p>
        </div>
      `;
    }

    let html = '<div class="available-routes-list">';
    
    for (const route of inactiveRoutes) {
      const activationCost = Math.floor(route.length * 10 + route.danger * 100);
      const yearlyIncome = route.effects.trade_income;
      const canAfford = this.currentPlayer.kingdom.resources.gold >= activationCost;
      
      // Check infrastructure requirements
      let requirementsMet = true;
      let requirementsHtml = '';
      
      if (route.id.includes('sea') || route.id.includes('naval')) {
        const hasPort = this.currentPlayer.kingdom.infrastructure.ports >= 1;
        requirementsMet = requirementsMet && hasPort;
        requirementsHtml += `<div class="requirement ${hasPort ? 'met' : 'unmet'}">
          ${hasPort ? '✅' : '❌'} Hafen erforderlich
        </div>`;
      }
      
      if (route.requiredTechnology) {
        const researched = new Set(this.game.getTechnologyProgress(this.currentPlayer.id).researched);
        const hasTech = researched.has(route.requiredTechnology);
        requirementsMet = requirementsMet && hasTech;
        requirementsHtml += `<div class="requirement ${hasTech ? 'met' : 'unmet'}">
          ${hasTech ? '✅' : '❌'} Technologie: ${route.requiredTechnology}
        </div>`;
      }
      
      const canActivate = canAfford && requirementsMet;
      
      html += `
        <div class="route-card available ${!canActivate ? 'disabled' : ''}">
          <div class="route-header">
            <h4>${route.name}</h4>
            <span class="route-period">${route.period.start} - ${route.period.end || 'Heute'}</span>
          </div>
          <div class="route-details">
            <p><strong>Von:</strong> ${route.origin} <strong>Nach:</strong> ${route.destination}</p>
            <p><strong>Distanz:</strong> ${route.length} km</p>
            <p><strong>Hauptgüter:</strong> ${route.mainGoods.join(', ')}</p>
          </div>
          <div class="route-stats">
            <div class="stat">
              <span class="label">💰 Einkommen/Jahr:</span>
              <span class="value positive">+${yearlyIncome} Gold</span>
            </div>
            <div class="stat">
              <span class="label">💵 Aktivierungskosten:</span>
              <span class="value ${canAfford ? '' : 'negative'}">${activationCost} Gold</span>
            </div>
            <div class="stat">
              <span class="label">📈 Rentabilität:</span>
              <span class="value">${route.profitability}/10</span>
            </div>
            <div class="stat">
              <span class="label">⚠️ Gefahr:</span>
              <span class="value">${this.getDangerLevel(route.danger)}</span>
            </div>
          </div>
          ${requirementsHtml ? `<div class="requirements">${requirementsHtml}</div>` : ''}
          <div class="route-actions">
            <button 
              class="btn-activate ${canActivate ? '' : 'disabled'}" 
              data-route-id="${route.id}"
              ${!canActivate ? 'disabled' : ''}
            >
              🚀 Aktivieren
            </button>
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }

  private renderTransportTypesTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const transportTypes = this.game.getAvailableTransportTypes(this.currentPlayer);
    
    if (transportTypes.length === 0) {
      return '<p class="info-text">Keine Transportmittel verfügbar.</p>';
    }

    // Group by category
    const byCategory: Record<string, TransportType[]> = {};
    for (const transport of transportTypes) {
      if (!byCategory[transport.category]) {
        byCategory[transport.category] = [];
      }
      byCategory[transport.category].push(transport);
    }

    const categoryNames: Record<string, string> = {
      pedestrian: '🚶 Zu Fuß',
      animal: '🐴 Reittiere',
      animal_drawn: '🐎 Gespanne',
      naval: '⛵ Schiffe',
      rail: '🚂 Eisenbahn',
      human_powered: '🚲 Menschenkraft',
      motor_vehicle: '🚗 Kraftfahrzeuge',
      aircraft: '✈️ Luftfahrt'
    };

    let html = '<div class="transport-types-list">';
    
    for (const [category, types] of Object.entries(byCategory)) {
      html += `
        <div class="transport-category">
          <h3>${categoryNames[category] || category}</h3>
          <div class="transport-grid">
      `;
      
      for (const transport of types) {
        const isUnlocked = this.currentPlayer.kingdom.hasTransportType(transport.id);
        
        html += `
          <div class="transport-card ${isUnlocked ? 'unlocked' : ''}">
            <h4>${transport.name}</h4>
            <div class="transport-era">${this.getEraName(transport.era)}</div>
            <div class="transport-stats">
              <div class="stat">
                <span class="label">🚀 Geschwindigkeit:</span>
                <span class="value">${transport.speed} km/h</span>
              </div>
              <div class="stat">
                <span class="label">📦 Kapazität:</span>
                <span class="value">${transport.capacity} Tonnen</span>
              </div>
              <div class="stat">
                <span class="label">💰 Kosten:</span>
                <span class="value">${transport.cost} Gold</span>
              </div>
              <div class="stat">
                <span class="label">🔧 Wartung:</span>
                <span class="value">${transport.maintenance} Gold/Monat</span>
              </div>
              <div class="stat">
                <span class="label">📏 Reichweite:</span>
                <span class="value">${transport.range} km</span>
              </div>
            </div>
            ${transport.requiredTechnology ? 
              `<div class="tech-requirement">🔬 Erfordert: ${transport.requiredTechnology}</div>` : ''}
            ${transport.infrastructureRequired ? 
              `<div class="infra-requirement">🏗️ Erfordert: ${transport.infrastructureRequired}</div>` : ''}
            ${isUnlocked ? '<div class="unlocked-badge">✅ Freigeschaltet</div>' : ''}
          </div>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }

  private renderStatisticsTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const stats = this.game.getTradeNetworkStats(this.currentPlayer);
    const kingdom = this.currentPlayer.kingdom;
    
    return `
      <div class="trade-statistics">
        <div class="stats-grid">
          <div class="stat-card">
            <h3>🔄 Aktive Routen</h3>
            <div class="stat-value">${stats.activeRoutes}</div>
          </div>
          
          <div class="stat-card">
            <h3>💰 Monatliches Einkommen</h3>
            <div class="stat-value">+${stats.monthlyIncome} Gold</div>
          </div>
          
          <div class="stat-card">
            <h3>💵 Jährliches Einkommen</h3>
            <div class="stat-value">+${stats.yearlyIncome} Gold</div>
          </div>
          
          <div class="stat-card">
            <h3>🎭 Kultureinfluss</h3>
            <div class="stat-value">${stats.culturalInfluence.toFixed(1)}</div>
          </div>
          
          <div class="stat-card">
            <h3>👑 Prestige-Bonus</h3>
            <div class="stat-value">+${stats.prestigeBonus}</div>
          </div>
          
          <div class="stat-card">
            <h3>📊 Handelsmacht</h3>
            <div class="stat-value">${kingdom.stats.tradePower}/100</div>
          </div>
        </div>
        
        <div class="infrastructure-bonus">
          <h3>🏗️ Infrastruktur-Boni</h3>
          <ul>
            <li>🏪 Märkte: ${kingdom.infrastructure.markets} (+${kingdom.infrastructure.markets * 10}% Handelsbonus)</li>
            <li>⚓ Häfen: ${kingdom.infrastructure.ports} (+${kingdom.infrastructure.ports * 15}% Handelsbonus)</li>
            <li>🛣️ Straßen: ${kingdom.infrastructure.roads} (+${kingdom.infrastructure.roads * 5}% Handelsbonus)</li>
            <li>📦 Lagerhäuser: ${kingdom.infrastructure.warehouses} (+${kingdom.infrastructure.warehouses * 8}% Handelsbonus)</li>
          </ul>
        </div>
        
        <div class="modifiers">
          <h3>⚖️ Handelsmodifikatoren</h3>
          <ul>
            <li class="${kingdom.stats.stability >= 50 ? 'positive' : 'negative'}">
              🏛️ Stabilität: ${kingdom.stats.stability}/100 
              ${kingdom.stats.stability < 50 ? `(-${((50 - kingdom.stats.stability) * 0.01 * 100).toFixed(0)}%)` : ''}
            </li>
            <li class="${kingdom.isAtWar ? 'negative' : 'positive'}">
              ⚔️ Kriegsstatus: ${kingdom.isAtWar ? 'Im Krieg (-30%)' : 'Frieden'}
            </li>
            <li class="positive">
              🤝 Handelspartner: ${kingdom.tradePartners.length} (+${Math.min(kingdom.tradePartners.length * 5, 25)}%)
            </li>
          </ul>
        </div>
        
        ${stats.routes.length > 0 ? `
          <div class="active-routes-summary">
            <h3>🗺️ Routen-Übersicht</h3>
            <table class="routes-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Einkommen/Jahr</th>
                  <th>Kultureinfluss</th>
                  <th>Prestige</th>
                </tr>
              </thead>
              <tbody>
                ${stats.routes.filter((r): r is TradeRoute => r !== undefined).map(route => `
                  <tr>
                    <td>${route.name}</td>
                    <td>+${route.effects.trade_income} Gold</td>
                    <td>${route.culturalExchange || route.effects.cultural_influence || 0}</td>
                    <td>+${route.effects.prestige || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;
  }

  private getDangerLevel(danger: number): string {
    if (danger < 20) return '🟢 Niedrig';
    if (danger < 50) return '🟡 Mittel';
    if (danger < 80) return '🟠 Hoch';
    return '🔴 Sehr Hoch';
  }

  private getEraName(era: string): string {
    const eraNames: Record<string, string> = {
      ancient: '⚱️ Antike',
      medieval: '🏰 Mittelalter',
      renaissance: '🎨 Renaissance',
      industrial: '⚙️ Industriell',
      modern: '🏙️ Modern',
      contemporary: '🚀 Zeitgenössisch'
    };
    return eraNames[era] || era;
  }

  private setupEventListeners(): void {
    // Tab switching
    const tabButtons = this.container.querySelectorAll('.tab-btn');
    const tabContents = this.container.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = (button as HTMLElement).dataset.tab;
        
        // Update active states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        const targetContent = this.container.querySelector(`#${tabName}-tab`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });

    // Activate route buttons
    const activateButtons = this.container.querySelectorAll('.btn-activate');
    activateButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const routeId = (button as HTMLElement).dataset.routeId;
        if (routeId && this.currentPlayer) {
          this.activateRoute(routeId);
        }
      });
    });

    // Deactivate route buttons
    const deactivateButtons = this.container.querySelectorAll('.btn-deactivate');
    deactivateButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const routeId = (button as HTMLElement).dataset.routeId;
        if (routeId && this.currentPlayer) {
          this.deactivateRoute(routeId);
        }
      });
    });
  }

  private activateRoute(routeId: string): void {
    if (!this.currentPlayer) return;

    const result = this.game.activateTradeRoute(this.currentPlayer, routeId);
    
    if (result.success) {
      this.notificationSystem.show('Handelsroute aktiviert', result.message, 'success');
      this.render(); // Refresh the UI
    } else {
      this.notificationSystem.show('Fehler', result.message, 'error');
    }
  }

  private deactivateRoute(routeId: string): void {
    if (!this.currentPlayer) return;

    const result = this.game.deactivateTradeRoute(this.currentPlayer, routeId);
    
    if (result.success) {
      this.notificationSystem.show('Handelsroute deaktiviert', result.message, 'info');
      this.render(); // Refresh the UI
    } else {
      this.notificationSystem.show('Fehler', result.message, 'error');
    }
  }
}
