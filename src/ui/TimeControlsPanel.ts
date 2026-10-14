// src/ui/TimeControlsPanel.ts

import * as PIXI from 'pixi.js';
import { GameEngine } from '../core/GameEngine';
import { TimeMode } from '../core/TimeSystem';

/**
 * Panel für Zeit-Kontrollen
 */
export class TimeControlsPanel {
  private container: PIXI.Container;
  private gameEngine: GameEngine;
  
  // UI Elements
  private modeText?: PIXI.Text;
  private speedText?: PIXI.Text;
  private dateText?: PIXI.Text;
  private pauseButton?: PIXI.Container;
  
  constructor(gameEngine: GameEngine) {
    this.container = new PIXI.Container();
    this.gameEngine = gameEngine;
    
    this.setupUI();
    this.updateDisplay();
  }
  
  /**
   * Initialisiert die UI
   */
  private setupUI(): void {
    // Kompakter Hintergrund
    const background = new PIXI.Graphics();
    background.rect(0, 0, 400, 120);
    background.fill({ color: 0x1a1a2e, alpha: 0.9 });
    background.stroke({ width: 2, color: 0x4a90e2 });
    this.container.addChild(background);
    
    // Titel
    const title = new PIXI.Text({
      text: 'Zeit-Kontrolle',
      style: {
        fontSize: 18,
        fill: 0xffd700,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    title.x = 10;
    title.y = 10;
    this.container.addChild(title);
    
    // Aktuelles Datum
    this.dateText = new PIXI.Text({
      text: '',
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: 'Arial'
      }
    });
    this.dateText.x = 10;
    this.dateText.y = 35;
    this.container.addChild(this.dateText);
    
    // Zeit-Modus
    this.modeText = new PIXI.Text({
      text: '',
      style: {
        fontSize: 14,
        fill: 0xaaaaff,
        fontFamily: 'Arial'
      }
    });
    this.modeText.x = 10;
    this.modeText.y = 60;
    this.container.addChild(this.modeText);
    
    // Geschwindigkeit
    this.speedText = new PIXI.Text({
      text: '',
      style: {
        fontSize: 14,
        fill: 0xaaffaa,
        fontFamily: 'Arial'
      }
    });
    this.speedText.x = 10;
    this.speedText.y = 80;
    this.container.addChild(this.speedText);
    
    // Buttons
    let buttonX = 220;
    
    // Pause/Resume Button
    this.pauseButton = this.createButton('⏸️', buttonX, 10, () => {
      const timeSystem = this.gameEngine.getTimeSystem();
      if (timeSystem.getPaused()) {
        timeSystem.resume();
        this.gameEngine.resumeGame();
      } else {
        timeSystem.pause();
        this.gameEngine.pauseGame();
      }
      this.updateDisplay();
    });
    this.container.addChild(this.pauseButton);
    buttonX += 45;
    
    // Detail Mode Button
    const detailButton = this.createButton('📅', buttonX, 10, () => {
      this.gameEngine.getTimeSystem().setMode(TimeMode.DETAIL);
      this.updateDisplay();
    }, 'Detail (1s=1 Tag)');
    this.container.addChild(detailButton);
    buttonX += 45;
    
    // Balanced Mode Button
    const balancedButton = this.createButton('📆', buttonX, 10, () => {
      this.gameEngine.getTimeSystem().setMode(TimeMode.BALANCED);
      this.updateDisplay();
    }, 'Ausgewogen (1s=1 Monat)');
    this.container.addChild(balancedButton);
    buttonX += 45;
    
    // Strategic Mode Button
    const strategicButton = this.createButton('🗓️', buttonX, 10, () => {
      this.gameEngine.getTimeSystem().setMode(TimeMode.STRATEGIC);
      this.updateDisplay();
    }, 'Strategisch (1s=1 Jahr)');
    this.container.addChild(strategicButton);
    
    // Speed Controls
    buttonX = 220;
    const slowerButton = this.createButton('◀', buttonX, 60, () => {
      const timeSystem = this.gameEngine.getTimeSystem();
      const currentSpeed = timeSystem.getSpeed();
      timeSystem.setSpeed(currentSpeed * 0.5);
      this.updateDisplay();
    }, 'Langsamer');
    this.container.addChild(slowerButton);
    buttonX += 45;
    
    const normalButton = this.createButton('▶', buttonX, 60, () => {
      this.gameEngine.getTimeSystem().setSpeed(1.0);
      this.updateDisplay();
    }, 'Normal');
    this.container.addChild(normalButton);
    buttonX += 45;
    
    const fasterButton = this.createButton('▶▶', buttonX, 60, () => {
      const timeSystem = this.gameEngine.getTimeSystem();
      const currentSpeed = timeSystem.getSpeed();
      timeSystem.setSpeed(currentSpeed * 2.0);
      this.updateDisplay();
    }, 'Schneller');
    this.container.addChild(fasterButton);
  }
  
  /**
   * Erstellt einen Button
   */
  private createButton(
    text: string,
    x: number,
    y: number,
    onClick: () => void,
    tooltip?: string
  ): PIXI.Container {
    const buttonContainer = new PIXI.Container();
    buttonContainer.x = x;
    buttonContainer.y = y;
    
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 40, 40);
    bg.fill({ color: 0x4a90e2 });
    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    
    bg.on('pointerover', () => {
      bg.clear();
      bg.rect(0, 0, 40, 40);
      bg.fill({ color: 0x5aa0f2 });
      
      // Zeige Tooltip (vereinfacht)
      if (tooltip) {
        console.log(tooltip);
      }
    });
    
    bg.on('pointerout', () => {
      bg.clear();
      bg.rect(0, 0, 40, 40);
      bg.fill({ color: 0x4a90e2 });
    });
    
    bg.on('pointertap', onClick);
    
    buttonContainer.addChild(bg);
    
    const buttonText = new PIXI.Text({
      text,
      style: {
        fontSize: 18,
        fill: 0xffffff,
        fontFamily: 'Arial'
      }
    });
    buttonText.x = 20 - buttonText.width / 2;
    buttonText.y = 20 - buttonText.height / 2;
    buttonContainer.addChild(buttonText);
    
    return buttonContainer;
  }
  
  /**
   * Aktualisiert die Anzeige
   */
  public updateDisplay(): void {
    const timeSystem = this.gameEngine.getTimeSystem();
    const timeInfo = timeSystem.getTimeInfo();
    
    if (this.dateText) {
      this.dateText.text = `Datum: ${timeInfo.formattedDate}`;
    }
    
    if (this.modeText) {
      this.modeText.text = `Modus: ${timeSystem.getModeDescription()}`;
    }
    
    if (this.speedText) {
      const speedMultiplier = timeInfo.speed;
      this.speedText.text = `Geschwindigkeit: ${speedMultiplier.toFixed(1)}x ${timeInfo.isPaused ? '(PAUSIERT)' : ''}`;
    }
    
    // Update Pause Button
    if (this.pauseButton) {
      const pauseButtonText = this.pauseButton.children[1] as PIXI.Text;
      if (pauseButtonText) {
        pauseButtonText.text = timeInfo.isPaused ? '▶️' : '⏸️';
      }
    }
  }
  
  /**
   * Holt den Container
   */
  public getContainer(): PIXI.Container {
    return this.container;
  }
  
  /**
   * Zerstört das Panel
   */
  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
