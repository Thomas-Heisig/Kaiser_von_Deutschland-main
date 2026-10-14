// src/ui/MigrationPanel.ts

import type { GameEngine } from '../core/GameEngine';
import type { MigrationStats } from '../core/MigrationSystem';

// UI update and threshold constants
const MIGRATION_PANEL_CONSTANTS = {
  UPDATE_INTERVAL_MS: 2000,
  HIGH_THRESHOLD: 70,
  MEDIUM_THRESHOLD: 40
} as const;

/**
 * Panel to display migration statistics and flows between regions
 */
export class MigrationPanel {
  private container: HTMLElement | null = null;
  private engine: GameEngine;
  private updateInterval: number | null = null;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Creates and shows the migration panel
   */
  public show(): void {
    // Create modal container
    this.container = document.createElement('div');
    this.container.id = 'migration-panel';
    this.container.className = 'migration-panel-modal';
    this.container.innerHTML = `
      <div class="migration-panel-content">
        <div class="migration-panel-header">
          <h2>🚶 Migration zwischen Regionen</h2>
          <button class="close-btn" id="close-migration-panel">✕</button>
        </div>
        <div class="migration-panel-body">
          <div class="migration-stats-section">
            <h3>Migrations-Statistiken</h3>
            <div id="migration-stats"></div>
          </div>
          <div class="migration-flows-section">
            <h3>Aktuelle Migrations-Ströme</h3>
            <div id="migration-flows"></div>
          </div>
          <div class="region-details-section">
            <h3>Regionen-Details</h3>
            <div id="region-details"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Add styles
    this.addStyles();

    // Set up event listeners
    const closeBtn = document.getElementById('close-migration-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Initial render
    this.render();

    // Auto-update every 2 seconds
    this.updateInterval = window.setInterval(() => this.render(), 
      MIGRATION_PANEL_CONSTANTS.UPDATE_INTERVAL_MS
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
   * Renders the migration data
   */
  private render(): void {
    if (!this.container) return;

    const migrationSystem = this.engine.getMigrationSystem();
    
    const stats = migrationSystem.getMigrationStats();
    
    // Render statistics
    this.renderStats(stats);
    
    // Render current flows
    this.renderFlows();
    
    // Render region details
    this.renderRegionDetails();
  }

  /**
   * Renders migration statistics
   */
  private renderStats(stats: MigrationStats): void {
    const statsContainer = document.getElementById('migration-stats');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Gesamt-Migrationen</div>
        <div class="stat-value">${stats.totalMigrations.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Beliebte Ziele</div>
        <div class="stat-value">${stats.topDestinations.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Emigrations-Quellen</div>
        <div class="stat-value">${stats.topOrigins.length}</div>
      </div>
    `;

    // Top destinations
    if (stats.topDestinations.length > 0) {
      const topDestHTML = stats.topDestinations.slice(0, 5).map(dest => `
        <div class="region-stat">
          <span class="region-name">${dest.regionId}</span>
          <span class="region-count">+${dest.count.toLocaleString()}</span>
        </div>
      `).join('');

      statsContainer.innerHTML += `
        <div class="top-regions">
          <h4>Top Einwanderungs-Ziele</h4>
          ${topDestHTML}
        </div>
      `;
    }

    // Top origins
    if (stats.topOrigins.length > 0) {
      const topOriginsHTML = stats.topOrigins.slice(0, 5).map(origin => `
        <div class="region-stat">
          <span class="region-name">${origin.regionId}</span>
          <span class="region-count emigration">-${origin.count.toLocaleString()}</span>
        </div>
      `).join('');

      statsContainer.innerHTML += `
        <div class="top-regions">
          <h4>Top Auswanderungs-Quellen</h4>
          ${topOriginsHTML}
        </div>
      `;
    }
  }

  /**
   * Renders current migration flows
   */
  private renderFlows(): void {
    const flowsContainer = document.getElementById('migration-flows');
    if (!flowsContainer) return;

    const migrationSystem = this.engine.getMigrationSystem();
    const allRegions = this.getActiveRegions();
    
    let flowsHTML = '';
    
    for (const region of allRegions) {
      const flows = migrationSystem.getActiveMigrationsForRegion(region);
      
      if (flows.length > 0) {
        const outflows = flows.filter(f => f.fromRegion === region);
        const inflows = flows.filter(f => f.toRegion === region);
        
        if (outflows.length > 0 || inflows.length > 0) {
          flowsHTML += `
            <div class="region-flows">
              <h4>${region}</h4>
              ${outflows.length > 0 ? `
                <div class="outflows">
                  <strong>Auswanderung:</strong>
                  ${outflows.map(f => `
                    <div class="flow-item">
                      → ${f.toRegion}: ${f.count} (${this.getReasonText(f.reason.type)})
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${inflows.length > 0 ? `
                <div class="inflows">
                  <strong>Einwanderung:</strong>
                  ${inflows.map(f => `
                    <div class="flow-item">
                      ← ${f.fromRegion}: ${f.count} (${this.getReasonText(f.reason.type)})
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }
      }
    }
    
    if (flowsHTML === '') {
      flowsHTML = '<p class="no-data">Aktuell keine aktiven Migrations-Ströme</p>';
    }
    
    flowsContainer.innerHTML = flowsHTML;
  }

  /**
   * Renders region details
   */
  private renderRegionDetails(): void {
    const detailsContainer = document.getElementById('region-details');
    if (!detailsContainer) return;

    const citizenSystem = this.engine.getCitizenSystem();
    const allRegions = this.getActiveRegions();
    
    let detailsHTML = '<div class="regions-grid">';
    
    for (const regionId of allRegions) {
      const population = citizenSystem.getRegionalPopulation(regionId);
      const citizens = citizenSystem.getCitizensByRegion(regionId);
      
      // Calculate average migration desire
      const avgMigrationDesire = citizens.length > 0
        ? citizens.reduce((sum, c) => sum + c.migrationDesire, 0) / citizens.length
        : 0;
      
      // Calculate average happiness
      const avgHappiness = citizens.length > 0
        ? citizens.reduce((sum, c) => sum + c.happiness, 0) / citizens.length
        : 0;
      
      detailsHTML += `
        <div class="region-card">
          <h4>${regionId}</h4>
          <div class="region-info">
            <div class="info-row">
              <span>Bevölkerung:</span>
              <strong>${population.toLocaleString()}</strong>
            </div>
            <div class="info-row">
              <span>Migrations-Wunsch:</span>
              <strong class="${this.getMigrationDesireClass(avgMigrationDesire)}">
                ${avgMigrationDesire.toFixed(1)}%
              </strong>
            </div>
            <div class="info-row">
              <span>Zufriedenheit:</span>
              <strong class="${this.getHappinessClass(avgHappiness)}">
                ${avgHappiness.toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>
      `;
    }
    
    detailsHTML += '</div>';
    
    if (allRegions.length === 0) {
      detailsHTML = '<p class="no-data">Keine Regionen mit Bevölkerung</p>';
    }
    
    detailsContainer.innerHTML = detailsHTML;
  }

  /**
   * Gets active regions from citizen system
   */
  private getActiveRegions(): string[] {
    const citizenSystem = this.engine.getCitizenSystem();
    const citizens = citizenSystem.getAllCitizens();
    const regions = new Set<string>();
    
    for (const citizen of citizens) {
      if (citizen.isAlive) {
        regions.add(citizen.regionId);
      }
    }
    
    return Array.from(regions);
  }

  /**
   * Gets human-readable reason text
   */
  private getReasonText(reason: string): string {
    const reasons: Record<string, string> = {
      'economic': 'Wirtschaft',
      'war': 'Krieg',
      'famine': 'Hungersnot',
      'disease': 'Krankheit',
      'opportunity': 'Chancen',
      'persecution': 'Verfolgung',
      'family': 'Familie'
    };
    return reasons[reason] || reason;
  }

  /**
   * Gets CSS class for migration desire
   */
  private getMigrationDesireClass(desire: number): string {
    if (desire > MIGRATION_PANEL_CONSTANTS.HIGH_THRESHOLD) return 'high-desire';
    if (desire > MIGRATION_PANEL_CONSTANTS.MEDIUM_THRESHOLD) return 'medium-desire';
    return 'low-desire';
  }

  /**
   * Gets CSS class for happiness
   */
  private getHappinessClass(happiness: number): string {
    if (happiness > MIGRATION_PANEL_CONSTANTS.HIGH_THRESHOLD) return 'high-happiness';
    if (happiness > MIGRATION_PANEL_CONSTANTS.MEDIUM_THRESHOLD) return 'medium-happiness';
    return 'low-happiness';
  }

  /**
   * Adds CSS styles for the panel
   */
  private addStyles(): void {
    if (document.getElementById('migration-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'migration-panel-styles';
    style.textContent = `
      .migration-panel-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .migration-panel-content {
        background: #1a1a2e;
        border-radius: 12px;
        width: 90%;
        max-width: 1200px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      }

      .migration-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-bottom: 2px solid #4a5568;
      }

      .migration-panel-header h2 {
        margin: 0;
        color: white;
        font-size: 24px;
      }

      .migration-panel-header .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s;
      }

      .migration-panel-header .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .migration-panel-body {
        padding: 30px;
        overflow-y: auto;
        flex: 1;
      }

      .migration-stats-section,
      .migration-flows-section,
      .region-details-section {
        margin-bottom: 30px;
      }

      .migration-stats-section h3,
      .migration-flows-section h3,
      .region-details-section h3 {
        color: #667eea;
        margin-bottom: 15px;
        font-size: 20px;
      }

      #migration-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }

      .stat-card {
        background: #2d3748;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #667eea;
      }

      .stat-label {
        color: #a0aec0;
        font-size: 14px;
        margin-bottom: 8px;
      }

      .stat-value {
        color: white;
        font-size: 28px;
        font-weight: bold;
      }

      .top-regions {
        background: #2d3748;
        padding: 15px;
        border-radius: 8px;
        margin-top: 15px;
      }

      .top-regions h4 {
        color: #cbd5e0;
        margin: 0 0 10px 0;
        font-size: 16px;
      }

      .region-stat {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #4a5568;
      }

      .region-stat:last-child {
        border-bottom: none;
      }

      .region-name {
        color: #e2e8f0;
      }

      .region-count {
        color: #48bb78;
        font-weight: bold;
      }

      .region-count.emigration {
        color: #f56565;
      }

      .region-flows {
        background: #2d3748;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 15px;
      }

      .region-flows h4 {
        color: #cbd5e0;
        margin: 0 0 10px 0;
      }

      .outflows,
      .inflows {
        margin-top: 10px;
      }

      .outflows strong {
        color: #f56565;
      }

      .inflows strong {
        color: #48bb78;
      }

      .flow-item {
        padding: 5px 0;
        color: #e2e8f0;
        font-size: 14px;
      }

      .regions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 15px;
      }

      .region-card {
        background: #2d3748;
        padding: 15px;
        border-radius: 8px;
        border-top: 3px solid #667eea;
      }

      .region-card h4 {
        color: #cbd5e0;
        margin: 0 0 10px 0;
      }

      .region-info {
        font-size: 14px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        color: #a0aec0;
      }

      .info-row strong {
        color: #e2e8f0;
      }

      .high-desire {
        color: #f56565 !important;
      }

      .medium-desire {
        color: #ed8936 !important;
      }

      .low-desire {
        color: #48bb78 !important;
      }

      .high-happiness {
        color: #48bb78 !important;
      }

      .medium-happiness {
        color: #ed8936 !important;
      }

      .low-happiness {
        color: #f56565 !important;
      }

      .no-data {
        color: #a0aec0;
        text-align: center;
        padding: 20px;
        font-style: italic;
      }
    `;

    document.head.appendChild(style);
  }
}
