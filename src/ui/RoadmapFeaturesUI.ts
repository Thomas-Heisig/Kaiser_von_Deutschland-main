// src/ui/RoadmapFeaturesUI.ts
import { GameEngine } from '../core/GameEngine';
import { Player } from '../core/Player';
import { NotificationSystem } from './NotificationSystem';

/**
 * UI Panel for Roadmap Features (v2.5.0)
 * Provides interface for 20 new features:
 * - Universities & Education
 * - Libraries & Knowledge
 * - Espionage & Intelligence
 * - Colonies & Trade
 * - Waterways & Canals
 * - Fortifications & Military
 */
export class RoadmapFeaturesUI {
  private container: HTMLElement;
  private game: GameEngine;
  private currentPlayer?: Player;
  // TODO: Will be used for notifications in future feature interactions
  // @ts-expect-error - Unused until feature interaction handlers are implemented
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
    container.className = 'roadmap-features-panel';
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
        <button class="tab-btn active" data-tab="universities">🎓 Universitäten</button>
        <button class="tab-btn" data-tab="libraries">📚 Bibliotheken</button>
        <button class="tab-btn" data-tab="espionage">🕵️ Spionage</button>
        <button class="tab-btn" data-tab="colonies">🌍 Kolonien</button>
        <button class="tab-btn" data-tab="waterways">🚢 Wasserstraßen</button>
        <button class="tab-btn" data-tab="fortifications">🏰 Befestigungen</button>
      </div>
      
      <div class="tab-content active" id="universities-tab">
        ${this.renderUniversitiesTab()}
      </div>
      
      <div class="tab-content" id="libraries-tab">
        ${this.renderLibrariesTab()}
      </div>
      
      <div class="tab-content" id="espionage-tab">
        ${this.renderEspionageTab()}
      </div>
      
      <div class="tab-content" id="colonies-tab">
        ${this.renderColoniesTab()}
      </div>
      
      <div class="tab-content" id="waterways-tab">
        ${this.renderWaterwaysTab()}
      </div>
      
      <div class="tab-content" id="fortifications-tab">
        ${this.renderFortificationsTab()}
      </div>
    `;

    this.setupEventListeners();
  }

  private renderUniversitiesTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const roadmapManager = this.game.getRoadmapFeaturesManager();
    const summary = roadmapManager.getFeaturesSummary();
    const currentYear = this.game.getCurrentYear();

    return `
      <div class="universities-panel">
        <h3>🎓 Universitäten & Bildung</h3>
        
        <div class="stats-overview">
          <div class="stat-card">
            <span class="stat-label">Universitäten</span>
            <span class="stat-value">${summary.education.universities}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Forschungsbonus</span>
            <span class="stat-value">+${(summary.education.researchBonus * 100).toFixed(0)}%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Nobelpreise</span>
            <span class="stat-value">${summary.education.nobelPrizes}</span>
          </div>
        </div>

        <div class="info-box">
          <h4>ℹ️ Über Universitäten</h4>
          <p>Universitäten erhöhen die Forschungsgeschwindigkeit und das Prestige Ihres Reiches.</p>
          <p>Deutsche Universitäten: Heidelberg (1386), Leipzig (1409), Berlin (1810), TU München (1868)</p>
          ${currentYear < 1386 ? '<p class="warning">⚠️ Universitäten sind erst ab 1386 verfügbar.</p>' : ''}
        </div>

        ${currentYear >= 1901 ? `
          <div class="nobel-prizes">
            <h4>🏆 Nobelpreise (ab 1901)</h4>
            <p>Ihr Reich hat ${summary.education.nobelPrizes} Nobelpreise gewonnen.</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderLibrariesTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const roadmapManager = this.game.getRoadmapFeaturesManager();
    // TODO: Future implementation will use librarySystem for detailed display
    // @ts-expect-error - Will be used in future library feature implementation
    const librarySystem = roadmapManager.getLibrarySystem();
    const summary = roadmapManager.getFeaturesSummary();

    return `
      <div class="libraries-panel">
        <h3>📚 Bibliotheken & Wissen</h3>
        
        <div class="stats-overview">
          <div class="stat-card">
            <span class="stat-label">Bücher</span>
            <span class="stat-value">${summary.libraries.totalBooks}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Kulturwert</span>
            <span class="stat-value">${summary.libraries.culturalValue.toFixed(0)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Zensur</span>
            <span class="stat-value">Kein aktives System</span>
          </div>
        </div>

        <div class="info-box">
          <h4>ℹ️ Über Bibliotheken</h4>
          <p>Bibliotheken speichern Wissen und erhöhen die kulturelle Entwicklung.</p>
          <p>Typen: Klosterbibliothek → Nationalbibliothek → Digitale Bibliothek</p>
          <p>Berühmte Bücher: Bibel, Principia Mathematica, Origin of Species</p>
        </div>
      </div>
    `;
  }

  private renderEspionageTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const roadmapManager = this.game.getRoadmapFeaturesManager();
    const espionageSystem = roadmapManager.getEspionageSystem();
    const summary = roadmapManager.getFeaturesSummary();

    return `
      <div class="espionage-panel">
        <h3>🕵️ Spionage & Geheimdienst</h3>
        
        <div class="stats-overview">
          <div class="stat-card">
            <span class="stat-label">Aktive Agenten</span>
            <span class="stat-value">${summary.espionage.activeAgents}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Gestohlene Tech</span>
            <span class="stat-value">${summary.espionage.stolenTech}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Netzwerk-Größe</span>
            <span class="stat-value">${espionageSystem.getAgents().length}</span>
          </div>
        </div>

        <div class="info-box">
          <h4>ℹ️ Über Spionage</h4>
          <p>Rekrutieren Sie Agenten für Sabotage, Technologiediebstahl und Attentate.</p>
          <p>Verfügbare Operationen:</p>
          <ul>
            <li>Doppelagenten einschleusen</li>
            <li>Technologie stehlen</li>
            <li>Sabotage (Produktion, Infrastruktur)</li>
            <li>Propaganda-Kampagnen</li>
          </ul>
        </div>

        <div class="propaganda-campaigns">
          <h4>📢 Propaganda</h4>
          <p>Starten Sie Kampagnen, um Moral und Kriegsunterstützung zu erhöhen.</p>
        </div>
      </div>
    `;
  }

  private renderColoniesTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const roadmapManager = this.game.getRoadmapFeaturesManager();
    const summary = roadmapManager.getFeaturesSummary();
    const currentYear = this.game.getCurrentYear();

    return `
      <div class="colonies-panel">
        <h3>🌍 Kolonien & Verwaltung</h3>
        
        <div class="stats-overview">
          <div class="stat-card">
            <span class="stat-label">Kolonien</span>
            <span class="stat-value">${summary.colonial.colonies}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Jahreseinkommen</span>
            <span class="stat-value">${summary.colonial.revenue.toFixed(0)} Gold</span>
          </div>
        </div>

        <div class="info-box">
          <h4>ℹ️ Deutsche Kolonien</h4>
          ${currentYear >= 1884 && currentYear <= 1919 ? `
            <p>Deutschland hatte folgende Kolonien (1884-1919):</p>
            <ul>
              <li>Deutsch-Ostafrika (1885-1919)</li>
              <li>Deutsch-Südwestafrika (1884-1915)</li>
              <li>Kamerun (1884-1916)</li>
              <li>Togoland (1884-1914)</li>
              <li>Deutsch-Neuguinea (1884-1914)</li>
              <li>Kiautschou (1898-1914)</li>
            </ul>
          ` : `
            <p>⚠️ Deutsche Kolonien existierten von 1884 bis 1919.</p>
            <p>Aktuelles Jahr: ${currentYear}</p>
          `}
        </div>
      </div>
    `;
  }

  private renderWaterwaysTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const roadmapManager = this.game.getRoadmapFeaturesManager();
    const summary = roadmapManager.getFeaturesSummary();

    return `
      <div class="waterways-panel">
        <h3>🚢 Wasserstraßen & Handel</h3>
        
        <div class="stats-overview">
          <div class="stat-card">
            <span class="stat-label">Wasserstraßen</span>
            <span class="stat-value">${summary.trade.waterways}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Handelsbonus</span>
            <span class="stat-value">+${(summary.trade.tradeBonus * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div class="info-box">
          <h4>ℹ️ Deutsche Flüsse & Kanäle</h4>
          <p><strong>Hauptflüsse:</strong></p>
          <ul>
            <li>Rhein (1.233 km) - Handelsbonus +50%</li>
            <li>Donau (2.857 km) - Handelsbonus +40%</li>
            <li>Elbe (1.094 km) - Handelsbonus +30%</li>
            <li>Oder (866 km) - Handelsbonus +20%</li>
          </ul>
          <p><strong>Wichtige Kanäle:</strong></p>
          <ul>
            <li>Nord-Ostsee-Kanal (1895) - Handelsbonus +60%</li>
            <li>Mittellandkanal (1938) - Handelsbonus +50%</li>
            <li>Rhein-Main-Donau (1992) - Handelsbonus +80%</li>
          </ul>
        </div>

        <div class="ports">
          <h4>⚓ Häfen</h4>
          <p>Hamburg, Bremen, Kiel - Deutschlands wichtigste Seehäfen</p>
        </div>
      </div>
    `;
  }

  private renderFortificationsTab(): string {
    if (!this.currentPlayer) {
      return '<p class="info-text">Bitte wählen Sie einen Spieler aus.</p>';
    }

    const roadmapManager = this.game.getRoadmapFeaturesManager();
    // TODO: Future implementation will use fortificationSystem for detailed display
    // @ts-expect-error - Will be used in future fortification feature implementation  
    const fortificationSystem = roadmapManager.getFortificationSystem();

    return `
      <div class="fortifications-panel">
        <h3>🏰 Befestigungen & Belagerung</h3>
        
        <div class="info-box">
          <h4>ℹ️ Befestigungstypen</h4>
          <ul>
            <li>Holzpalisade (Stärke 10, Höhe 3m)</li>
            <li>Einfache Steinmauer (Stärke 30, Höhe 5m)</li>
            <li>Burgmauern (Stärke 60, Höhe 8m, 4 Türme)</li>
            <li>Konzentrische Mauern (Stärke 90, 2 Schichten)</li>
            <li>Sternfestung (Stärke 120, 5 Bastionen)</li>
            <li>Moderne Befestigungen (Stärke 150, 10 Bunker)</li>
          </ul>
        </div>

        <div class="siege-weapons">
          <h4>⚔️ Belagerungswaffen</h4>
          <ul>
            <li>Rammbock (Effektivität 0.3, Nahkampf)</li>
            <li>Katapult (Effektivität 0.5, Reichweite 200m)</li>
            <li>Trebuchet (Effektivität 0.8, Reichweite 300m)</li>
            <li>Belagerungsturm (Effektivität 0.6, ermöglicht Skalierung)</li>
            <li>Kanone (Effektivität 1.2, Reichweite 500m)</li>
            <li>Schwere Artillerie (Effektivität 2.0, Reichweite 2000m)</li>
          </ul>
        </div>

        <div class="siege-tactics">
          <h4>📖 Belagerungstaktiken</h4>
          <ul>
            <li>Unterminierung - Langsam aber effektiv gegen Mauern</li>
            <li>Aushungern - Blockade der Versorgung</li>
            <li>Erstürmung - Direkte Attacke mit hohen Verlusten</li>
          </ul>
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
  }
}
