// src/main.ts
import { GameEngine } from './core/GameEngine';
import { UIFlowManager } from './ui/UIFlowManager';
import * as PIXI from 'pixi.js';
import '/styles/main.css';

class KaiserIIGame {
  private engine: GameEngine;
  private app: PIXI.Application;

  constructor() {
    this.engine = new GameEngine({
      maxPlayers: 4,
      difficulty: 2,
      gameSpeed: 1,
      randomEvents: true,
      startingYear: 1200,
    });

    this.app = new PIXI.Application();
    
    this.initializeUI();
  }

  private async initializeUI(): Promise<void> {
    try {
      // Clear loading screen
      const appContainer = document.getElementById('app');
      if (!appContainer) {
        throw new Error('App container not found');
      }

      // Initialize PixiJS application
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a2e,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      appContainer.innerHTML = '';
      appContainer.appendChild(this.app.canvas);

      // Initialize UI Flow Manager
      new UIFlowManager(this.app, this.engine);

      // Handle window resize
      window.addEventListener('resize', () => {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
      });

      console.log('✨ Kaiser II Game initialized successfully');
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  }
}

// Spiel starten, wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
  new KaiserIIGame();
});

// Globale Exporte für Entwicklertools
(window as any).KaiserII = {
  GameEngine,
  UIFlowManager,
};