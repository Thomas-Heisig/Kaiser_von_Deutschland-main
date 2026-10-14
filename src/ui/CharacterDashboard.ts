// src/ui/CharacterDashboard.ts

import * as PIXI from 'pixi.js';
import { GameEngine } from '../core/GameEngine';
import { Citizen } from '../core/CitizenSystem';

/**
 * Dashboard für den aktuell gespielten Charakter
 */
export class CharacterDashboard {
  private container: PIXI.Container;
  private gameEngine: GameEngine;
  private playerId: string;
  
  // UI Elements
  private nameText?: PIXI.Text;
  private professionText?: PIXI.Text;
  private statsContainer?: PIXI.Container;
  private needsContainer?: PIXI.Container;
  
  constructor(gameEngine: GameEngine, playerId: string) {
    this.container = new PIXI.Container();
    this.gameEngine = gameEngine;
    this.playerId = playerId;
    
    this.setupUI();
  }
  
  /**
   * Initialisiert die UI
   */
  private setupUI(): void {
    // Hintergrund
    const background = new PIXI.Graphics();
    background.rect(0, 0, 350, 250);
    background.fill({ color: 0x1a1a2e, alpha: 0.9 });
    background.stroke({ width: 2, color: 0xffd700 });
    this.container.addChild(background);
    
    // Titel
    const title = new PIXI.Text({
      text: 'Dein Charakter',
      style: {
        fontSize: 20,
        fill: 0xffd700,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    title.x = 10;
    title.y = 10;
    this.container.addChild(title);
    
    // Name
    this.nameText = new PIXI.Text({
      text: '',
      style: {
        fontSize: 18,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    this.nameText.x = 10;
    this.nameText.y = 40;
    this.container.addChild(this.nameText);
    
    // Beruf & Alter
    this.professionText = new PIXI.Text({
      text: '',
      style: {
        fontSize: 14,
        fill: 0xaaaaaa,
        fontFamily: 'Arial'
      }
    });
    this.professionText.x = 10;
    this.professionText.y = 65;
    this.container.addChild(this.professionText);
    
    // Stats Container
    this.statsContainer = new PIXI.Container();
    this.statsContainer.x = 10;
    this.statsContainer.y = 95;
    this.container.addChild(this.statsContainer);
    
    // Needs Container
    this.needsContainer = new PIXI.Container();
    this.needsContainer.x = 10;
    this.needsContainer.y = 170;
    this.container.addChild(this.needsContainer);
  }
  
  /**
   * Aktualisiert das Dashboard
   */
  public update(): void {
    const session = this.gameEngine.getRoleSwitchingSystem().getSession(this.playerId);
    if (!session || !session.currentCitizenId) {
      this.showNoCharacter();
      return;
    }
    
    const character = this.gameEngine.getCitizenSystem().getCitizen(session.currentCitizenId);
    if (!character) {
      this.showNoCharacter();
      return;
    }
    
    this.showCharacter(character);
  }
  
  /**
   * Zeigt "Kein Charakter"
   */
  private showNoCharacter(): void {
    if (this.nameText) {
      this.nameText.text = 'Kein Charakter';
    }
    if (this.professionText) {
      this.professionText.text = 'Wähle einen Charakter aus';
    }
    if (this.statsContainer) {
      this.statsContainer.removeChildren();
    }
    if (this.needsContainer) {
      this.needsContainer.removeChildren();
    }
  }
  
  /**
   * Zeigt Charakter-Informationen
   */
  private showCharacter(character: Citizen): void {
    // Name
    if (this.nameText) {
      this.nameText.text = `${character.firstName} ${character.lastName}`;
    }
    
    // Beruf & Alter
    if (this.professionText) {
      this.professionText.text = `${this.translateProfession(character.profession)}, ${character.age} Jahre, ${this.translateSocialClass(character.socialClass)}`;
    }
    
    // Stats
    if (this.statsContainer) {
      this.statsContainer.removeChildren();
      
      const stats = [
        { label: '💰 Vermögen', value: character.wealth, color: 0xffd700 },
        { label: '⭐ Ruf', value: character.reputation, max: 100, color: 0x4a90e2 },
        { label: '❤️ Gesundheit', value: character.health.overall, max: 100, color: 0xff4444 },
        { label: '😊 Glück', value: character.happiness, max: 100, color: 0x44ff44 }
      ];
      
      let yOffset = 0;
      for (const stat of stats) {
        const statText = new PIXI.Text({
          text: `${stat.label}: ${stat.value}${stat.max ? `/${stat.max}` : ''}`,
          style: {
            fontSize: 12,
            fill: stat.color,
            fontFamily: 'Arial'
          }
        });
        statText.y = yOffset;
        this.statsContainer.addChild(statText);
        
        // Progress Bar
        if (stat.max) {
          const barBg = new PIXI.Graphics();
          barBg.rect(150, yOffset + 2, 150, 10);
          barBg.fill({ color: 0x333333 });
          this.statsContainer.addChild(barBg);
          
          const barFill = new PIXI.Graphics();
          const fillWidth = (stat.value / stat.max) * 150;
          barFill.rect(150, yOffset + 2, fillWidth, 10);
          barFill.fill({ color: stat.color });
          this.statsContainer.addChild(barFill);
        }
        
        yOffset += 18;
      }
    }
    
    // Needs
    if (this.needsContainer) {
      this.needsContainer.removeChildren();
      
      const needsTitle = new PIXI.Text({
        text: 'Bedürfnisse:',
        style: {
          fontSize: 14,
          fill: 0xffd700,
          fontFamily: 'Arial',
          fontWeight: 'bold'
        }
      });
      this.needsContainer.addChild(needsTitle);
      
      const needs = [
        { icon: '🍞', label: 'Nahrung', value: character.needs.food },
        { icon: '🏠', label: 'Unterkunft', value: character.needs.shelter },
        { icon: '🛡️', label: 'Sicherheit', value: character.needs.safety }
      ];
      
      let xOffset = 0;
      for (const need of needs) {
        const needBar = this.createNeedBar(need.icon, need.value);
        needBar.x = xOffset;
        needBar.y = 20;
        this.needsContainer.addChild(needBar);
        xOffset += 110;
      }
    }
  }
  
  /**
   * Erstellt eine Bedürfnis-Anzeige
   */
  private createNeedBar(icon: string, value: number): PIXI.Container {
    const container = new PIXI.Container();
    
    // Icon
    const iconText = new PIXI.Text({
      text: icon,
      style: {
        fontSize: 16,
        fontFamily: 'Arial'
      }
    });
    container.addChild(iconText);
    
    // Bar Background
    const barBg = new PIXI.Graphics();
    barBg.rect(25, 5, 70, 10);
    barBg.fill({ color: 0x333333 });
    container.addChild(barBg);
    
    // Bar Fill
    const barFill = new PIXI.Graphics();
    const fillWidth = (value / 100) * 70;
    const color = value > 66 ? 0x44ff44 : value > 33 ? 0xffaa44 : 0xff4444;
    barFill.rect(25, 5, fillWidth, 10);
    barFill.fill({ color });
    container.addChild(barFill);
    
    return container;
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
   * Holt den Container
   */
  public getContainer(): PIXI.Container {
    return this.container;
  }
  
  /**
   * Zerstört das Dashboard
   */
  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
