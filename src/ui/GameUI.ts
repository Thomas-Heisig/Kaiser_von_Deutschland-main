// src/ui/GameUI.ts
import { GameEngine, GameState } from '../core/GameEngine';
import { Player } from '../core/Player';
import { Graphics } from './Graphics';
import { NewGameRenderer } from './NewGameRenderer';
import { EnhancedPixiRenderer } from './EnhancedPixiRenderer';
import { SaveManager } from './SaveManager';
import { NotificationSystem } from './NotificationSystem';
import { HelpSystem } from './HelpSystem';
import { RoadmapFeaturesUI } from './RoadmapFeaturesUI';
import { TradeRoutesPanel } from './TradeRoutesPanel';
import { MigrationPanel } from './MigrationPanel';
import { SocialMobilityPanel } from './SocialMobilityPanel';

export class GameUI {
  private game: GameEngine;
  private container: HTMLElement;
  private graphics?: Graphics;
  private newRenderer?: NewGameRenderer;
  private enhancedRenderer?: EnhancedPixiRenderer;
  private useEnhancedRenderer: boolean = true; // Use new complete PixiJS overhaul
  private useNewRenderer: boolean = false; // Old renderer toggle
  private saveManager: SaveManager;
  private notificationSystem: NotificationSystem;
  private helpSystem: HelpSystem;
  private roadmapFeaturesUI?: RoadmapFeaturesUI;
  private tradeRoutesPanel?: TradeRoutesPanel;
  private migrationPanel?: MigrationPanel;
  private socialMobilityPanel?: SocialMobilityPanel;
  private _currentPlayerId?: string;

  // UI-Elemente Referenzen
  // TODO: Will be used for player sidebar interactions in future features
  // @ts-expect-error - Unused until sidebar features are implemented
  private _playerSidebar!: HTMLElement;
  private mainView!: HTMLElement;
  // TODO: Will be used for saves panel interactions in future features
  // @ts-expect-error - Unused until saves panel features are implemented
  private _savesPanel!: HTMLElement;

  constructor(game: GameEngine, containerId: string) {
    this.game = game;
    this.container = document.getElementById(containerId) || this.createRoot(containerId);
    this.saveManager = new SaveManager(game);
    this.notificationSystem = new NotificationSystem();
    this.helpSystem = new HelpSystem();
    
    // Use enhanced PixiJS renderer instead of DOM
    if (this.useEnhancedRenderer) {
      this.initializeEnhancedRenderer();
    } else {
      this.initializeUI();
      this.setupEventListeners();
      this.setupGameEvents();

      // Initial render of lists
      this.renderPlayers();
      this.renderSavesList();
    }
  }

  private async initializeEnhancedRenderer(): Promise<void> {
    try {
      this.enhancedRenderer = await EnhancedPixiRenderer.create({
        containerId: this.container.id,
      });
      console.log('✨ Enhanced PixiJS Renderer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Enhanced PixiJS Renderer:', error);
      // Fallback to DOM UI
      this.useEnhancedRenderer = false;
      this.initializeUI();
      this.setupEventListeners();
      this.setupGameEvents();
      this.renderPlayers();
      this.renderSavesList();
    }
  }

  private createRoot(id: string): HTMLElement {
    const root = document.createElement('div');
    root.id = id;
    document.body.appendChild(root);
    return root;
  }

  private initializeUI(): void {
    this.container.innerHTML = `
      <div class="game-container">
        <header>
          <div style="display:flex;align-items:center;gap:12px;">
            <button id="toggle-sidebar" class="icon-btn" title="Toggle Sidebar">☰</button>
            <h1>Kaiser II <span class="brand-sub">Kingdom Simulator</span></h1>
          </div>
          <div class="game-status">
            <span id="current-month">Monat: Jan</span>
            <span id="current-year">Jahr: 1200</span>
            <span id="game-state">Lobby</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button id="help-btn" class="help-btn" title="Hilfe & Dokumentation">
              📖 Hilfe
            </button>
          </div>
        </header>
        
        <div class="game-content">
          <aside class="player-sidebar" id="player-sidebar">
            <h3>Spieler <button id="add-player-btn" class="icon-btn">+</button></h3>
            <div id="players-list"></div>
          </aside>
          
          <main id="main-view">
            <div class="welcome-screen">
              <h2>Willkommen bei Kaiser II</h2>
              <p>Erstellen Sie einen Spieler oder laden Sie einen Spielstand.</p>
            </div>
          </main>
          
          <aside class="saves-panel" id="saves-panel">
            <h3>Spielstände</h3>
            <div id="saves-list"></div>
          </aside>
        </div>
        
        <div class="ui-actions">
          <div class="game-controls">
            <button id="new-game-btn" class="btn-primary">Neues Spiel</button>
            <button id="next-year-btn" class="btn-primary">Nächstes Jahr</button>
            <button id="pause-game-btn" class="btn-secondary">Pause</button>
            <button id="toggle-renderer-btn" class="btn-secondary" title="Grafik-Engine wechseln">🎨 Neue Grafik</button>
          </div>
          
          <div class="save-controls">
            <button id="save-btn" class="btn-secondary">Speichern</button>
            <button id="save-as-btn" class="btn-secondary">Speichern unter...</button>
            <button id="load-game-btn" class="btn-secondary">Laden</button>
          </div>
          
          <div class="help-hint" style="font-size:0.85em;color:#bbb;margin-top:8px;">
            💡 Tastenkürzel: 1-5 (Ansichten), R (Regen), S (Schnee), C (Klar), Leertaste (Effekt)
          </div>
        </div>
        
        <div id="notification-container"></div>
      </div>
    `;

    // Referenzen zuweisen
    this._playerSidebar = this.container.querySelector('#player-sidebar')!;
    this.mainView = this.container.querySelector('#main-view')!;
    this._savesPanel = this.container.querySelector('#saves-panel')!;
  }

  private setupEventListeners(): void {
    // Spieler Management
    this.container.querySelector('#add-player-btn')?.addEventListener('click', () => this.showPlayerCreation());
    
    // Help button
    this.container.querySelector('#help-btn')?.addEventListener('click', () => {
      this.helpSystem.toggle();
    });

    // Spielsteuerung
    this.container.querySelector('#new-game-btn')?.addEventListener('click', () => this.startNewGame());
    this.container.querySelector('#next-year-btn')?.addEventListener('click', () => this.advanceYear());
    this.container.querySelector('#pause-game-btn')?.addEventListener('click', () => {
      if (this.game.getGameState() === (window as any).GameState?.RUNNING) {
        this.game.pauseGame();
      } else {
        this.game.resumeGame();
      }
    });

    // Grafik-Engine Toggle
    this.container.querySelector('#toggle-renderer-btn')?.addEventListener('click', () => {
      this.useNewRenderer = !this.useNewRenderer;
      const btn = this.container.querySelector('#toggle-renderer-btn');
      if (btn) {
        btn.textContent = this.useNewRenderer ? '🎨 Neue Grafik' : '🗺️ Alte Grafik';
      }
      this.notificationSystem.show(
        'Grafik-Engine',
        this.useNewRenderer ? 'Neue kreative Grafik-Engine aktiviert!' : 'Alte Grafik-Engine aktiviert'
      );
      
      // Re-render current view if player is selected
      if (this._currentPlayerId) {
        const player = this.game.getPlayerById(this._currentPlayerId);
        if (player) {
          this.showKingdomView(player);
        }
      }
    });

    // Sidebar toggle
    this.container.querySelector('#toggle-sidebar')?.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
    });
    
    // Speicherfunktionen
    this.container.querySelector('#save-btn')?.addEventListener('click', () => this.saveGame());
    this.container.querySelector('#save-as-btn')?.addEventListener('click', () => this.saveGameAs());
    this.container.querySelector('#load-game-btn')?.addEventListener('click', () => this.loadGame());
  }

  private setupGameEvents(): void {
    this.game.on('playerAdded', (detail) => {
      this.renderPlayers();
      this.notificationSystem.show('Spieler hinzugefügt', `${detail.player.name} ist dem Spiel beigetreten.`);
    });

    this.game.on('titlePromotion', (detail) => {
      this.notificationSystem.show('Beförderung!', `${detail.playerName} wurde zum ${detail.newTitle.name} befördert!`);
      this.playPromotionSound();
      this.renderPlayers();
    });

    this.game.on('yearAdvanced', (detail) => {
      this.updateYearDisplay(detail.year);
      this.renderPlayers();
      this.notificationSystem.show('Jahr beendet', `Das Jahr ${detail.year} wurde abgeschlossen.`);
    });

    this.game.on('monthAdvanced', (detail) => {
      this.updateMonthDisplay(detail.month, detail.year);
    });

    this.game.on('gameStateChanged', (detail) => {
      this.updateGameStateDisplay(detail.state);
    });
  }

  private async renderPlayers(): Promise<void> {
    const playersList = this.container.querySelector('#players-list');
    if (!playersList) return;

    const players = this.game.getPlayers();
    
    if (players.length === 0) {
      playersList.innerHTML = '<div class="no-players">Keine Spieler vorhanden</div>';
      return;
    }

    playersList.innerHTML = players.map(player => `
      <div class="player-card" data-player-id="${player.id}">
        <div class="player-header">
          <span class="player-name">${player.name}</span>
          <span class="player-title">${player.title.name}</span>
        </div>
        <div class="player-stats">
          <div class="stat">
            <span class="stat-label">Gold:</span>
            <span class="stat-value">${player.kingdom.resources.gold}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Ruhm:</span>
            <span class="stat-value">${player.stats.prestige}</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="view-kingdom-btn" data-player-id="${player.id}">Reich ansehen</button>
          <button class="btn-secondary remove-player-btn" data-player-id="${player.id}">Austreten</button>
        </div>
      </div>
    `).join('');

    // Event Listener für Kingdom-Ansicht
    playersList.querySelectorAll('.view-kingdom-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playerId = (e.target as HTMLElement).dataset.playerId;
        if (playerId) {
          const player = this.game.getPlayerById(playerId);
          if (player) this.showKingdomView(player);
        }
      });
    });

    // Remove / resign button
    playersList.querySelectorAll('.remove-player-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playerId = (e.currentTarget as HTMLElement).dataset.playerId;
        if (playerId && confirm('Spieler wirklich austreten lassen?')) {
          try {
            this.game.removePlayer(playerId);
            this.notificationSystem.show('Austritt', 'Spieler wurde entfernt.');
            this.renderPlayers();
          } catch (err) {
            this.notificationSystem.show('Fehler', 'Spieler konnte nicht entfernt werden.');
          }
        }
      });
    });
  }

  public showKingdomView(player: Player): void {
    this._currentPlayerId = player.id;

    // Use enhanced renderer if available
    if (this.useEnhancedRenderer && this.enhancedRenderer) {
      this.enhancedRenderer.showKingdomView(player);
      return;
    }

    // Fallback to old renderer
    if (this.useNewRenderer && this.newRenderer) {
      this.newRenderer.renderKingdom(player.kingdom);
      return;
    }
    
    this.mainView.innerHTML = `
      <div class="kingdom-view" data-player-id="${player.id}">
        <div class="kingdom-header">
          <h2>Königreich ${player.kingdom.name}</h2>
          <div class="ruler-info">
            <span class="title-badge">${player.title.name}</span>
            <span class="ruler-name">${player.name}</span>
          </div>
        </div>

        <div class="kingdom-content">
          <!-- Ressourcen Panel -->
          <div class="resources-panel">
            <h3>Ressourcen</h3>
            <div class="resource-grid">
              <div class="resource-item">
                <span class="resource-icon">💰</span>
                <span class="resource-name">Gold:</span>
                <span id="gold-value" class="resource-value">${player.kingdom.resources.gold}</span>
              </div>
              <div class="resource-item">
                <span class="resource-icon">🌾</span>
                <span class="resource-name">Nahrung:</span>
                <span id="food-value" class="resource-value">${player.kingdom.resources.food}</span>
              </div>
              <div class="resource-item">
                <span class="resource-icon">⚔️</span>
                <span class="resource-name">Truppen:</span>
                <span id="troops-value" class="resource-value">${player.kingdom.military.infantry}</span>
              </div>
            </div>
          </div>

          <!-- Aktionen Panel -->
          <div class="actions-panel">
            <h3>Königliche Anordnungen</h3>
            
            <div class="action-group">
              <h4>🎯 Spezielle Features</h4>
              <div class="special-actions">
                <button id="show-roadmap-features-btn" class="btn-special" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: bold; padding: 12px; border: none; border-radius: 6px; cursor: pointer; width: 100%; margin-bottom: 10px;">
                  🌟 Erweiterte Features (v2.5.0)
                  <br><small style="opacity: 0.9;">Universitäten, Bibliotheken, Spionage, Kolonien & mehr</small>
                </button>
                <button id="show-trade-routes-btn" class="btn-special" style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; font-weight: bold; padding: 12px; border: none; border-radius: 6px; cursor: pointer; width: 100%; margin-bottom: 10px;">
                  🚢 Handelsrouten (v2.6.0)
                  <br><small style="opacity: 0.9;">Verwalte Handelsrouten & Transport</small>
                </button>
                <button id="show-migration-panel-btn" class="btn-special" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; font-weight: bold; padding: 12px; border: none; border-radius: 6px; cursor: pointer; width: 100%; margin-bottom: 10px;">
                  🚶 Migrations-Ströme (v2.1.5)
                  <br><small style="opacity: 0.9;">Bevölkerungsbewegung zwischen Regionen</small>
                </button>
                <button id="show-social-mobility-btn" class="btn-special" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; font-weight: bold; padding: 12px; border: none; border-radius: 6px; cursor: pointer; width: 100%;">
                  📈 Berufswechsel (v2.1.5)
                  <br><small style="opacity: 0.9;">Soziale Mobilität & Karrieren</small>
                </button>
              </div>
            </div>
            
            <div class="action-group">
              <h4>Steuerpolitik</h4>
              <div class="tax-controls">
                <label>Steuersatz: <span id="tax-percentage">${Math.round(player.kingdom.taxRate * 100)}%</span></label>
                <input type="range" id="tax-slider" min="5" max="50" value="${Math.round(player.kingdom.taxRate * 100)}" step="1">
                <button id="apply-tax-btn">Steuern festlegen</button>
              </div>
            </div>

            <div class="action-group">
              <h4>Bauvorhaben</h4>
              <div class="build-controls">
                <button class="build-btn" data-building="market">
                  Marktplatz bauen<br>
                  <small>Kosten: 2000 Gold</small>
                </button>
                <button class="build-btn" data-building="farm">
                  Bauernhof bauen<br>
                  <small>Kosten: 1500 Gold</small>
                </button>
                <button class="build-btn" data-building="mill">
                  Mühle bauen<br>
                  <small>Kosten: 2500 Gold</small>
                </button>
                <button class="build-btn" data-building="mine">
                  Mine bauen<br>
                  <small>Kosten: 3000 Gold</small>
                </button>
                <button class="build-btn" data-building="barracks">
                  Kaserne bauen<br>
                  <small>Kosten: 2500 Gold</small>
                </button>
                <button class="build-btn" data-building="walls">
                  Stadtmauer bauen<br>
                  <small>Kosten: 5000 Gold</small>
                </button>
              </div>
            </div>

            <div class="action-group">
              <h4>Militär</h4>
              <div class="military-controls">
                <div class="recruit-controls">
                  <input type="number" id="recruit-count" min="1" max="1000" value="10">
                  <select id="recruit-type">
                    <option value="infantry">Infanterie</option>
                    <option value="cavalry">Kavallerie</option>
                    <option value="archers">Bogenschützen</option>
                  </select>
                  <button id="recruit-btn">Soldaten rekrutieren</button>
                  <small>(Inf:50G / Cav:150G / Bog:75G)</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Karte -->
          <div class="map-panel">
            <h3>Königreichskarte</h3>
            <div id="kingdom-map" style="width: 600px; height: 400px;"></div>
          </div>

          <!-- Statistik -->
          <div class="stats-panel">
            <h3>Statistiken</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span>Bevölkerung:</span>
                <span>${player.kingdom.population.peasants + player.kingdom.population.nobles}</span>
              </div>
              <div class="stat-item">
                <span>Zufriedenheit:</span>
                <span>${player.kingdom.happiness}%</span>
              </div>
              <div class="stat-item">
                <span>Fläche:</span>
                <span>${player.kingdom.landArea} km²</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupKingdomControls(player);

    // Lazily create Graphics when the kingdom view exists
    this.initializeGraphics(player);
  }

  private async initializeGraphics(player: Player): Promise<void> {
    try {
      if (this.useNewRenderer) {
        // Neue, kreative Grafik-Engine verwenden
        if (!this.newRenderer) {
          this.newRenderer = await NewGameRenderer.create('kingdom-map');
        }
        this.newRenderer.renderKingdom(player.kingdom);
      } else {
        // Alte Grafik-Engine (Fallback)
        if (!this.graphics) {
          this.graphics = await Graphics.create('kingdom-map');
        }
        this.graphics.renderKingdom(player.kingdom);
      }
    } catch (err) {
      console.warn('Graphics initialisation failed:', err);
      this.notificationSystem.show('Warnung', 'Kartenansicht konnte nicht gerendert werden.');
    }
  }

  private setupKingdomControls(player: Player): void {
    // Roadmap Features Button
    this.mainView.querySelector('#show-roadmap-features-btn')?.addEventListener('click', () => {
      this.showRoadmapFeaturesPanel(player);
    });

    // Trade Routes Button (v2.6.0)
    this.mainView.querySelector('#show-trade-routes-btn')?.addEventListener('click', () => {
      this.showTradeRoutesPanel(player);
    });

    // Migration Panel Button (v2.1.5)
    this.mainView.querySelector('#show-migration-panel-btn')?.addEventListener('click', () => {
      this.showMigrationPanel();
    });

    // Social Mobility Panel Button (v2.1.5)
    this.mainView.querySelector('#show-social-mobility-btn')?.addEventListener('click', () => {
      this.showSocialMobilityPanel();
    });

    // Steuersatz
    const taxSlider = this.mainView.querySelector('#tax-slider') as HTMLInputElement;
    const taxPercentage = this.mainView.querySelector('#tax-percentage')!;
    
    taxSlider.addEventListener('input', () => {
      taxPercentage.textContent = `${taxSlider.value}%`;
    });

    this.mainView.querySelector('#apply-tax-btn')?.addEventListener('click', () => {
      const taxRate = parseInt(taxSlider.value) / 100;
      this.game.setTaxRate(player.id, taxRate);
      this.notificationSystem.show('Steuerpolitik', `Steuersatz auf ${taxSlider.value}% festgelegt.`);
    });

    // Bauvorhaben
    this.mainView.querySelectorAll('.build-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const building = (e.currentTarget as HTMLElement).dataset.building;
        if (building) {
          const success = await this.game.buildForPlayer(player.id, building as any);
          if (success) {
            this.notificationSystem.show('Bau abgeschlossen', `${building} wurde erfolgreich gebaut.`);
            this.showKingdomView(player); // Ansicht aktualisieren
          } else {
            this.notificationSystem.show('Fehler', 'Nicht genug Gold für diesen Bau.');
          }
        }
      });
    });

    // Buy land
    this.mainView.querySelector('#buy-land-btn')?.addEventListener('click', () => {
      const amount = parseInt(((this.mainView.querySelector('#buy-land-amount') as HTMLInputElement).value)) || 0;
      const costPer = 50; // gold per km² (example)
      const totalCost = amount * costPer;
      try {
        if (amount <= 0) throw new Error('Invalid amount');
        if (player.kingdom.resources.gold < totalCost) throw new Error('Not enough gold');
        player.kingdom.resources.gold -= totalCost;
        player.kingdom.landArea += amount;
        player.kingdom.terrain.arableLand += amount * 0.4;
        this.notificationSystem.show('Landkauf', `Kauf von ${amount} km² Land erfolgreich (${totalCost} Gold).`);
        this.showKingdomView(player);
      } catch (err) {
        this.notificationSystem.show('Fehler', 'Kauf von Land fehlgeschlagen.');
      }
    });

    // Rekrutierung
    this.mainView.querySelector('#recruit-btn')?.addEventListener('click', () => {
      const count = parseInt((this.mainView.querySelector('#recruit-count') as HTMLInputElement).value) || 0;
      const type = (this.mainView.querySelector('#recruit-type') as HTMLSelectElement).value as any;
      const success = this.game.recruitForPlayer(player.id, count, type);

      if (success) {
        this.notificationSystem.show('Rekrutierung', `${count} ${type} wurden rekrutiert.`);
        this.showKingdomView(player);
      } else {
        this.notificationSystem.show('Fehler', 'Nicht genug Gold oder Ressourcen für die Rekrutierung.');
      }
    });
  }

  private async startNewGame(): Promise<void> {
    try {
      await this.game.startGame();
      this.notificationSystem.show('Spiel gestartet', 'Ein neues Spiel wurde gestartet.');
    } catch (error) {
      this.notificationSystem.show('Fehler', 'Spiel konnte nicht gestartet werden.');
    }
  }

  private async advanceYear(): Promise<void> {
    try {
      if (this.game.getGameState() !== GameState.RUNNING) {
        try { await this.game.startGame(); } catch {}
      }

      await this.game.nextYear();
    } catch (error) {
      this.notificationSystem.show('Fehler', 'Jahr konnte nicht fortgeschaltet werden.');
    }
  }

  // TODO: Implement pause/resume functionality
  // @ts-expect-error - Unused until pause feature is implemented
  private _togglePause(): void {
    // Implementierung für Pause-Funktionalität
  }

  private async saveGame(): Promise<void> {
    await this.saveManager.saveCurrentGame();
    this.renderSavesList();
  }

  private async saveGameAs(): Promise<void> {
    const slotName = prompt('Name für den Spielstand:', `slot_${Date.now()}`);
    if (slotName) {
      await this.saveManager.saveGameAs(slotName);
      this.renderSavesList();
    }
  }

  private async loadGame(): Promise<void> {
    await this.saveManager.loadGame();
    this.renderPlayers();
  }

  private async renderSavesList(): Promise<void> {
    const savesList = this.container.querySelector('#saves-list');
    if (!savesList) return;

    const saves = await this.saveManager.getSavesList();
    
    savesList.innerHTML = saves.map((save: any) => `
      <div class="save-item">
        <div class="save-info">
          <strong>${save.slot}</strong>
          <small>${new Date(save.savedAt).toLocaleString()}</small>
        </div>
        <div class="save-actions">
          <button class="load-save-btn" data-slot="${save.slot}">Laden</button>
          <button class="delete-save-btn" data-slot="${save.slot}">Löschen</button>
        </div>
      </div>
    `).join('');

    // Event Listener für Save-Buttons
    savesList.querySelectorAll('.load-save-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const slot = (e.currentTarget as HTMLElement).dataset.slot;
        if (slot) {
          await this.saveManager.loadGame(slot);
          this.renderPlayers();
          this.notificationSystem.show('Spiel geladen', `Spielstand "${slot}" wurde geladen.`);
        }
      });
    });

    savesList.querySelectorAll('.delete-save-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const slot = (e.currentTarget as HTMLElement).dataset.slot;
        if (slot && confirm(`Spielstand "${slot}" wirklich löschen?`)) {
          await this.saveManager.deleteSave(slot);
          this.renderSavesList();
          this.notificationSystem.show('Gelöscht', `Spielstand "${slot}" wurde gelöscht.`);
        }
      });
    });
  }

  private showPlayerCreation(): void {
    this.mainView.innerHTML = `
      <div class="player-creation">
        <h2>Neuen Spieler erstellen</h2>
        <form id="player-creation-form">
          <div class="form-group">
            <label for="player-name">Name:</label>
            <input type="text" id="player-name" required>
          </div>
          
          <div class="form-group">
            <label for="player-gender">Geschlecht:</label>
            <select id="player-gender">
              <option value="male">Männlich</option>
              <option value="female">Weiblich</option>
              <option value="other">Anderes</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="kingdom-name">Name des Königreichs:</label>
            <input type="text" id="kingdom-name" required>
          </div>
          
          <div class="form-group">
            <label for="difficulty">Schwierigkeitsgrad:</label>
            <select id="difficulty">
              <option value="1">Leicht</option>
              <option value="2" selected>Normal</option>
              <option value="3">Schwer</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">Spieler erstellen</button>
            <button type="button" id="cancel-creation" class="btn-secondary">Abbrechen</button>
          </div>
        </form>
      </div>
    `;

    const form = this.mainView.querySelector('#player-creation-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createPlayer();
    });

    this.mainView.querySelector('#cancel-creation')?.addEventListener('click', () => {
      this.mainView.innerHTML = '<div class="welcome-screen"><h2>Willkommen bei Kaiser II</h2></div>';
    });
  }

  private createPlayer(): void {
    const name = (this.mainView.querySelector('#player-name') as HTMLInputElement).value;
    const gender = (this.mainView.querySelector('#player-gender') as HTMLSelectElement).value as any;
    const kingdomName = (this.mainView.querySelector('#kingdom-name') as HTMLInputElement).value;
    const difficulty = parseInt((this.mainView.querySelector('#difficulty') as HTMLSelectElement).value);

    try {
      const player = this.game.addPlayer({
        name,
        gender,
        kingdomName,
        difficulty
      });

      this.notificationSystem.show('Spieler erstellt', `${name} herrscht nun über ${kingdomName}.`);
      this.showKingdomView(player);
    } catch (error) {
      this.notificationSystem.show('Fehler', 'Spieler konnte nicht erstellt werden.');
    }
  }

  private updateYearDisplay(year: number): void {
    const yearElement = this.container.querySelector('#current-year');
    if (yearElement) {
      yearElement.textContent = `Jahr: ${year}`;
    }
  }

  private updateMonthDisplay(month: number, year: number): void {
    const monthNames = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    const monthElement = this.container.querySelector('#current-month');
    const yearElement = this.container.querySelector('#current-year');
    if (monthElement) monthElement.textContent = `Monat: ${monthNames[month-1]}`;
    if (yearElement) yearElement.textContent = `Jahr: ${year}`;
  }

  private updateGameStateDisplay(state: string): void {
    const stateElement = this.container.querySelector('#game-state');
    if (stateElement) {
      stateElement.textContent = state;
    }
  }

  private playPromotionSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Audio nicht verfügbar:', error);
    }
  }

  private showRoadmapFeaturesPanel(player: Player): void {
    // Create roadmap features UI if it doesn't exist
    if (!this.roadmapFeaturesUI) {
      // Create a modal container for roadmap features
      const modalContainer = document.createElement('div');
      modalContainer.id = 'roadmap-features-modal';
      modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 20px;
        box-sizing: border-box;
      `;
      
      const panelWrapper = document.createElement('div');
      panelWrapper.id = 'roadmap-features-panel-wrapper';
      panelWrapper.style.cssText = `
        background: #1a1a2e;
        border-radius: 12px;
        padding: 24px;
        max-width: 1200px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
        position: relative;
      `;
      
      const closeButton = document.createElement('button');
      closeButton.textContent = '✕';
      closeButton.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        background: #ff4757;
        color: white;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      `;
      closeButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
      });
      
      panelWrapper.appendChild(closeButton);
      
      const featuresContainer = document.createElement('div');
      featuresContainer.id = 'roadmap-features-container';
      panelWrapper.appendChild(featuresContainer);
      
      modalContainer.appendChild(panelWrapper);
      document.body.appendChild(modalContainer);
      
      this.roadmapFeaturesUI = new RoadmapFeaturesUI(
        this.game,
        'roadmap-features-container',
        this.notificationSystem
      );
    } else {
      // Show existing panel
      const modal = document.getElementById('roadmap-features-modal');
      if (modal) {
        modal.style.display = 'flex';
      }
    }
    
    // Set the current player for the roadmap UI
    this.roadmapFeaturesUI.setPlayer(player);
    
    this.notificationSystem.show(
      '🌟 Erweiterte Features',
      'Willkommen zu den neuen Roadmap-Features von v2.5.0!'
    );
  }

  private showMigrationPanel(): void {
    // Create migration panel if it doesn't exist
    if (!this.migrationPanel) {
      this.migrationPanel = new MigrationPanel(this.game);
    }
    
    // Show the panel
    this.migrationPanel.show();
  }

  private showSocialMobilityPanel(): void {
    // Create social mobility panel if it doesn't exist
    if (!this.socialMobilityPanel) {
      this.socialMobilityPanel = new SocialMobilityPanel(this.game);
    }
    
    // Show the panel
    this.socialMobilityPanel.show();
  }

  private showTradeRoutesPanel(player: Player): void {
    // Create trade routes panel if it doesn't exist
    if (!this.tradeRoutesPanel) {
      // Create a modal container for trade routes
      const modalContainer = document.createElement('div');
      modalContainer.id = 'trade-routes-modal';
      modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 20px;
        box-sizing: border-box;
      `;
      
      const panelWrapper = document.createElement('div');
      panelWrapper.id = 'trade-routes-panel-wrapper';
      panelWrapper.style.cssText = `
        background: #1a1a2e;
        border-radius: 12px;
        padding: 24px;
        max-width: 1200px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
        position: relative;
      `;
      
      const closeButton = document.createElement('button');
      closeButton.textContent = '✕';
      closeButton.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        background: #ff4757;
        color: white;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      `;
      closeButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
      });
      
      panelWrapper.appendChild(closeButton);
      
      const tradeRoutesContainer = document.createElement('div');
      tradeRoutesContainer.id = 'trade-routes-container';
      panelWrapper.appendChild(tradeRoutesContainer);
      
      modalContainer.appendChild(panelWrapper);
      document.body.appendChild(modalContainer);
      
      this.tradeRoutesPanel = new TradeRoutesPanel(
        this.game,
        'trade-routes-container',
        this.notificationSystem
      );
    } else {
      // Show existing panel
      const modal = document.getElementById('trade-routes-modal');
      if (modal) {
        modal.style.display = 'flex';
      }
    }
    
    // Set the current player for the trade routes panel
    this.tradeRoutesPanel.setPlayer(player);
    
    this.notificationSystem.show(
      '🚢 Handelsrouten',
      'Verwalte deine Handelsrouten und baue dein Transportnetzwerk aus!'
    );
  }
}