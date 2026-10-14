// src/ui/PopulationVisualization.ts

import * as PIXI from 'pixi.js';
import type { CitizenSystem, Citizen } from '../core/CitizenSystem';
import type { AgePyramid } from '../core/DemographicSystem';

/**
 * Visualisierung der Bevölkerungsdynamik mit PixiJS
 */
export class PopulationVisualization {
  private app: PIXI.Application;
  private container: HTMLElement;
  private citizenSprites: Map<string, PIXI.Graphics> = new Map();
  private mainContainer: PIXI.Container;
  
  constructor(containerId: string, width: number = 800, height: number = 600) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container with id '${containerId}' not found`);
    }
    
    this.container = element;
    
    // Erstelle PixiJS Application
    this.app = new PIXI.Application();
    this.mainContainer = new PIXI.Container();
    
    this.initialize(width, height);
  }
  
  /**
   * Initialisiert die PixiJS Application
   */
  private async initialize(width: number, height: number): Promise<void> {
    await this.app.init({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    this.container.appendChild(this.app.canvas);
    this.app.stage.addChild(this.mainContainer);
  }
  
  /**
   * Rendert die Alterspyramide
   */
  public renderAgePyramid(pyramid: AgePyramid): void {
    // Lösche vorherige Darstellung
    this.mainContainer.removeChildren();
    
    const pyramidContainer = new PIXI.Container();
    this.mainContainer.addChild(pyramidContainer);
    
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const barHeight = height / (pyramid.male.length + 2);
    const centerX = width / 2;
    
    // Titel
    const title = new PIXI.Text({
      text: 'Alterspyramide',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: 'bold'
      }
    });
    title.x = centerX - title.width / 2;
    title.y = 10;
    pyramidContainer.addChild(title);
    
    // Maximale Breite für Skalierung
    const maxPercentage = Math.max(
      ...pyramid.male.map(g => g.percentage),
      ...pyramid.female.map(g => g.percentage)
    );
    const maxBarWidth = (width / 2) - 100;
    
    // Zeichne Balken
    for (let i = 0; i < pyramid.male.length; i++) {
      const y = 60 + i * barHeight;
      
      // Männer (links, blau)
      const maleBar = new PIXI.Graphics();
      const maleWidth = (pyramid.male[i].percentage / maxPercentage) * maxBarWidth;
      maleBar.rect(centerX - maleWidth, y, maleWidth, barHeight - 4);
      maleBar.fill({ color: 0x4a90e2 });
      pyramidContainer.addChild(maleBar);
      
      // Frauen (rechts, rosa)
      const femaleBar = new PIXI.Graphics();
      const femaleWidth = (pyramid.female[i].percentage / maxPercentage) * maxBarWidth;
      femaleBar.rect(centerX, y, femaleWidth, barHeight - 4);
      femaleBar.fill({ color: 0xe94b8a });
      pyramidContainer.addChild(femaleBar);
      
      // Altersgruppe Label
      const ageLabel = new PIXI.Text({
        text: `${pyramid.male[i].min}-${pyramid.male[i].max === 999 ? '+' : pyramid.male[i].max}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0xffffff
        }
      });
      ageLabel.x = centerX - ageLabel.width - maleWidth - 5;
      ageLabel.y = y + (barHeight - 4) / 2 - 6;
      pyramidContainer.addChild(ageLabel);
      
      // Anzahl Label (Männer)
      const maleCountLabel = new PIXI.Text({
        text: pyramid.male[i].count.toString(),
        style: {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: 0xffffff
        }
      });
      maleCountLabel.x = centerX - maleWidth + 5;
      maleCountLabel.y = y + (barHeight - 4) / 2 - 5;
      pyramidContainer.addChild(maleCountLabel);
      
      // Anzahl Label (Frauen)
      const femaleCountLabel = new PIXI.Text({
        text: pyramid.female[i].count.toString(),
        style: {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: 0xffffff
        }
      });
      femaleCountLabel.x = centerX + 5;
      femaleCountLabel.y = y + (barHeight - 4) / 2 - 5;
      pyramidContainer.addChild(femaleCountLabel);
    }
    
    // Legende
    const legend = new PIXI.Container();
    
    const maleSquare = new PIXI.Graphics();
    maleSquare.rect(0, 0, 20, 20);
    maleSquare.fill({ color: 0x4a90e2 });
    legend.addChild(maleSquare);
    
    const maleLabel = new PIXI.Text({
      text: 'Männlich',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff
      }
    });
    maleLabel.x = 25;
    maleLabel.y = 2;
    legend.addChild(maleLabel);
    
    const femaleSquare = new PIXI.Graphics();
    femaleSquare.rect(120, 0, 20, 20);
    femaleSquare.fill({ color: 0xe94b8a });
    legend.addChild(femaleSquare);
    
    const femaleLabel = new PIXI.Text({
      text: 'Weiblich',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff
      }
    });
    femaleLabel.x = 145;
    femaleLabel.y = 2;
    legend.addChild(femaleLabel);
    
    legend.x = centerX - 120;
    legend.y = height - 40;
    pyramidContainer.addChild(legend);
  }
  
  /**
   * Rendert eine Karte mit Bürgern als Punkte
   */
  public renderCitizenMap(
    citizenSystem: CitizenSystem,
    regionId?: string
  ): void {
    this.mainContainer.removeChildren();
    
    const mapContainer = new PIXI.Container();
    this.mainContainer.addChild(mapContainer);
    
    const citizens = regionId 
      ? citizenSystem.getCitizensByRegion(regionId).filter(c => c.isAlive)
      : citizenSystem.getAliveCitizens();
    
    // Titel
    const title = new PIXI.Text({
      text: `Bürger-Karte (${citizens.length} Bürger)`,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: 'bold'
      }
    });
    title.x = 10;
    title.y = 10;
    mapContainer.addChild(title);
    
    // Zeichne jeden Bürger als Punkt
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    
    citizens.forEach((citizen) => {
      const sprite = this.createCitizenSprite(citizen);
      
      // Verteile Bürger zufällig aber konsistent
      const seed = this.hashCode(citizen.id);
      sprite.x = 50 + ((seed % (width - 100)));
      sprite.y = 60 + ((Math.floor(seed / width) % (height - 120)));
      
      mapContainer.addChild(sprite);
      this.citizenSprites.set(citizen.id, sprite);
    });
  }
  
  /**
   * Erstellt ein Sprite für einen Bürger
   */
  private createCitizenSprite(citizen: Citizen): PIXI.Graphics {
    const sprite = new PIXI.Graphics();
    
    // Farbe basierend auf Eigenschaften
    let color = 0xffffff;
    
    if (citizen.isPlayerCharacter) {
      color = 0xffd700; // Gold für Spieler-Charaktere
    } else if (citizen.socialClass === 'noble') {
      color = 0x9b59b6; // Lila für Adelige
    } else if (citizen.socialClass === 'middle') {
      color = 0x3498db; // Blau für Mittelklasse
    } else {
      color = 0x95a5a6; // Grau für Bauern
    }
    
    // Größe basierend auf Alter
    const size = citizen.age < 18 ? 3 : (citizen.age > 60 ? 5 : 4);
    
    sprite.circle(0, 0, size);
    sprite.fill({ color });
    
    // Interaktivität
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';
    
    sprite.on('pointerover', () => {
      sprite.scale.set(1.5);
      this.showCitizenTooltip(citizen);
    });
    
    sprite.on('pointerout', () => {
      sprite.scale.set(1);
      this.hideTooltip();
    });
    
    return sprite;
  }
  
  /**
   * Zeigt Tooltip für einen Bürger
   */
  private showCitizenTooltip(citizen: Citizen): void {
    // Erstelle Tooltip-Container
    const tooltip = new PIXI.Container();
    tooltip.name = 'tooltip';
    
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 200, 120);
    bg.fill({ color: 0x2c3e50 });
    bg.stroke({ width: 2, color: 0xecf0f1 });
    tooltip.addChild(bg);
    
    const text = new PIXI.Text({
      text: `${citizen.firstName} ${citizen.lastName}\n` +
            `Alter: ${citizen.age}\n` +
            `Beruf: ${citizen.profession}\n` +
            `Klasse: ${citizen.socialClass}\n` +
            `Glück: ${citizen.happiness}/100\n` +
            `Gesundheit: ${citizen.health.overall}/100`,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 190
      }
    });
    text.x = 5;
    text.y = 5;
    tooltip.addChild(text);
    
    tooltip.x = 10;
    tooltip.y = 10;
    
    this.mainContainer.addChild(tooltip);
  }
  
  /**
   * Versteckt Tooltip
   */
  private hideTooltip(): void {
    const tooltip = this.mainContainer.getChildByName('tooltip');
    if (tooltip) {
      this.mainContainer.removeChild(tooltip);
    }
  }
  
  /**
   * Hash-Funktion für konsistente Positionierung
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Aktualisiert die Visualisierung
   */
  public update(citizenSystem: CitizenSystem): void {
    // Aktualisiere Citizen-Sprites
    for (const [citizenId, sprite] of this.citizenSprites.entries()) {
      const citizen = citizenSystem.getCitizen(citizenId);
      
      if (!citizen || !citizen.isAlive) {
        // Entferne tote Bürger
        sprite.parent?.removeChild(sprite);
        this.citizenSprites.delete(citizenId);
      }
    }
  }
  
  /**
   * Größe ändern (responsive)
   */
  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }
  
  /**
   * Zerstört die Visualisierung
   */
  public destroy(): void {
    this.app.destroy(true, { children: true, texture: true });
    this.citizenSprites.clear();
  }
}
