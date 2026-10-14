/**
 * War Financing Panel - UI for Kriegsfinanzierung und Kriegsanleihen
 * Provides interface for managing war financing methods and debt
 * 
 * @version 2.3.6
 */

import { WarFinancingSystem, WarFinancingMethod, ActiveWarLoan, DebtRepaymentStrategy } from '../core/WarFinancingSystem';
import { Kingdom } from '../core/Kingdom';

export class WarFinancingPanel {
  private panel: HTMLElement | null = null;
  private warFinancingSystem: WarFinancingSystem;
  private kingdom: Kingdom | null = null;
  private currentYear: number = 1;
  private currentMonth: number = 1;
  private victories: number = 0;

  constructor(warFinancingSystem: WarFinancingSystem) {
    this.warFinancingSystem = warFinancingSystem;
  }

  /**
   * Set current game state
   */
  public setState(kingdom: Kingdom, year: number, month: number = 1, victories: number = 0): void {
    this.kingdom = kingdom;
    this.currentYear = year;
    this.currentMonth = month;
    this.victories = victories;
  }

  /**
   * Create and show the war financing panel
   */
  public show(): void {
    if (!this.kingdom) {
      console.error('Kingdom not set - call setState() first');
      return;
    }

    // Remove existing panel if any
    this.hide();

    // Create panel
    this.panel = document.createElement('div');
    this.panel.id = 'war-financing-panel';
    this.panel.className = 'war-financing-panel';
    this.panel.innerHTML = this.renderPanel();

    // Add to document
    document.body.appendChild(this.panel);

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Hide and remove the panel
   */
  public hide(): void {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }

  /**
   * Render the panel HTML
   */
  private renderPanel(): string {
    if (!this.kingdom) return '';

    const stats = this.warFinancingSystem.getStats();
    const availableMethods = this.warFinancingSystem.getAvailableMethods(
      this.kingdom,
      this.currentYear,
      this.victories
    );
    const activeLoans = this.warFinancingSystem.getActiveLoans();
    const repaymentStrategies = this.warFinancingSystem.getRepaymentStrategies(this.kingdom);

    return `
      <div class="war-financing-container">
        <div class="war-financing-header">
          <h2>⚔️ Kriegsfinanzierung & Kriegsanleihen</h2>
          <button class="close-btn" data-action="close">✕</button>
        </div>

        <div class="war-financing-tabs">
          <button class="tab-btn active" data-tab="overview">Übersicht</button>
          <button class="tab-btn" data-tab="methods">Finanzierungsmethoden</button>
          <button class="tab-btn" data-tab="loans">Aktive Kredite</button>
          <button class="tab-btn" data-tab="repayment">Rückzahlung</button>
          <button class="tab-btn" data-tab="history">Geschichte</button>
        </div>

        <div class="war-financing-content">
          <!-- Overview Tab -->
          <div class="tab-content active" data-tab-content="overview">
            ${this.renderOverviewTab(stats)}
          </div>

          <!-- Methods Tab -->
          <div class="tab-content" data-tab-content="methods">
            ${this.renderMethodsTab(availableMethods)}
          </div>

          <!-- Loans Tab -->
          <div class="tab-content" data-tab-content="loans">
            ${this.renderLoansTab(activeLoans)}
          </div>

          <!-- Repayment Tab -->
          <div class="tab-content" data-tab-content="repayment">
            ${this.renderRepaymentTab(repaymentStrategies, stats)}
          </div>

          <!-- History Tab -->
          <div class="tab-content" data-tab-content="history">
            ${this.renderHistoryTab()}
          </div>
        </div>
      </div>

      <style>
        .war-financing-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 1000px;
          max-height: 85vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 2px solid #ffd700;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          z-index: 10000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .war-financing-header {
          background: linear-gradient(90deg, #8b0000 0%, #b22222 100%);
          color: #ffd700;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #ffd700;
        }

        .war-financing-header h2 {
          margin: 0;
          font-size: 24px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #ffd700;
          color: #ffd700;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.3s;
        }

        .close-btn:hover {
          background: rgba(255, 215, 0, 0.2);
          transform: scale(1.1);
        }

        .war-financing-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid #ffd700;
          overflow-x: auto;
        }

        .tab-btn {
          flex: 1;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: #ccc;
          cursor: pointer;
          transition: all 0.3s;
          border-bottom: 3px solid transparent;
          font-size: 14px;
          white-space: nowrap;
        }

        .tab-btn:hover {
          background: rgba(255, 215, 0, 0.1);
          color: #ffd700;
        }

        .tab-btn.active {
          color: #ffd700;
          border-bottom-color: #ffd700;
          background: rgba(255, 215, 0, 0.05);
        }

        .war-financing-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: rgba(255, 215, 0, 0.05);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }

        .stat-label {
          color: #aaa;
          font-size: 12px;
          margin-bottom: 5px;
          text-transform: uppercase;
        }

        .stat-value {
          color: #ffd700;
          font-size: 24px;
          font-weight: bold;
        }

        .stat-value.negative {
          color: #ff4444;
        }

        .stat-value.positive {
          color: #44ff44;
        }

        .method-card, .loan-card, .strategy-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          transition: all 0.3s;
        }

        .method-card:hover, .loan-card:hover, .strategy-card:hover {
          background: rgba(255, 215, 0, 0.05);
          border-color: rgba(255, 215, 0, 0.4);
          transform: translateY(-2px);
        }

        .method-header, .loan-header, .strategy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .method-title, .loan-title, .strategy-title {
          color: #ffd700;
          font-size: 18px;
          font-weight: bold;
        }

        .method-era, .loan-period {
          color: #aaa;
          font-size: 12px;
          font-style: italic;
        }

        .method-description, .strategy-description {
          color: #ccc;
          margin-bottom: 10px;
          line-height: 1.5;
        }

        .method-details, .loan-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          color: #aaa;
          font-size: 13px;
        }

        .detail-value {
          color: #ffd700;
          font-weight: bold;
        }

        .activate-btn, .apply-btn {
          background: linear-gradient(135deg, #8b0000 0%, #b22222 100%);
          border: 1px solid #ffd700;
          color: #ffd700;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s;
          margin-top: 10px;
        }

        .activate-btn:hover, .apply-btn:hover {
          background: linear-gradient(135deg, #b22222 0%, #dc143c 100%);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
          transform: scale(1.05);
        }

        .activate-btn:disabled, .apply-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .warning-box {
          background: rgba(255, 68, 68, 0.1);
          border: 1px solid #ff4444;
          border-radius: 6px;
          padding: 12px;
          color: #ff8888;
          margin: 10px 0;
        }

        .info-box {
          background: rgba(68, 136, 255, 0.1);
          border: 1px solid #4488ff;
          border-radius: 6px;
          padding: 12px;
          color: #88aaff;
          margin: 10px 0;
        }

        .success-box {
          background: rgba(68, 255, 68, 0.1);
          border: 1px solid #44ff44;
          border-radius: 6px;
          padding: 12px;
          color: #88ff88;
          margin: 10px 0;
        }

        .historical-event {
          background: rgba(139, 69, 19, 0.2);
          border-left: 4px solid #ffd700;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 4px;
        }

        .event-year {
          color: #ffd700;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .event-name {
          color: #fff;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .event-description {
          color: #ccc;
          line-height: 1.5;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd700 0%, #ffed4e 100%);
          transition: width 0.3s;
        }

        @media (max-width: 768px) {
          .war-financing-panel {
            width: 95%;
            max-height: 90vh;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .method-details, .loan-details {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;
  }

  private renderOverviewTab(stats: any): string {
    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Kriegsschulden</div>
          <div class="stat-value negative">${stats.totalWarDebt.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Monatliche Zahlung</div>
          <div class="stat-value">${stats.monthlyDebtPayment.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Aktive Kredite</div>
          <div class="stat-value">${stats.activeLoans}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Gesamt Beschafft</div>
          <div class="stat-value positive">${stats.totalGoldRaisedFromWar.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Popularität</div>
          <div class="stat-value ${stats.popularityFromWarFinancing >= 0 ? 'positive' : 'negative'}">
            ${stats.popularityFromWarFinancing > 0 ? '+' : ''}${stats.popularityFromWarFinancing}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Inflation</div>
          <div class="stat-value ${stats.inflationFromWarFinancing >= 0 ? 'negative' : 'positive'}">
            ${(stats.inflationFromWarFinancing * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      ${!this.kingdom?.isAtWar ? `
        <div class="info-box">
          ℹ️ Viele Kriegsfinanzierungsmethoden sind nur im Kriegszustand verfügbar.
        </div>
      ` : ''}

      ${stats.totalWarDebt > 0 ? `
        <div class="warning-box">
          ⚠️ Hohe Kriegsschulden können langfristige wirtschaftliche Probleme verursachen!
        </div>
      ` : ''}
    `;
  }

  private renderMethodsTab(methods: WarFinancingMethod[]): string {
    if (methods.length === 0) {
      return `
        <div class="info-box">
          Keine Finanzierungsmethoden verfügbar für Jahr ${this.currentYear}.
          ${!this.kingdom?.isAtWar ? 'Befinden Sie sich im Krieg?' : ''}
        </div>
      `;
    }

    return methods.map(method => `
      <div class="method-card">
        <div class="method-header">
          <div>
            <div class="method-title">${method.name}</div>
            <div class="method-era">${method.era} (${method.yearStart}-${method.yearEnd})</div>
          </div>
        </div>
        <div class="method-description">${method.description}</div>
        
        <div class="method-details">
          ${method.goldAmount ? `
            <div class="detail-item">
              <span>Betrag:</span>
              <span class="detail-value">${method.goldAmount.toLocaleString()} Gold</span>
            </div>
          ` : ''}
          ${method.goldGainMin && method.goldGainMax ? `
            <div class="detail-item">
              <span>Betrag:</span>
              <span class="detail-value">${method.goldGainMin.toLocaleString()}-${method.goldGainMax.toLocaleString()} Gold</span>
            </div>
          ` : ''}
          ${method.interestRate ? `
            <div class="detail-item">
              <span>Zinssatz:</span>
              <span class="detail-value">${(method.interestRate * 100).toFixed(1)}%</span>
            </div>
          ` : ''}
          ${method.repaymentPeriod ? `
            <div class="detail-item">
              <span>Laufzeit:</span>
              <span class="detail-value">${method.repaymentPeriod} Monate</span>
            </div>
          ` : ''}
          <div class="detail-item">
            <span>Popularität:</span>
            <span class="detail-value ${method.popularityEffect >= 0 ? 'positive' : 'negative'}">
              ${method.popularityEffect > 0 ? '+' : ''}${method.popularityEffect}
            </span>
          </div>
          ${method.civilUnrest ? `
            <div class="detail-item">
              <span>Unruhen:</span>
              <span class="detail-value negative">+${(method.civilUnrest * 100).toFixed(0)}%</span>
            </div>
          ` : ''}
        </div>

        ${method.warCrimes ? `
          <div class="warning-box">
            ⚠️ Kriegsverbrechen! Schwere diplomatische Konsequenzen.
          </div>
        ` : ''}

        <button class="activate-btn" data-method-id="${method.id}">
          Aktivieren
        </button>
      </div>
    `).join('');
  }

  private renderLoansTab(loans: ActiveWarLoan[]): string {
    if (loans.length === 0) {
      return `
        <div class="success-box">
          ✓ Keine aktiven Kriegskredite. Ihre Finanzen sind schuldenfrei!
        </div>
      `;
    }

    return loans.map(loan => {
      const progress = ((loan.totalOwed - (loan.monthlyPayment * loan.monthsRemaining)) / loan.totalOwed) * 100;
      const yearsRemaining = Math.floor(loan.monthsRemaining / 12);
      const monthsRemaining = loan.monthsRemaining % 12;

      return `
        <div class="loan-card">
          <div class="loan-header">
            <div class="loan-title">Kredit #${loan.methodId}</div>
            <div class="loan-period">Seit ${loan.startYear}</div>
          </div>
          
          <div class="loan-details">
            <div class="detail-item">
              <span>Ursprünglicher Betrag:</span>
              <span class="detail-value">${loan.principalAmount.toLocaleString()} Gold</span>
            </div>
            <div class="detail-item">
              <span>Noch zu zahlen:</span>
              <span class="detail-value negative">${Math.floor(loan.totalOwed).toLocaleString()} Gold</span>
            </div>
            <div class="detail-item">
              <span>Monatliche Rate:</span>
              <span class="detail-value">${Math.floor(loan.monthlyPayment).toLocaleString()} Gold</span>
            </div>
            <div class="detail-item">
              <span>Zinssatz:</span>
              <span class="detail-value">${(loan.interestRate * 100).toFixed(2)}%</span>
            </div>
            <div class="detail-item">
              <span>Verbleibende Zeit:</span>
              <span class="detail-value">
                ${yearsRemaining > 0 ? `${yearsRemaining}J ` : ''}${monthsRemaining}M
              </span>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  private renderRepaymentTab(strategies: DebtRepaymentStrategy[], stats: any): string {
    if (stats.totalWarDebt === 0) {
      return `
        <div class="success-box">
          ✓ Keine Schulden - keine Rückzahlungsstrategien erforderlich.
        </div>
      `;
    }

    return `
      <div class="info-box">
        Wählen Sie eine Strategie zur Verwaltung Ihrer Kriegsschulden.
        Aktuelle Schulden: ${stats.totalWarDebt.toLocaleString()} Gold
      </div>

      ${strategies.map(strategy => `
        <div class="strategy-card">
          <div class="strategy-header">
            <div class="strategy-title">${strategy.name}</div>
          </div>
          <div class="strategy-description">${strategy.description}</div>
          
          <div class="method-details">
            ${strategy.popularityEffect ? `
              <div class="detail-item">
                <span>Popularität:</span>
                <span class="detail-value ${strategy.popularityEffect >= 0 ? 'positive' : 'negative'}">
                  ${strategy.popularityEffect > 0 ? '+' : ''}${strategy.popularityEffect}
                </span>
              </div>
            ` : ''}
            ${strategy.diplomaticEffect ? `
              <div class="detail-item">
                <span>Diplomatische Beziehungen:</span>
                <span class="detail-value ${strategy.diplomaticEffect >= 0 ? 'positive' : 'negative'}">
                  ${strategy.diplomaticEffect > 0 ? '+' : ''}${strategy.diplomaticEffect}
                </span>
              </div>
            ` : ''}
            ${strategy.repaymentSpeedMultiplier ? `
              <div class="detail-item">
                <span>Rückzahlungsgeschwindigkeit:</span>
                <span class="detail-value">${strategy.repaymentSpeedMultiplier}x</span>
              </div>
            ` : ''}
            ${strategy.interestReduction ? `
              <div class="detail-item">
                <span>Zinsreduktion:</span>
                <span class="detail-value positive">-${(strategy.interestReduction * 100).toFixed(0)}%</span>
              </div>
            ` : ''}
          </div>

          ${strategy.requiresDiplomacy && this.kingdom && 
            this.kingdom.stats.diplomaticRelations < strategy.requiresDiplomacy ? `
            <div class="warning-box">
              ⚠️ Benötigt diplomatische Beziehungen von ${strategy.requiresDiplomacy}
              (Aktuell: ${this.kingdom.stats.diplomaticRelations})
            </div>
          ` : ''}

          <button class="apply-btn" data-strategy-id="${strategy.id}"
            ${strategy.requiresDiplomacy && this.kingdom && 
              this.kingdom.stats.diplomaticRelations < strategy.requiresDiplomacy ? 'disabled' : ''}>
            Anwenden
          </button>
        </div>
      `).join('')}
    `;
  }

  private renderHistoryTab(): string {
    const historicalBonds = this.warFinancingSystem.getHistoricalWarBonds();
    const historicalEvents = this.warFinancingSystem.getHistoricalEvents();

    return `
      <h3 style="color: #ffd700; margin-top: 0;">Historische Kriegsanleihen</h3>
      ${historicalBonds.map(bond => `
        <div class="historical-event">
          <div class="event-year">${bond.year}</div>
          <div class="event-name">${bond.name} (${bond.country})</div>
          <div class="event-description">
            ${bond.description}<br><br>
            <strong>Gesamt beschafft:</strong> ${bond.totalRaised.toLocaleString()} (historisch)<br>
            <strong>Auswirkung:</strong> ${bond.historicalImpact}
          </div>
        </div>
      `).join('')}

      <h3 style="color: #ffd700; margin-top: 30px;">Historische Ereignisse</h3>
      ${historicalEvents.map(event => `
        <div class="historical-event">
          <div class="event-year">${event.year}</div>
          <div class="event-name">${event.name}</div>
          <div class="event-description">
            ${event.description}<br><br>
            <strong>Ursache:</strong> ${event.cause}
          </div>
        </div>
      `).join('')}
    `;
  }

  /**
   * Attach event listeners to panel elements
   */
  private attachEventListeners(): void {
    if (!this.panel) return;

    // Close button
    const closeBtn = this.panel.querySelector('[data-action="close"]');
    closeBtn?.addEventListener('click', () => this.hide());

    // Tab buttons
    const tabBtns = this.panel.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.getAttribute('data-tab');
        if (tabName) this.switchTab(tabName);
      });
    });

    // Activate method buttons
    const activateBtns = this.panel.querySelectorAll('[data-method-id]');
    activateBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const methodId = target.getAttribute('data-method-id');
        if (methodId && this.kingdom) {
          this.activateMethod(methodId);
        }
      });
    });

    // Apply strategy buttons
    const applyBtns = this.panel.querySelectorAll('[data-strategy-id]');
    applyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const strategyId = target.getAttribute('data-strategy-id');
        if (strategyId && this.kingdom) {
          this.applyStrategy(strategyId);
        }
      });
    });
  }

  /**
   * Switch to a different tab
   */
  private switchTab(tabName: string): void {
    if (!this.panel) return;

    // Update tab buttons
    this.panel.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab content
    this.panel.querySelectorAll('.tab-content').forEach(content => {
      if (content.getAttribute('data-tab-content') === tabName) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  /**
   * Activate a financing method
   */
  private activateMethod(methodId: string): void {
    if (!this.kingdom) return;

    const result = this.warFinancingSystem.activateFinancingMethod(
      this.kingdom,
      methodId,
      this.currentYear,
      this.currentMonth
    );

    if (result.success) {
      alert(`✓ ${result.message}\n\nEffekte:\n${this.formatEffects(result.effects)}`);
      this.show(); // Refresh panel
    } else {
      alert(`✗ ${result.message}`);
    }
  }

  /**
   * Apply a repayment strategy
   */
  private applyStrategy(strategyId: string): void {
    if (!this.kingdom) return;

    const result = this.warFinancingSystem.applyRepaymentStrategy(
      this.kingdom,
      strategyId
    );

    if (result.success) {
      alert(`✓ ${result.message}\n\nEffekte:\n${this.formatEffects(result.effects)}`);
      this.show(); // Refresh panel
    } else {
      alert(`✗ ${result.message}`);
    }
  }

  /**
   * Format effects for display
   */
  private formatEffects(effects: any): string {
    const lines: string[] = [];

    if (effects.popularity) {
      lines.push(`Popularität: ${effects.popularity > 0 ? '+' : ''}${effects.popularity}`);
    }
    if (effects.civilUnrest) {
      lines.push(`Unruhen: +${(effects.civilUnrest * 100).toFixed(0)}%`);
    }
    if (effects.inflation) {
      lines.push(`Inflation: +${(effects.inflation * 100).toFixed(1)}%`);
    }
    if (effects.resources) {
      for (const [key, value] of Object.entries(effects.resources)) {
        lines.push(`${key}: +${value}`);
      }
    }
    if (effects.diplomatic) {
      lines.push(`Diplomatische Beziehungen: ${effects.diplomatic > 0 ? '+' : ''}${effects.diplomatic}`);
    }

    return lines.join('\n') || 'Keine direkten Effekte';
  }
}
