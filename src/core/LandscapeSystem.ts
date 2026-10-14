// src/core/LandscapeSystem.ts

import type { TerrainType } from './Kingdom';

/**
 * Landschaftsveränderungstyp
 */
export type LandscapeChangeType =
  | 'deforestation' // Entwaldung
  | 'reforestation' // Wiederaufforstung
  | 'river_diversion' // Flussumlenkung
  | 'soil_erosion' // Bodenerosion
  | 'soil_improvement' // Bodenverbesserung
  | 'urbanization' // Verstädterung
  | 'land_reclamation' // Landgewinnung
  | 'desertification' // Wüstenbildung
  | 'marsh_drainage' // Trockenlegung von Sümpfen
  | 'terraforming'; // Terraforming

/**
 * Bodenqualitäts-Stufen
 */
export type SoilQuality = 'depleted' | 'poor' | 'average' | 'good' | 'excellent';

/**
 * Fluss-Daten
 */
export interface River {
  id: string;
  name: string;
  length: number; // in km
  flowRate: number; // m³/s
  pollution: number; // 0-100
  navigable: boolean;
  floodRisk: number; // 0-1
  course: Array<{ x: number; y: number }>; // Simplified coordinates
  hasChanged: boolean;
  lastChangeYear: number;
}

/**
 * Wald-Daten
 */
export interface Forest {
  id: string;
  name: string;
  area: number; // in hectares
  density: number; // 0-100
  age: number; // average tree age in years
  biodiversity: number; // 0-100
  healthStatus: number; // 0-100
  lastHarvestYear: number;
  protectedArea: boolean;
}

/**
 * Boden-Tile (für Rasterkarte)
 */
export interface SoilTile {
  x: number;
  y: number;
  terrainType: TerrainType;
  quality: SoilQuality;
  fertility: number; // 0-100
  erosionLevel: number; // 0-100
  moisture: number; // 0-100
  organicMatter: number; // 0-100
  lastFarmedYear: number;
  pollutionLevel: number; // 0-100
}

/**
 * Landnutzungs-Daten
 */
export interface LandUse {
  agricultural: number; // %
  forest: number; // %
  urban: number; // %
  water: number; // %
  wasteland: number; // %
  protected: number; // %
}

/**
 * Landschaftsveränderungs-Event
 */
export interface LandscapeChange {
  id: string;
  type: LandscapeChangeType;
  year: number;
  month: number;
  location: { x: number; y: number };
  area: number; // in hectares
  cause: 'natural' | 'human' | 'disaster' | 'policy';
  impact: {
    foodProduction?: number;
    happiness?: number;
    biodiversity?: number;
    floodRisk?: number;
  };
  reversible: boolean;
  cost?: number; // Cost to reverse or mitigate
}

/**
 * Terraforming-Projekt
 */
export interface TerraformingProject {
  id: string;
  name: string;
  type: 'land_reclamation' | 'mountain_leveling' | 'marsh_drainage' | 'irrigation';
  startYear: number;
  estimatedDuration: number; // in years
  progress: number; // 0-100
  cost: number;
  area: number; // in hectares
  location: { x: number; y: number };
  completed: boolean;
}

/**
 * Landschafts-System
 * Verwaltet Terrain-Änderungen, Entwaldung, Bodenerosion, Flüsse, etc.
 */
export class LandscapeSystem {
  private forests: Map<string, Forest> = new Map();
  private rivers: Map<string, River> = new Map();
  private soilGrid: SoilTile[][] = [];
  private landscapeChanges: LandscapeChange[] = [];
  private terraformingProjects: Map<string, TerraformingProject> = new Map();
  private landUse: LandUse;
  private gridSize: number;
  private totalArea: number; // in km²

  constructor(totalArea: number = 10000, gridSize: number = 50) {
    this.totalArea = totalArea;
    this.gridSize = gridSize;
    
    this.landUse = {
      agricultural: 40,
      forest: 30,
      urban: 5,
      water: 5,
      wasteland: 15,
      protected: 5
    };

    this.initializeSoilGrid();
    this.initializeForests();
    this.initializeRivers();
  }

  /**
   * Initialisiert das Boden-Raster
   */
  private initializeSoilGrid(): void {
    for (let x = 0; x < this.gridSize; x++) {
      this.soilGrid[x] = [];
      for (let y = 0; y < this.gridSize; y++) {
        this.soilGrid[x][y] = {
          x,
          y,
          terrainType: this.getRandomTerrainType(),
          quality: 'average',
          fertility: 60 + Math.random() * 30,
          erosionLevel: Math.random() * 20,
          moisture: 50 + Math.random() * 30,
          organicMatter: 40 + Math.random() * 40,
          lastFarmedYear: 0,
          pollutionLevel: Math.random() * 10
        };
      }
    }
  }

  /**
   * Gibt einen zufälligen Terrain-Typ zurück
   */
  private getRandomTerrainType(): TerrainType {
    const types: TerrainType[] = ['plains', 'forests', 'mountains', 'hills', 'wetlands', 'desert'];
    const weights = [30, 25, 15, 15, 10, 5]; // Prozentuale Verteilung
    
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    
    for (let i = 0; i < types.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return types[i];
    }
    
    return 'plains';
  }

  /**
   * Initialisiert Wälder
   */
  private initializeForests(): void {
    const forestCount = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < forestCount; i++) {
      const forest: Forest = {
        id: `forest-${i}`,
        name: `Wald ${i + 1}`,
        area: 1000 + Math.random() * 5000,
        density: 60 + Math.random() * 40,
        age: 50 + Math.random() * 200,
        biodiversity: 60 + Math.random() * 40,
        healthStatus: 80 + Math.random() * 20,
        lastHarvestYear: 0,
        protectedArea: Math.random() < 0.2
      };
      this.forests.set(forest.id, forest);
    }
  }

  /**
   * Initialisiert Flüsse
   */
  private initializeRivers(): void {
    const riverCount = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < riverCount; i++) {
      const course: Array<{ x: number; y: number }> = [];
      const segments = 10 + Math.floor(Math.random() * 20);
      
      for (let j = 0; j < segments; j++) {
        course.push({
          x: Math.random() * this.gridSize,
          y: (j / segments) * this.gridSize
        });
      }
      
      const river: River = {
        id: `river-${i}`,
        name: `Fluss ${i + 1}`,
        length: 100 + Math.random() * 400,
        flowRate: 50 + Math.random() * 200,
        pollution: Math.random() * 30,
        navigable: Math.random() < 0.5,
        floodRisk: 0.1 + Math.random() * 0.3,
        course,
        hasChanged: false,
        lastChangeYear: 0
      };
      this.rivers.set(river.id, river);
    }
  }

  /**
   * Aktualisiert Landschaft für ein Jahr
   */
  public updateYear(
    year: number, 
    population: number,
    industrialization: number,
    climateTemperature: number
  ): void {
    // Update soil quality
    this.updateSoilQuality(year, climateTemperature);
    
    // Update forests
    this.updateForests(year, population, industrialization);
    
    // Update rivers
    this.updateRivers(year, climateTemperature);
    
    // Check for natural landscape changes
    this.checkNaturalChanges(year, climateTemperature);
    
    // Update terraforming projects
    this.updateTerraformingProjects(year);
    
    // Update land use statistics
    this.updateLandUse();
  }

  /**
   * Aktualisiert Bodenqualität
   */
  private updateSoilQuality(year: number, climateTemperature: number): void {
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const tile = this.soilGrid[x][y];
        
        // Natural recovery if not farmed recently
        const yearsSinceFarming = year - tile.lastFarmedYear;
        if (yearsSinceFarming > 5) {
          tile.fertility = Math.min(100, tile.fertility + 0.5);
          tile.organicMatter = Math.min(100, tile.organicMatter + 0.3);
        }
        
        // Erosion increases with poor management
        if (tile.erosionLevel > 50) {
          tile.fertility = Math.max(0, tile.fertility - 0.2);
        }
        
        // Climate impact
        if (climateTemperature > 1.5) {
          // Extreme heat reduces moisture and can cause desertification
          tile.moisture = Math.max(0, tile.moisture - climateTemperature * 0.1);
          if (tile.moisture < 20 && tile.terrainType !== 'desert') {
            // Risk of desertification
            if (Math.random() < 0.01) {
              this.convertToDesert(x, y, year);
            }
          }
        }
        
        // Update quality rating
        tile.quality = this.calculateSoilQuality(tile);
      }
    }
  }

  /**
   * Berechnet Bodenqualität basierend auf Eigenschaften
   */
  private calculateSoilQuality(tile: SoilTile): SoilQuality {
    const score = (tile.fertility + tile.organicMatter) / 2 - tile.erosionLevel - tile.pollutionLevel;
    
    if (score < 20) return 'depleted';
    if (score < 40) return 'poor';
    if (score < 60) return 'average';
    if (score < 80) return 'good';
    return 'excellent';
  }

  /**
   * Konvertiert Tile zu Wüste
   */
  private convertToDesert(x: number, y: number, year: number): void {
    const tile = this.soilGrid[x][y];
    tile.terrainType = 'desert';
    tile.fertility = Math.max(0, tile.fertility - 50);
    tile.quality = 'depleted';
    
    this.landscapeChanges.push({
      id: `change-${year}-${x}-${y}`,
      type: 'desertification',
      year,
      month: 1,
      location: { x, y },
      area: (this.totalArea / (this.gridSize * this.gridSize)),
      cause: 'natural',
      impact: {
        foodProduction: -10,
        biodiversity: -5,
        happiness: -2
      },
      reversible: true,
      cost: 5000
    });
  }

  /**
   * Aktualisiert Wälder
   */
  private updateForests(year: number, population: number, industrialization: number): void {
    this.forests.forEach(forest => {
      // Natural growth
      if (!forest.protectedArea) {
        forest.age += 1;
        
        // Deforestation pressure from population and industry
        const deforestationPressure = (population / 100000) * 0.01 + (industrialization / 100) * 0.02;
        
        if (Math.random() < deforestationPressure) {
          const areaLost = Math.min(forest.area, 50 + Math.random() * 200);
          forest.area -= areaLost;
          forest.density = Math.max(0, forest.density - 5);
          forest.healthStatus = Math.max(0, forest.healthStatus - 3);
          
          this.recordDeforestation(forest.id, areaLost, year);
        }
      }
      
      // Natural regeneration for young forests
      if (forest.age < 100 && forest.density < 80) {
        forest.density = Math.min(100, forest.density + 0.5);
        forest.biodiversity = Math.min(100, forest.biodiversity + 0.3);
      }
      
      // Check if forest is depleted
      if (forest.area < 100) {
        this.forests.delete(forest.id);
      }
    });
  }

  /**
   * Zeichnet Entwaldung auf
   */
  private recordDeforestation(forestId: string, area: number, year: number): void {
    this.landscapeChanges.push({
      id: `deforestation-${forestId}-${year}`,
      type: 'deforestation',
      year,
      month: Math.floor(Math.random() * 12) + 1,
      location: { x: Math.random() * this.gridSize, y: Math.random() * this.gridSize },
      area,
      cause: 'human',
      impact: {
        biodiversity: -area / 100,
        happiness: -area / 200,
        floodRisk: area / 1000
      },
      reversible: true,
      cost: area * 10
    });
  }

  /**
   * Aktualisiert Flüsse
   */
  private updateRivers(year: number, climateTemperature: number): void {
    this.rivers.forEach(river => {
      // Climate impact on flow rate
      const temperatureImpact = 1 + (climateTemperature * 0.1);
      river.flowRate *= (0.95 + Math.random() * 0.1) * temperatureImpact;
      
      // Pollution accumulation
      river.pollution = Math.min(100, river.pollution + Math.random() * 0.5);
      
      // Small chance of course change (natural erosion)
      if (Math.random() < 0.01) {
        this.changeRiverCourse(river.id, year);
      }
      
      // Update flood risk based on flow rate
      river.floodRisk = Math.min(1.0, (river.flowRate / 500) * (1 + climateTemperature * 0.2));
    });
  }

  /**
   * Ändert Flusslauf
   */
  private changeRiverCourse(riverId: string, year: number): void {
    const river = this.rivers.get(riverId);
    if (!river) return;
    
    // Modify a random segment
    const segmentIndex = Math.floor(Math.random() * river.course.length);
    if (river.course[segmentIndex]) {
      river.course[segmentIndex].x += (Math.random() - 0.5) * 5;
      river.hasChanged = true;
      river.lastChangeYear = year;
      
      this.landscapeChanges.push({
        id: `river-change-${riverId}-${year}`,
        type: 'river_diversion',
        year,
        month: Math.floor(Math.random() * 12) + 1,
        location: river.course[segmentIndex],
        area: 10,
        cause: 'natural',
        impact: {
          floodRisk: 0.05,
          foodProduction: -5
        },
        reversible: true,
        cost: 10000
      });
    }
  }

  /**
   * Prüft auf natürliche Landschaftsveränderungen
   */
  private checkNaturalChanges(year: number, _climateTemperature: number): void {
    // Erosion events
    if (Math.random() < 0.05) {
      const x = Math.floor(Math.random() * this.gridSize);
      const y = Math.floor(Math.random() * this.gridSize);
      const tile = this.soilGrid[x][y];
      
      tile.erosionLevel = Math.min(100, tile.erosionLevel + 10 + Math.random() * 20);
      
      this.landscapeChanges.push({
        id: `erosion-${year}-${x}-${y}`,
        type: 'soil_erosion',
        year,
        month: Math.floor(Math.random() * 12) + 1,
        location: { x, y },
        area: this.totalArea / (this.gridSize * this.gridSize),
        cause: 'natural',
        impact: {
          foodProduction: -2,
          happiness: -1
        },
        reversible: true,
        cost: 1000
      });
    }
  }

  /**
   * Aktualisiert Terraforming-Projekte
   */
  private updateTerraformingProjects(year: number): void {
    this.terraformingProjects.forEach((project) => {
      if (!project.completed) {
        const yearsSinceStart = year - project.startYear;
        project.progress = Math.min(100, (yearsSinceStart / project.estimatedDuration) * 100);
        
        if (project.progress >= 100) {
          project.completed = true;
          this.completeTerraformingProject(project, year);
        }
      }
    });
  }

  /**
   * Schließt ein Terraforming-Projekt ab
   */
  private completeTerraformingProject(project: TerraformingProject, year: number): void {
    // Apply changes based on project type
    const { x, y } = project.location;
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);
    
    if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
      const tile = this.soilGrid[gridX][gridY];
      
      switch (project.type) {
        case 'land_reclamation':
          tile.terrainType = 'plains';
          tile.fertility = 50;
          break;
        case 'marsh_drainage':
          if (tile.terrainType === 'wetlands') {
            tile.terrainType = 'plains';
            tile.fertility = 70;
          }
          break;
        case 'irrigation':
          tile.moisture = Math.min(100, tile.moisture + 30);
          tile.fertility = Math.min(100, tile.fertility + 20);
          break;
      }
      
      this.landscapeChanges.push({
        id: `terraforming-${project.id}-${year}`,
        type: 'terraforming',
        year,
        month: 1,
        location: { x, y },
        area: project.area,
        cause: 'human',
        impact: {
          foodProduction: 20,
          happiness: 5
        },
        reversible: false
      });
    }
  }

  /**
   * Aktualisiert Landnutzungs-Statistiken
   */
  private updateLandUse(): void {
    const totalTiles = this.gridSize * this.gridSize;
    let agricultural = 0;
    let forest = 0;
    let water = 0;
    let wasteland = 0;
    
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const tile = this.soilGrid[x][y];
        switch (tile.terrainType) {
          case 'plains':
            agricultural++;
            break;
          case 'forests':
            forest++;
            break;
          case 'wetlands':
            water++;
            break;
          case 'desert':
            wasteland++;
            break;
        }
      }
    }
    
    this.landUse.agricultural = (agricultural / totalTiles) * 100;
    this.landUse.forest = (forest / totalTiles) * 100;
    this.landUse.water = (water / totalTiles) * 100;
    this.landUse.wasteland = (wasteland / totalTiles) * 100;
    // Urban and protected remain from other calculations
  }

  /**
   * Führt Aufforstung durch
   */
  public plantForest(area: number, year: number, _cost: number): boolean {
    const newForest: Forest = {
      id: `forest-planted-${year}-${Date.now()}`,
      name: `Aufgeforsteter Wald ${year}`,
      area,
      density: 20, // Young forest
      age: 0,
      biodiversity: 30,
      healthStatus: 90,
      lastHarvestYear: 0,
      protectedArea: false
    };
    
    this.forests.set(newForest.id, newForest);
    
    this.landscapeChanges.push({
      id: `reforestation-${year}`,
      type: 'reforestation',
      year,
      month: Math.floor(Math.random() * 12) + 1,
      location: { x: Math.random() * this.gridSize, y: Math.random() * this.gridSize },
      area,
      cause: 'policy',
      impact: {
        biodiversity: area / 100,
        happiness: area / 200,
        floodRisk: -area / 1000
      },
      reversible: false
    });
    
    return true;
  }

  /**
   * Startet ein Terraforming-Projekt
   */
  public startTerraformingProject(
    type: TerraformingProject['type'],
    area: number,
    location: { x: number; y: number },
    year: number
  ): TerraformingProject {
    const durations: Record<TerraformingProject['type'], number> = {
      land_reclamation: 10,
      mountain_leveling: 20,
      marsh_drainage: 5,
      irrigation: 3
    };
    
    const costs: Record<TerraformingProject['type'], number> = {
      land_reclamation: 50000,
      mountain_leveling: 100000,
      marsh_drainage: 20000,
      irrigation: 15000
    };
    
    const project: TerraformingProject = {
      id: `terraform-${year}-${Date.now()}`,
      name: `${type} Projekt ${year}`,
      type,
      startYear: year,
      estimatedDuration: durations[type],
      progress: 0,
      cost: costs[type] * (area / 1000),
      area,
      location,
      completed: false
    };
    
    this.terraformingProjects.set(project.id, project);
    return project;
  }

  /**
   * Verbessert Bodenqualität
   */
  public improveSoil(x: number, y: number, year: number): boolean {
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
      return false;
    }
    
    const tile = this.soilGrid[x][y];
    tile.fertility = Math.min(100, tile.fertility + 20);
    tile.organicMatter = Math.min(100, tile.organicMatter + 15);
    tile.erosionLevel = Math.max(0, tile.erosionLevel - 10);
    tile.quality = this.calculateSoilQuality(tile);
    
    this.landscapeChanges.push({
      id: `soil-improvement-${year}-${x}-${y}`,
      type: 'soil_improvement',
      year,
      month: Math.floor(Math.random() * 12) + 1,
      location: { x, y },
      area: this.totalArea / (this.gridSize * this.gridSize),
      cause: 'policy',
      impact: {
        foodProduction: 5
      },
      reversible: false
    });
    
    return true;
  }

  /**
   * Lenkt Flusslauf um (menschlich)
   */
  public divertRiver(riverId: string, year: number, cost: number): boolean {
    const river = this.rivers.get(riverId);
    if (!river) return false;
    
    // Major diversion
    const midPoint = Math.floor(river.course.length / 2);
    if (river.course[midPoint]) {
      river.course[midPoint].x += (Math.random() - 0.5) * 10;
      river.course[midPoint].y += (Math.random() - 0.5) * 10;
      river.hasChanged = true;
      river.lastChangeYear = year;
      
      this.landscapeChanges.push({
        id: `river-diversion-${riverId}-${year}`,
        type: 'river_diversion',
        year,
        month: Math.floor(Math.random() * 12) + 1,
        location: river.course[midPoint],
        area: 50,
        cause: 'policy',
        impact: {
          floodRisk: -0.1,
          foodProduction: 10
        },
        reversible: true,
        cost
      });
      
      return true;
    }
    
    return false;
  }

  // Getter methods
  public getForests(): Forest[] {
    return Array.from(this.forests.values());
  }

  public getForest(id: string): Forest | undefined {
    return this.forests.get(id);
  }

  public getRivers(): River[] {
    return Array.from(this.rivers.values());
  }

  public getRiver(id: string): River | undefined {
    return this.rivers.get(id);
  }

  public getSoilTile(x: number, y: number): SoilTile | undefined {
    if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
      return this.soilGrid[x][y];
    }
    return undefined;
  }

  public getLandscapeChanges(): LandscapeChange[] {
    return [...this.landscapeChanges];
  }

  public getRecentChanges(years: number = 10): LandscapeChange[] {
    const cutoffYear = Math.max(...this.landscapeChanges.map(c => c.year)) - years;
    return this.landscapeChanges.filter(c => c.year >= cutoffYear);
  }

  public getTerraformingProjects(): TerraformingProject[] {
    return Array.from(this.terraformingProjects.values());
  }

  public getActiveProjects(): TerraformingProject[] {
    return this.getTerraformingProjects().filter(p => !p.completed);
  }

  public getLandUse(): LandUse {
    return { ...this.landUse };
  }

  public getTotalForestArea(): number {
    return Array.from(this.forests.values()).reduce((sum, f) => sum + f.area, 0);
  }

  public getAverageSoilQuality(): number {
    let total = 0;
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        total += this.soilGrid[x][y].fertility;
      }
    }
    return total / (this.gridSize * this.gridSize);
  }

  /**
   * Serialisiert das Landschaftssystem
   */
  public serialize(): any {
    return {
      forests: Array.from(this.forests.entries()),
      rivers: Array.from(this.rivers.entries()),
      soilGrid: this.soilGrid,
      landscapeChanges: this.landscapeChanges,
      terraformingProjects: Array.from(this.terraformingProjects.entries()),
      landUse: this.landUse,
      gridSize: this.gridSize,
      totalArea: this.totalArea
    };
  }

  /**
   * Deserialisiert das Landschaftssystem
   */
  public static deserialize(data: any): LandscapeSystem {
    const system = new LandscapeSystem(data.totalArea, data.gridSize);
    
    system.forests = new Map(data.forests);
    system.rivers = new Map(data.rivers);
    system.soilGrid = data.soilGrid;
    system.landscapeChanges = data.landscapeChanges || [];
    system.terraformingProjects = new Map(data.terraformingProjects || []);
    system.landUse = data.landUse;
    
    return system;
  }
}
