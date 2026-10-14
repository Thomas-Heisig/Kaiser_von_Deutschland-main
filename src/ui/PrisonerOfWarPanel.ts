// src/ui/PrisonerOfWarPanel.ts

import type { GameEngine } from '../core/GameEngine';

// UI update constants
const POW_PANEL_CONSTANTS = {
  UPDATE_INTERVAL_MS: 3000
} as const;

/**
 * Panel to display Prisoner of War statistics and management
 */
export class PrisonerOfWarPanel {
  private container: HTMLElement | null = null;
  private engine: GameEngine;
  private updateInterval: number | null = null;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Creates and shows the PoW panel
   */
  public show(): void {
    // Create modal container
    this.container = document.createElement('div');
    this.container.id = 'pow-panel';
    this.container.className = 'pow-panel-modal';
    this.container.innerHTML = `
      <div class="pow-panel-content">
        <div class="pow-panel-header">
          <h2>⚔️ Kriegsgefangene (Prisoners of War)</h2>
          <button class="close-btn" id="close-pow-panel">✕</button>
        </div>
        <div class="pow-panel-body">
          <div class="pow-stats-section">
            <h3>Gefangenen-Statistiken</h3>
            <div id="pow-stats"></div>
          </div>
          <div class="pow-camps-section">
            <h3>Gefangenenlager</h3>
            <div id="pow-camps"></div>
          </div>
          <div class="pow-events-section">
            <h3>Neueste Ereignisse</h3>
            <div id="pow-events"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Add styles
    this.addStyles();

    // Set up event listeners
    const closeBtn = document.getElementById('close-pow-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Initial render
    this.render();

    // Auto-update every 3 seconds
    this.updateInterval = window.setInterval(() => this.render(), 
      POW_PANEL_CONSTANTS.UPDATE_INTERVAL_MS
    );
  }

  /**
   * Hides and removes the panel
   */
  public hide(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }

  /**
   * Renders the PoW data
   */
  private render(): void {
    if (!this.container) return;

    const powSystem = this.engine.getPrisonerOfWarSystem();
    const stats = powSystem.getStatistics();
    const camps = powSystem.getAllCamps();
    const events = powSystem.getRecentEvents(5);

    this.renderStats(stats);
    this.renderCamps(camps);
    this.renderEvents(events);
  }

  private renderStats(stats: any): void {
    const statsDiv = document.getElementById('pow-stats');
    if (!statsDiv) return;

    const html = `
      <div class="pow-stat-cards">
        <div class="pow-stat-card">
          <div class="pow-stat-label">Gesamt Gefangene</div>
          <div class="pow-stat-value">${stats.totalPrisoners.toLocaleString()}</div>
        </div>
        <div class="pow-stat-card">
          <div class="pow-stat-label">In Lagern</div>
          <div class="pow-stat-value">${stats.byCaptureStatus.held.toLocaleString()}</div>
        </div>
        <div class="pow-stat-card">
          <div class="pow-stat-label">Ausgetauscht</div>
          <div class="pow-stat-value">${stats.byCaptureStatus.exchanged.toLocaleString()}</div>
        </div>
        <div class="pow-stat-card">
          <div class="pow-stat-label">Entkommen</div>
          <div class="pow-stat-value">${stats.byCaptureStatus.escaped.toLocaleString()}</div>
        </div>
      </div>
      
      <div class="pow-rank-distribution">
        <h4>Nach Rang</h4>
        <div class="pow-rank-bars">
          <div class="pow-rank-bar">
            <span class="rank-label">Soldaten:</span>
            <span class="rank-value">${stats.byRank.soldier.toLocaleString()}</span>
          </div>
          <div class="pow-rank-bar">
            <span class="rank-label">Offiziere:</span>
            <span class="rank-value">${stats.byRank.officer.toLocaleString()}</span>
          </div>
          <div class="pow-rank-bar">
            <span class="rank-label">Generäle:</span>
            <span class="rank-value">${stats.byRank.general.toLocaleString()}</span>
          </div>
          <div class="pow-rank-bar">
            <span class="rank-label">Adlige:</span>
            <span class="rank-value">${stats.byRank.noble.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div class="pow-costs">
        <h4>Monatliche Kosten</h4>
        <div class="cost-display">
          💰 ${stats.monthlyMaintenanceCost.toLocaleString()} Gold
        </div>
      </div>
    `;

    statsDiv.innerHTML = html;
  }

  private renderCamps(camps: any[]): void {
    const campsDiv = document.getElementById('pow-camps');
    if (!campsDiv) return;

    if (camps.length === 0) {
      campsDiv.innerHTML = '<p class="no-data">Keine Gefangenenlager vorhanden</p>';
      return;
    }

    const html = camps.map(camp => {
      const occupancyPercent = ((camp.currentOccupancy / camp.capacity) * 100).toFixed(0);
      const conditionsColor = camp.conditions > 70 ? '#4CAF50' : camp.conditions > 40 ? '#FFA726' : '#F44336';
      
      return `
        <div class="pow-camp-card">
          <div class="camp-header">
            <h4>${camp.name}</h4>
            <span class="camp-location">📍 ${camp.location}</span>
          </div>
          <div class="camp-details">
            <div class="camp-stat">
              <span class="label">Kapazität:</span>
              <span class="value">${camp.currentOccupancy} / ${camp.capacity}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${occupancyPercent}%"></div>
            </div>
            <div class="camp-stat">
              <span class="label">Sicherheit:</span>
              <span class="value">${camp.securityLevel}/10 🔒</span>
            </div>
            <div class="camp-stat">
              <span class="label">Bedingungen:</span>
              <span class="value" style="color: ${conditionsColor}">${camp.conditions}/100</span>
            </div>
            <div class="camp-stat">
              <span class="label">Behandlung:</span>
              <span class="value">${this.formatTreatmentPolicy(camp.treatmentPolicy)}</span>
            </div>
            <div class="camp-stat">
              <span class="label">Wachen:</span>
              <span class="value">${camp.guards}</span>
            </div>
            <div class="camp-stat">
              <span class="label">Monatliche Kosten:</span>
              <span class="value">💰 ${camp.monthlyMaintenanceCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    campsDiv.innerHTML = html;
  }

  private renderEvents(events: any[]): void {
    const eventsDiv = document.getElementById('pow-events');
    if (!eventsDiv) return;

    if (events.length === 0) {
      eventsDiv.innerHTML = '<p class="no-data">Keine Ereignisse</p>';
      return;
    }

    const html = events.map(event => {
      const icon = this.getEventIcon(event.type);
      return `
        <div class="pow-event-card">
          <div class="event-icon">${icon}</div>
          <div class="event-details">
            <div class="event-header">
              <span class="event-type">${this.formatEventType(event.type)}</span>
              <span class="event-year">${event.year}</span>
            </div>
            <div class="event-description">${event.description}</div>
            <div class="event-location">📍 ${event.location}</div>
            ${this.renderConsequences(event.consequences)}
          </div>
        </div>
      `;
    }).join('');

    eventsDiv.innerHTML = html;
  }

  private formatTreatmentPolicy(policy: string): string {
    const policies: Record<string, string> = {
      'humane': '👍 Menschlich',
      'standard': '⚖️ Standard',
      'harsh': '⚠️ Hart',
      'forced_labor': '⛏️ Zwangsarbeit',
      'ransom': '💰 Lösegeld',
      'execution': '☠️ Hinrichtung'
    };
    return policies[policy] || policy;
  }

  private getEventIcon(type: string): string {
    const icons: Record<string, string> = {
      'capture': '🎯',
      'escape': '🏃',
      'exchange': '🤝',
      'release': '🕊️',
      'death': '💀',
      'execution': '☠️',
      'uprising': '✊'
    };
    return icons[type] || '📋';
  }

  private formatEventType(type: string): string {
    const types: Record<string, string> = {
      'capture': 'Gefangennahme',
      'escape': 'Flucht',
      'exchange': 'Austausch',
      'release': 'Freilassung',
      'death': 'Tod',
      'execution': 'Hinrichtung',
      'uprising': 'Aufstand'
    };
    return types[type] || type;
  }

  private renderConsequences(consequences: any): string {
    if (!consequences || Object.keys(consequences).length === 0) {
      return '';
    }

    const items = [];
    if (consequences.diplomatic) {
      items.push(`🤝 Diplomatie: ${consequences.diplomatic > 0 ? '+' : ''}${consequences.diplomatic}`);
    }
    if (consequences.morale) {
      items.push(`😊 Moral: ${consequences.morale > 0 ? '+' : ''}${consequences.morale}`);
    }
    if (consequences.prestige) {
      items.push(`⭐ Prestige: ${consequences.prestige > 0 ? '+' : ''}${consequences.prestige}`);
    }
    if (consequences.gold) {
      items.push(`💰 Gold: ${consequences.gold > 0 ? '+' : ''}${consequences.gold}`);
    }

    return `<div class="event-consequences">${items.join(' | ')}</div>`;
  }

  private addStyles(): void {
    if (document.getElementById('pow-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'pow-panel-styles';
    style.textContent = `
      .pow-panel-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-in-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .pow-panel-content {
        background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        max-width: 900px;
        max-height: 90vh;
        width: 90%;
        overflow: hidden;
        animation: slideUp 0.3s ease-in-out;
      }

      @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .pow-panel-header {
        background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      }

      .pow-panel-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }

      .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
      }

      .pow-panel-body {
        padding: 20px;
        max-height: calc(90vh - 80px);
        overflow-y: auto;
        color: #ecf0f1;
      }

      .pow-panel-body h3 {
        color: #3498db;
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 18px;
        border-bottom: 2px solid #3498db;
        padding-bottom: 8px;
      }

      .pow-panel-body h4 {
        color: #95a5a6;
        margin-top: 15px;
        margin-bottom: 10px;
        font-size: 16px;
      }

      .pow-stats-section,
      .pow-camps-section,
      .pow-events-section {
        margin-bottom: 25px;
      }

      .pow-stat-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }

      .pow-stat-card {
        background: rgba(52, 73, 94, 0.6);
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid rgba(52, 152, 219, 0.3);
        transition: all 0.3s ease;
      }

      .pow-stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
      }

      .pow-stat-label {
        color: #95a5a6;
        font-size: 12px;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .pow-stat-value {
        color: #3498db;
        font-size: 28px;
        font-weight: bold;
      }

      .pow-rank-distribution,
      .pow-costs {
        background: rgba(52, 73, 94, 0.4);
        padding: 15px;
        border-radius: 8px;
        margin-top: 15px;
      }

      .pow-rank-bar {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .pow-rank-bar:last-child {
        border-bottom: none;
      }

      .rank-label {
        color: #bdc3c7;
      }

      .rank-value {
        color: #3498db;
        font-weight: bold;
      }

      .cost-display {
        font-size: 24px;
        color: #f39c12;
        text-align: center;
        margin-top: 10px;
        font-weight: bold;
      }

      .pow-camp-card {
        background: rgba(52, 73, 94, 0.5);
        border: 1px solid rgba(52, 152, 219, 0.3);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        transition: all 0.3s ease;
      }

      .pow-camp-card:hover {
        border-color: rgba(52, 152, 219, 0.6);
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
      }

      .camp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .camp-header h4 {
        margin: 0;
        color: #ecf0f1;
        font-size: 18px;
      }

      .camp-location {
        color: #95a5a6;
        font-size: 14px;
      }

      .camp-details {
        display: grid;
        gap: 8px;
      }

      .camp-stat {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
      }

      .camp-stat .label {
        color: #95a5a6;
      }

      .camp-stat .value {
        color: #ecf0f1;
        font-weight: bold;
      }

      .progress-bar {
        height: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        overflow: hidden;
        margin: 8px 0;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
        transition: width 0.5s ease;
      }

      .pow-event-card {
        background: rgba(52, 73, 94, 0.4);
        border-left: 4px solid #3498db;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
        display: flex;
        gap: 12px;
        transition: all 0.3s ease;
      }

      .pow-event-card:hover {
        background: rgba(52, 73, 94, 0.6);
        transform: translateX(4px);
      }

      .event-icon {
        font-size: 32px;
        flex-shrink: 0;
      }

      .event-details {
        flex: 1;
      }

      .event-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .event-type {
        color: #3498db;
        font-weight: bold;
        font-size: 14px;
      }

      .event-year {
        color: #95a5a6;
        font-size: 12px;
      }

      .event-description {
        color: #ecf0f1;
        margin-bottom: 4px;
        font-size: 14px;
      }

      .event-location {
        color: #95a5a6;
        font-size: 12px;
        margin-bottom: 6px;
      }

      .event-consequences {
        color: #f39c12;
        font-size: 12px;
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .no-data {
        color: #95a5a6;
        text-align: center;
        padding: 20px;
        font-style: italic;
      }

      /* Scrollbar styling */
      .pow-panel-body::-webkit-scrollbar {
        width: 8px;
      }

      .pow-panel-body::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }

      .pow-panel-body::-webkit-scrollbar-thumb {
        background: rgba(52, 152, 219, 0.5);
        border-radius: 4px;
      }

      .pow-panel-body::-webkit-scrollbar-thumb:hover {
        background: rgba(52, 152, 219, 0.7);
      }
    `;

    document.head.appendChild(style);
  }
}
