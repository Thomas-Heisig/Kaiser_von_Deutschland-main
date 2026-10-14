// src/ui/RoleSwitchingPanel.ts

import * as PIXI from 'pixi.js';
import { GameEngine } from '../core/GameEngine';
import { Citizen } from '../core/CitizenSystem';

/**
 * Panel für Rollenwechsel zwischen Charakteren
 */
export class RoleSwitchingPanel {
  private container: PIXI.Container;
  private gameEngine: GameEngine;
  private currentPlayerId: string;
  
  private characterListContainer?: PIXI.Container;
  
  // UI Elements
  private titleText?: PIXI.Text;
  private currentCharacterInfo?: PIXI.Text;
  private characterButtons: PIXI.Container[] = [];
  
  constructor(gameEngine: GameEngine, playerId: string) {
    this.container = new PIXI.Container();
    this.gameEngine = gameEngine;
    this.currentPlayerId = playerId;
    
    this.setupUI();
  }
  
  /**
   * Initialisiert die UI
   */
  private setupUI(): void {
    // Panel-Hintergrund
    const background = new PIXI.Graphics();
    background.rect(0, 0, 800, 600);
    background.fill({ color: 0x1a1a2e, alpha: 0.95 });
    background.stroke({ width: 2, color: 0x4a90e2 });
    this.container.addChild(background);
    
    // Titel
    this.titleText = new PIXI.Text({
      text: 'Charakter wechseln',
      style: {
        fontSize: 28,
        fill: 0xffd700,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    this.titleText.x = 20;
    this.titleText.y = 20;
    this.container.addChild(this.titleText);
    
    // Aktueller Charakter Info
    this.currentCharacterInfo = new PIXI.Text({
      text: '',
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: 'Arial'
      }
    });
    this.currentCharacterInfo.x = 20;
    this.currentCharacterInfo.y = 60;
    this.container.addChild(this.currentCharacterInfo);
    
    // Character List Container
    this.characterListContainer = new PIXI.Container();
    this.characterListContainer.x = 20;
    this.characterListContainer.y = 120;
    this.container.addChild(this.characterListContainer);
    
    // Close Button
    const closeButton = this.createButton('Schließen', 650, 550, () => {
      this.hide();
    });
    this.container.addChild(closeButton);
    
    this.updateCurrentCharacterInfo();
  }
  
  /**
   * Aktualisiert aktuelle Charakter-Info
   */
  private updateCurrentCharacterInfo(): void {
    const session = this.gameEngine.getRoleSwitchingSystem().getSession(this.currentPlayerId);
    if (!session || !session.currentCitizenId) {
      if (this.currentCharacterInfo) {
        this.currentCharacterInfo.text = 'Kein Charakter ausgewählt';
      }
      return;
    }
    
    const currentChar = this.gameEngine.getCitizenSystem().getCitizen(session.currentCitizenId);
    if (currentChar && this.currentCharacterInfo) {
      this.currentCharacterInfo.text = `Aktuell: ${currentChar.firstName} ${currentChar.lastName} (${this.translateProfession(currentChar.profession)}, ${currentChar.age} Jahre)`;
    }
  }
  
  /**
   * Zeigt verfügbare Charaktere
   */
  public showCharacters(filters?: any): void {
    if (!this.characterListContainer) return;
    
    // Lösche vorherige Liste
    this.characterListContainer.removeChildren();
    this.characterButtons = [];
    
    // Hole verfügbare Charaktere
    const roleSwitchingSystem = this.gameEngine.getRoleSwitchingSystem();
    const characters = roleSwitchingSystem.getPlayableCharacters(
      () => this.gameEngine.getCitizenSystem().getAllCitizens(),
      filters
    );
    
    // Zeige nur die ersten 10 Charaktere (mit Scroll könnte man mehr zeigen)
    const displayCharacters = characters.slice(0, 10);
    
    let yOffset = 0;
    for (const character of displayCharacters) {
      const charButton = this.createCharacterButton(character, yOffset);
      this.characterListContainer.addChild(charButton);
      this.characterButtons.push(charButton);
      yOffset += 40;
    }
    
    // Info-Text wenn keine Charaktere verfügbar
    if (displayCharacters.length === 0) {
      const noCharsText = new PIXI.Text({
        text: 'Keine verfügbaren Charaktere gefunden',
        style: {
          fontSize: 16,
          fill: 0xaaaaaa,
          fontFamily: 'Arial'
        }
      });
      this.characterListContainer.addChild(noCharsText);
    }
    
    // Update Info
    this.updateCurrentCharacterInfo();
  }
  
  /**
   * Zeigt empfohlene Charaktere
   */
  public showRecommendedCharacters(): void {
    if (!this.characterListContainer) return;
    
    this.characterListContainer.removeChildren();
    this.characterButtons = [];
    
    const roleSwitchingSystem = this.gameEngine.getRoleSwitchingSystem();
    const recommendedChars = roleSwitchingSystem.getRecommendedCharacters(
      this.currentPlayerId,
      (id) => this.gameEngine.getCitizenSystem().getCitizen(id),
      () => this.gameEngine.getCitizenSystem().getAllCitizens()
    );
    
    // Titel für empfohlene Charaktere
    const recommendedTitle = new PIXI.Text({
      text: 'Empfohlene Charaktere:',
      style: {
        fontSize: 18,
        fill: 0xffd700,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    this.characterListContainer.addChild(recommendedTitle);
    
    let yOffset = 30;
    for (const character of recommendedChars) {
      const charButton = this.createCharacterButton(character, yOffset);
      this.characterListContainer.addChild(charButton);
      this.characterButtons.push(charButton);
      yOffset += 40;
    }
    
    if (recommendedChars.length === 0) {
      const noCharsText = new PIXI.Text({
        text: 'Keine Empfehlungen verfügbar',
        style: {
          fontSize: 16,
          fill: 0xaaaaaa,
          fontFamily: 'Arial'
        }
      });
      noCharsText.y = 30;
      this.characterListContainer.addChild(noCharsText);
    }
  }
  
  /**
   * Erstellt Button für einen Charakter
   */
  private createCharacterButton(character: Citizen, yPos: number): PIXI.Container {
    const buttonContainer = new PIXI.Container();
    buttonContainer.y = yPos;
    
    // Hintergrund
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 740, 35);
    bg.fill({ color: 0x2a2a4a, alpha: 0.8 });
    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    
    // Hover-Effekt
    bg.on('pointerover', () => {
      bg.clear();
      bg.rect(0, 0, 740, 35);
      bg.fill({ color: 0x3a3a5a, alpha: 0.9 });
    });
    
    bg.on('pointerout', () => {
      bg.clear();
      bg.rect(0, 0, 740, 35);
      bg.fill({ color: 0x2a2a4a, alpha: 0.8 });
    });
    
    // Click-Handler
    bg.on('pointertap', () => {
      this.switchToCharacter(character);
    });
    
    buttonContainer.addChild(bg);
    
    // Charakter-Info Text
    const infoText = new PIXI.Text({
      text: `${character.firstName} ${character.lastName} - ${this.translateProfession(character.profession)} - ${character.age} Jahre - ${this.translateSocialClass(character.socialClass)} - ${character.regionId}`,
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontFamily: 'Arial'
      }
    });
    infoText.x = 10;
    infoText.y = 8;
    buttonContainer.addChild(infoText);
    
    // Wealth indicator
    const wealthText = new PIXI.Text({
      text: `💰 ${character.wealth}`,
      style: {
        fontSize: 12,
        fill: 0xffd700,
        fontFamily: 'Arial'
      }
    });
    wealthText.x = 600;
    wealthText.y = 10;
    buttonContainer.addChild(wealthText);
    
    return buttonContainer;
  }
  
  /**
   * Wechselt zu einem Charakter
   */
  private switchToCharacter(character: Citizen): void {
    const roleSwitchingSystem = this.gameEngine.getRoleSwitchingSystem();
    const citizenSystem = this.gameEngine.getCitizenSystem();
    
    const success = roleSwitchingSystem.switchRole(
      this.currentPlayerId,
      character.id,
      (id) => citizenSystem.getCitizen(id),
      (id, updates) => citizenSystem.updateCitizen(id, updates),
      this.gameEngine.getCurrentYear(),
      this.gameEngine.getCurrentMonth(),
      'Spielerwahl'
    );
    
    if (success) {
      console.log(`Erfolgreich zu ${character.firstName} ${character.lastName} gewechselt`);
      this.updateCurrentCharacterInfo();
      
      // Update Dynamic View
      const dynamicView = this.gameEngine.getDynamicGameView();
      dynamicView.updateView(character);
      
      // Trigger game engine event (if publicly accessible)
      // this.gameEngine.emit('characterSwitched', { character });
    } else {
      console.error('Charakterwechsel fehlgeschlagen');
    }
  }
  
  /**
   * Erstellt einen einfachen Button
   */
  private createButton(text: string, x: number, y: number, onClick: () => void): PIXI.Container {
    const buttonContainer = new PIXI.Container();
    buttonContainer.x = x;
    buttonContainer.y = y;
    
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 120, 35);
    bg.fill({ color: 0x4a90e2 });
    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    
    bg.on('pointerover', () => {
      bg.clear();
      bg.rect(0, 0, 120, 35);
      bg.fill({ color: 0x5aa0f2 });
    });
    
    bg.on('pointerout', () => {
      bg.clear();
      bg.rect(0, 0, 120, 35);
      bg.fill({ color: 0x4a90e2 });
    });
    
    bg.on('pointertap', onClick);
    
    buttonContainer.addChild(bg);
    
    const buttonText = new PIXI.Text({
      text,
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    buttonText.x = 60 - buttonText.width / 2;
    buttonText.y = 18 - buttonText.height / 2;
    buttonContainer.addChild(buttonText);
    
    return buttonContainer;
  }
  
  /**
   * Übersetzt Beruf
   */
  private translateProfession(profession: string): string {
    const translations: Record<string, string> = {
      farmer: 'Bauer',
      artisan: 'Handwerker',
      merchant: 'Händler',
      soldier: 'Soldat',
      scholar: 'Gelehrter',
      clergy: 'Geistlicher',
      noble: 'Adeliger',
      servant: 'Diener',
      laborer: 'Arbeiter',
      miner: 'Bergmann',
      fisherman: 'Fischer',
      blacksmith: 'Schmied',
      carpenter: 'Zimmermann',
      weaver: 'Weber',
      baker: 'Bäcker',
      brewer: 'Brauer',
      unemployed: 'Arbeitslos'
    };
    return translations[profession] || profession;
  }
  
  /**
   * Übersetzt soziale Klasse
   */
  private translateSocialClass(socialClass: string): string {
    const translations: Record<string, string> = {
      peasant: 'Bauer',
      middle: 'Mittelstand',
      noble: 'Adel',
      royal: 'Königlich'
    };
    return translations[socialClass] || socialClass;
  }
  
  /**
   * Zeigt das Panel
   */
  public show(): void {
    this.container.visible = true;
    this.showRecommendedCharacters();
  }
  
  /**
   * Versteckt das Panel
   */
  public hide(): void {
    this.container.visible = false;
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
