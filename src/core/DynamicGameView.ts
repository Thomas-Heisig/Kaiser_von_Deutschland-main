// src/core/DynamicGameView.ts

import { Citizen, Profession } from './CitizenSystem';
import * as PIXI from 'pixi.js';

/**
 * Ansichtstyp basierend auf Rolle
 */
export enum ViewType {
  POLITICAL_MAP = 'political_map', // Kaiser/König - Politische Karte
  LOCAL_FARM = 'local_farm', // Bauer - Lokales Feld, Dorf
  TRADE_ROUTES = 'trade_routes', // Händler - Handelswege, Märkte
  ESPIONAGE_NETWORK = 'espionage_network', // Spion - Geheimnetzwerk
  MILITARY_OVERVIEW = 'military_overview', // Soldat - Militärische Übersicht
  SCHOLARLY_LIBRARY = 'scholarly_library', // Gelehrter - Bibliothek, Forschung
  CHURCH_VIEW = 'church_view', // Geistlicher - Kirche, Gemeinde
  CRAFTSMAN_WORKSHOP = 'craftsman_workshop', // Handwerker - Werkstatt
  DEFAULT = 'default' // Standard-Ansicht
}

/**
 * Dashboard-Daten für aktuellen Charakter
 */
export interface CharacterDashboard {
  name: string;
  profession: string;
  age: number;
  wealth: number;
  reputation: number;
  health: number;
  happiness: number;
  needs: {
    food: number;
    shelter: number;
    safety: number;
  };
  resources: {
    gold: number;
    land?: number;
    influence?: number;
  };
  relationships: {
    family: number;
    friends: number;
    enemies: number;
  };
}

/**
 * Kontext-Daten für die Ansicht
 */
export interface ViewContext {
  viewType: ViewType;
  character: Citizen;
  dashboard: CharacterDashboard;
  relevantData: any; // Rollenspezifische Daten
}

/**
 * Dynamisches Spielfeld-System
 * Passt die Visualisierung basierend auf der aktuellen Rolle an
 */
export class DynamicGameView {
  private currentViewType: ViewType = ViewType.DEFAULT;
  private currentContext?: ViewContext;
  
  /**
   * Bestimmt Ansichtstyp basierend auf Charakter
   */
  public determineViewType(character: Citizen): ViewType {
    // Basierend auf Beruf
    switch (character.profession) {
      case 'noble':
        return character.socialClass === 'royal' ? ViewType.POLITICAL_MAP : ViewType.DEFAULT;
      case 'farmer':
        return ViewType.LOCAL_FARM;
      case 'merchant':
        return ViewType.TRADE_ROUTES;
      case 'soldier':
        return ViewType.MILITARY_OVERVIEW;
      case 'scholar':
        return ViewType.SCHOLARLY_LIBRARY;
      case 'clergy':
        return ViewType.CHURCH_VIEW;
      case 'artisan':
      case 'blacksmith':
      case 'carpenter':
      case 'weaver':
        return ViewType.CRAFTSMAN_WORKSHOP;
      default:
        return ViewType.DEFAULT;
    }
  }
  
  /**
   * Erstellt Dashboard-Daten für Charakter
   */
  public createDashboard(character: Citizen): CharacterDashboard {
    return {
      name: `${character.firstName} ${character.lastName}`,
      profession: this.translateProfession(character.profession),
      age: character.age,
      wealth: character.wealth,
      reputation: character.reputation,
      health: character.health.overall,
      happiness: character.happiness,
      needs: {
        food: character.needs.food,
        shelter: character.needs.shelter,
        safety: character.needs.safety
      },
      resources: {
        gold: character.wealth
      },
      relationships: {
        family: character.familyRelations.length,
        friends: character.socialRelations.filter(r => r.strength > 0).length,
        enemies: character.socialRelations.filter(r => r.strength < 0).length
      }
    };
  }
  
  /**
   * Übersetzt Beruf ins Deutsche
   */
  private translateProfession(profession: Profession): string {
    const translations: Record<Profession, string> = {
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
   * Aktualisiert die Ansicht für neuen Charakter
   */
  public updateView(character: Citizen, additionalData?: any): ViewContext {
    this.currentViewType = this.determineViewType(character);
    
    const dashboard = this.createDashboard(character);
    
    this.currentContext = {
      viewType: this.currentViewType,
      character,
      dashboard,
      relevantData: this.collectRelevantData(character, this.currentViewType, additionalData)
    };
    
    console.log(`Ansicht aktualisiert: ${this.currentViewType} für ${character.firstName} ${character.lastName}`);
    
    return this.currentContext;
  }
  
  /**
   * Sammelt relevante Daten basierend auf Ansichtstyp
   */
  private collectRelevantData(character: Citizen, viewType: ViewType, additionalData?: any): any {
    const data: any = {};
    
    switch (viewType) {
      case ViewType.POLITICAL_MAP:
        data.title = 'Politische Übersicht';
        data.showDiplomacy = true;
        data.showTerritories = true;
        data.showAlliances = true;
        break;
        
      case ViewType.LOCAL_FARM:
        data.title = 'Bauernhof';
        data.showFields = true;
        data.showCrops = true;
        data.showAnimals = additionalData?.animals || [];
        data.season = additionalData?.season || 'Frühling';
        break;
        
      case ViewType.TRADE_ROUTES:
        data.title = 'Handelsrouten';
        data.showTradeRoutes = true;
        data.showMarkets = true;
        data.showGoods = true;
        data.currentGoods = additionalData?.goods || [];
        break;
        
      case ViewType.ESPIONAGE_NETWORK:
        data.title = 'Spionage-Netzwerk';
        data.showAgents = true;
        data.showIntelligence = true;
        data.showTargets = true;
        break;
        
      case ViewType.MILITARY_OVERVIEW:
        data.title = 'Militärische Übersicht';
        data.showUnits = true;
        data.showBattles = true;
        data.showSupplyLines = true;
        data.rank = this.calculateMilitaryRank(character);
        break;
        
      case ViewType.SCHOLARLY_LIBRARY:
        data.title = 'Bibliothek';
        data.showBooks = true;
        data.showResearch = true;
        data.showStudents = true;
        data.researchProgress = additionalData?.researchProgress || 0;
        break;
        
      case ViewType.CHURCH_VIEW:
        data.title = 'Kirche';
        data.showCongregation = true;
        data.showFaith = true;
        data.showReligiousEvents = true;
        data.pietyLevel = character.needs.spiritual;
        break;
        
      case ViewType.CRAFTSMAN_WORKSHOP:
        data.title = 'Werkstatt';
        data.showTools = true;
        data.showProjects = true;
        data.showCustomers = true;
        data.skillLevel = character.skills.craftsmanship;
        break;
        
      default:
        data.title = 'Übersicht';
        data.showGeneral = true;
    }
    
    return data;
  }
  
  /**
   * Berechnet militärischen Rang
   */
  private calculateMilitaryRank(character: Citizen): string {
    const combatSkill = character.skills.combat;
    
    if (combatSkill >= 90) return 'General';
    if (combatSkill >= 70) return 'Hauptmann';
    if (combatSkill >= 50) return 'Leutnant';
    if (combatSkill >= 30) return 'Unteroffizier';
    return 'Soldat';
  }
  
  /**
   * Rendert die Ansicht (PixiJS)
   */
  public renderView(container: PIXI.Container, width: number, height: number): void {
    if (!this.currentContext) {
      return;
    }
    
    // Lösche vorherige Inhalte
    container.removeChildren();
    
    // Render basierend auf View Type
    switch (this.currentContext.viewType) {
      case ViewType.POLITICAL_MAP:
        this.renderPoliticalMap(container, width, height);
        break;
      case ViewType.LOCAL_FARM:
        this.renderLocalFarm(container, width, height);
        break;
      case ViewType.TRADE_ROUTES:
        this.renderTradeRoutes(container, width, height);
        break;
      case ViewType.MILITARY_OVERVIEW:
        this.renderMilitaryOverview(container, width, height);
        break;
      default:
        this.renderDefaultView(container, width, height);
    }
  }
  
  /**
   * Rendert politische Karte (Kaiser/König)
   */
  private renderPoliticalMap(container: PIXI.Container, width: number, height: number): void {
    const graphics = new PIXI.Graphics();
    
    // Hintergrund
    graphics.rect(0, 0, width, height);
    graphics.fill(0x1a3a1a);
    
    // Titel
    const title = new PIXI.Text({
      text: 'Politische Karte',
      style: {
        fontSize: 24,
        fill: 0xffd700,
        fontFamily: 'Arial'
      }
    });
    title.x = width / 2 - title.width / 2;
    title.y = 20;
    
    container.addChild(graphics);
    container.addChild(title);
    
    // Territorien (Platzhalter)
    const info = new PIXI.Text({
      text: 'Hier werden Territorien, Diplomatie und Allianzen angezeigt',
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: 'Arial'
      }
    });
    info.x = width / 2 - info.width / 2;
    info.y = height / 2;
    
    container.addChild(info);
  }
  
  /**
   * Rendert lokales Feld (Bauer)
   */
  private renderLocalFarm(container: PIXI.Container, width: number, height: number): void {
    const graphics = new PIXI.Graphics();
    
    // Hintergrund (Grün für Felder)
    graphics.rect(0, 0, width, height);
    graphics.fill(0x228b22);
    
    // Titel
    const title = new PIXI.Text({
      text: 'Dein Bauernhof',
      style: {
        fontSize: 24,
        fill: 0xffffff,
        fontFamily: 'Arial'
      }
    });
    title.x = width / 2 - title.width / 2;
    title.y = 20;
    
    container.addChild(graphics);
    container.addChild(title);
    
    // Felder (Platzhalter)
    for (let i = 0; i < 4; i++) {
      const field = new PIXI.Graphics();
      field.rect(50 + i * 150, 100, 120, 120);
      field.fill(0x8b4513);
      container.addChild(field);
      
      const label = new PIXI.Text({
        text: `Feld ${i + 1}`,
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Arial'
        }
      });
      label.x = 50 + i * 150 + 10;
      label.y = 110;
      container.addChild(label);
    }
  }
  
  /**
   * Rendert Handelsrouten (Händler)
   */
  private renderTradeRoutes(container: PIXI.Container, width: number, height: number): void {
    const graphics = new PIXI.Graphics();
    
    // Hintergrund
    graphics.rect(0, 0, width, height);
    graphics.fill(0x2a2a4a);
    
    // Titel
    const title = new PIXI.Text({
      text: 'Handelsrouten & Märkte',
      style: {
        fontSize: 24,
        fill: 0xffd700,
        fontFamily: 'Arial'
      }
    });
    title.x = width / 2 - title.width / 2;
    title.y = 20;
    
    container.addChild(graphics);
    container.addChild(title);
    
    // Handelswege (Platzhalter)
    const info = new PIXI.Text({
      text: 'Hier werden Handelswege, Märkte und Waren angezeigt',
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: 'Arial'
      }
    });
    info.x = width / 2 - info.width / 2;
    info.y = height / 2;
    
    container.addChild(info);
  }
  
  /**
   * Rendert militärische Übersicht (Soldat)
   */
  private renderMilitaryOverview(container: PIXI.Container, width: number, height: number): void {
    const graphics = new PIXI.Graphics();
    
    // Hintergrund (Dunkelrot)
    graphics.rect(0, 0, width, height);
    graphics.fill(0x4a1a1a);
    
    // Titel
    const title = new PIXI.Text({
      text: 'Militärische Übersicht',
      style: {
        fontSize: 24,
        fill: 0xff4444,
        fontFamily: 'Arial'
      }
    });
    title.x = width / 2 - title.width / 2;
    title.y = 20;
    
    container.addChild(graphics);
    container.addChild(title);
    
    if (this.currentContext) {
      const rank = new PIXI.Text({
        text: `Rang: ${this.currentContext.relevantData.rank || 'Soldat'}`,
        style: {
          fontSize: 18,
          fill: 0xffffff,
          fontFamily: 'Arial'
        }
      });
      rank.x = width / 2 - rank.width / 2;
      rank.y = 80;
      container.addChild(rank);
    }
  }
  
  /**
   * Rendert Standard-Ansicht
   */
  private renderDefaultView(container: PIXI.Container, width: number, height: number): void {
    const graphics = new PIXI.Graphics();
    
    // Hintergrund
    graphics.rect(0, 0, width, height);
    graphics.fill(0x2a2a2a);
    
    container.addChild(graphics);
    
    if (this.currentContext) {
      const title = new PIXI.Text({
        text: `${this.currentContext.dashboard.name}`,
        style: {
          fontSize: 24,
          fill: 0xffffff,
          fontFamily: 'Arial'
        }
      });
      title.x = width / 2 - title.width / 2;
      title.y = 20;
      
      container.addChild(title);
    }
  }
  
  /**
   * Holt aktuellen Kontext
   */
  public getCurrentContext(): ViewContext | undefined {
    return this.currentContext;
  }
  
  /**
   * Holt aktuellen Ansichtstyp
   */
  public getCurrentViewType(): ViewType {
    return this.currentViewType;
  }
  
  /**
   * Erstellt Snapshot für Speichern
   */
  public createSnapshot(): any {
    return {
      currentViewType: this.currentViewType,
      // Context wird nicht gespeichert, da er aus dem Charakter neu erstellt wird
    };
  }
  
  /**
   * Lädt Snapshot
   */
  public loadSnapshot(snapshot: any): void {
    this.currentViewType = snapshot.currentViewType || ViewType.DEFAULT;
    this.currentContext = undefined; // Wird beim nächsten switchToCharacter neu erstellt
  }
}
