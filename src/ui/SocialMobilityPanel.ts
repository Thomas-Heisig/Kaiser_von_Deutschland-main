// src/ui/SocialMobilityPanel.ts

import type { GameEngine } from '../core/GameEngine';
import type { MobilityStats } from '../core/SocialMobilitySystem';

// UI update and threshold constants
const MOBILITY_PANEL_CONSTANTS = {
  UPDATE_INTERVAL_MS: 2000,
  HIGH_MOBILITY_THRESHOLD: 60,
  MEDIUM_MOBILITY_THRESHOLD: 30
} as const;

/**
 * Panel to display social mobility statistics and career changes
 */
export class SocialMobilityPanel {
  private container: HTMLElement | null = null;
  private engine: GameEngine;
  private updateInterval: number | null = null;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Creates and shows the social mobility panel
   */
  public show(): void {
    // Create modal container
    this.container = document.createElement('div');
    this.container.id = 'social-mobility-panel';
    this.container.className = 'social-mobility-panel-modal';
    this.container.innerHTML = `
      <div class="social-mobility-panel-content">
        <div class="social-mobility-panel-header">
          <h2>📈 Berufswechsel & Soziale Mobilität</h2>
          <button class="close-btn" id="close-mobility-panel">✕</button>
        </div>
        <div class="social-mobility-panel-body">
          <div class="mobility-stats-section">
            <h3>Mobilitäts-Statistiken</h3>
            <div id="mobility-stats"></div>
          </div>
          <div class="mobility-trends-section">
            <h3>Mobilität nach Sozialklasse</h3>
            <div id="mobility-by-class"></div>
          </div>
          <div class="career-paths-section">
            <h3>Beliebte Karrierewechsel</h3>
            <div id="popular-career-paths"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Add styles
    this.addStyles();

    // Set up event listeners
    const closeBtn = document.getElementById('close-mobility-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Initial render
    this.render();

    // Auto-update every 2 seconds
    this.updateInterval = window.setInterval(() => this.render(), 
      MOBILITY_PANEL_CONSTANTS.UPDATE_INTERVAL_MS
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
   * Renders the social mobility data
   */
  private render(): void {
    if (!this.container) return;

    const mobilitySystem = this.engine.getSocialMobilitySystem();
    const stats = mobilitySystem.getMobilityStats();

    this.renderMobilityStats(stats);
    this.renderMobilityByClass(stats);
    this.renderPopularCareerPaths(stats);
  }

  /**
   * Renders overall mobility statistics
   */
  private renderMobilityStats(stats: MobilityStats): void {
    const statsDiv = document.getElementById('mobility-stats');
    if (!statsDiv) return;

    const totalMobility = stats.upwardMobility + stats.downwardMobility + stats.lateralMobility;
    const upwardPercent = totalMobility > 0 ? (stats.upwardMobility / totalMobility * 100).toFixed(1) : '0.0';
    const downwardPercent = totalMobility > 0 ? (stats.downwardMobility / totalMobility * 100).toFixed(1) : '0.0';
    const lateralPercent = totalMobility > 0 ? (stats.lateralMobility / totalMobility * 100).toFixed(1) : '0.0';
    const successRate = (stats.averageSuccessRate * 100).toFixed(1);

    statsDiv.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Gesamte Berufswechsel</div>
          <div class="stat-value">${stats.totalTransitions.toLocaleString()}</div>
        </div>
        <div class="stat-card upward">
          <div class="stat-label">↗️ Aufwärts-Mobilität</div>
          <div class="stat-value">${stats.upwardMobility.toLocaleString()} (${upwardPercent}%)</div>
        </div>
        <div class="stat-card downward">
          <div class="stat-label">↘️ Abwärts-Mobilität</div>
          <div class="stat-value">${stats.downwardMobility.toLocaleString()} (${downwardPercent}%)</div>
        </div>
        <div class="stat-card lateral">
          <div class="stat-label">↔️ Seitliche Mobilität</div>
          <div class="stat-value">${stats.lateralMobility.toLocaleString()} (${lateralPercent}%)</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">✓ Erfolgsrate</div>
          <div class="stat-value">${successRate}%</div>
        </div>
      </div>
    `;
  }

  /**
   * Renders mobility breakdown by social class
   */
  private renderMobilityByClass(stats: MobilityStats): void {
    const classDiv = document.getElementById('mobility-by-class');
    if (!classDiv) return;

    const classOrder = ['lower', 'working', 'middle', 'upper_middle', 'upper', 'nobility'];
    const classNames: Record<string, string> = {
      'lower': 'Unterschicht',
      'working': 'Arbeiterklasse',
      'middle': 'Mittelschicht',
      'upper_middle': 'Obere Mittelschicht',
      'upper': 'Oberschicht',
      'nobility': 'Adel'
    };

    let html = '<div class="class-mobility-grid">';
    
    for (const className of classOrder) {
      const count = stats.transitionsByClass.get(className) || 0;
      const percent = stats.totalTransitions > 0 ? (count / stats.totalTransitions * 100).toFixed(1) : '0.0';
      
      html += `
        <div class="class-mobility-item">
          <div class="class-name">${classNames[className]}</div>
          <div class="class-bar-container">
            <div class="class-bar" style="width: ${percent}%"></div>
          </div>
          <div class="class-count">${count} (${percent}%)</div>
        </div>
      `;
    }
    
    html += '</div>';
    classDiv.innerHTML = html;
  }

  /**
   * Renders popular career paths
   */
  private renderPopularCareerPaths(stats: MobilityStats): void {
    const pathsDiv = document.getElementById('popular-career-paths');
    if (!pathsDiv) return;

    // Sort professions by transition count
    const sortedProfessions = Array.from(stats.transitionsByProfession.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (sortedProfessions.length === 0) {
      pathsDiv.innerHTML = '<p class="no-data">Noch keine Berufswechsel erfasst.</p>';
      return;
    }

    let html = '<div class="career-paths-grid">';
    
    for (const [profession, count] of sortedProfessions) {
      const percent = stats.totalTransitions > 0 ? (count / stats.totalTransitions * 100).toFixed(1) : '0.0';
      
      html += `
        <div class="career-path-item">
          <div class="profession-name">${profession}</div>
          <div class="profession-bar-container">
            <div class="profession-bar" style="width: ${percent}%"></div>
          </div>
          <div class="profession-count">${count} (${percent}%)</div>
        </div>
      `;
    }
    
    html += '</div>';
    pathsDiv.innerHTML = html;
  }

  /**
   * Adds CSS styles for the panel
   */
  private addStyles(): void {
    if (document.getElementById('social-mobility-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'social-mobility-panel-styles';
    style.textContent = `
      .social-mobility-panel-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .social-mobility-panel-content {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #4a5568;
        border-radius: 12px;
        width: 90%;
        max-width: 900px;
        max-height: 85vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .social-mobility-panel-header {
        background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        padding: 20px 24px;
        border-bottom: 2px solid #4a5568;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .social-mobility-panel-header h2 {
        margin: 0;
        color: #fbbf24;
        font-size: 24px;
        font-weight: 600;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .social-mobility-panel-body {
        padding: 24px;
        overflow-y: auto;
        max-height: calc(85vh - 80px);
        color: #e2e8f0;
      }

      .social-mobility-panel-body h3 {
        color: #fbbf24;
        margin-top: 0;
        margin-bottom: 16px;
        font-size: 18px;
        border-bottom: 1px solid #4a5568;
        padding-bottom: 8px;
      }

      .mobility-stats-section,
      .mobility-trends-section,
      .career-paths-section {
        margin-bottom: 24px;
        background: rgba(26, 32, 44, 0.5);
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #2d3748;
      }

      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }

      .stat-card {
        background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #4a5568;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
      }

      .stat-card.upward {
        border-color: #10b981;
      }

      .stat-card.downward {
        border-color: #ef4444;
      }

      .stat-card.lateral {
        border-color: #3b82f6;
      }

      .stat-card.success {
        border-color: #fbbf24;
      }

      .stat-label {
        color: #a0aec0;
        font-size: 12px;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-value {
        color: #fbbf24;
        font-size: 24px;
        font-weight: 700;
      }

      .class-mobility-grid,
      .career-paths-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .class-mobility-item,
      .career-path-item {
        display: grid;
        grid-template-columns: 150px 1fr 120px;
        gap: 12px;
        align-items: center;
        padding: 12px;
        background: rgba(45, 55, 72, 0.5);
        border-radius: 6px;
        border: 1px solid #2d3748;
        transition: background 0.2s ease;
      }

      .class-mobility-item:hover,
      .career-path-item:hover {
        background: rgba(45, 55, 72, 0.8);
      }

      .class-name,
      .profession-name {
        color: #e2e8f0;
        font-weight: 500;
      }

      .class-bar-container,
      .profession-bar-container {
        background: rgba(26, 32, 44, 0.8);
        height: 20px;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #4a5568;
      }

      .class-bar,
      .profession-bar {
        height: 100%;
        background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
        border-radius: 10px;
        transition: width 0.3s ease;
      }

      .class-count,
      .profession-count {
        color: #a0aec0;
        font-size: 14px;
        text-align: right;
      }

      .no-data {
        color: #a0aec0;
        text-align: center;
        padding: 20px;
        font-style: italic;
      }

      .close-btn {
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        width: 36px;
        height: 36px;
        font-size: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .close-btn:hover {
        background: #dc2626;
        transform: scale(1.1);
      }

      @media (max-width: 768px) {
        .social-mobility-panel-content {
          width: 95%;
          max-width: none;
        }

        .stat-grid {
          grid-template-columns: 1fr;
        }

        .class-mobility-item,
        .career-path-item {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .class-count,
        .profession-count {
          text-align: left;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
