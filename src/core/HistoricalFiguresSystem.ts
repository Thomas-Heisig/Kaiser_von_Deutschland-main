// src/core/HistoricalFiguresSystem.ts

export interface HistoricalFigure {
  id: string;
  name: string;
  birthYear: number;
  deathYear: number;
  category: 'ruler' | 'statesman' | 'religious' | 'artist' | 'inventor' | 'scientist';
  culture: string;
  achievements: string[];
  traits: string[];
  prestige: number;
  influence: number;
}

export class HistoricalFiguresSystem {
  private figures: Map<string, HistoricalFigure> = new Map();
  private activeFigures: Set<string> = new Set();

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/historical-figures.json');
      const data = await response.json();
      
      data.figures.forEach((figure: HistoricalFigure) => {
        this.figures.set(figure.id, figure);
      });
    } catch (error) {
      console.error('Failed to load historical figures:', error);
    }
  }

  getFiguresByYear(year: number): HistoricalFigure[] {
    return Array.from(this.figures.values()).filter(
      figure => figure.birthYear <= year && figure.deathYear >= year
    );
  }

  getFiguresByCategory(category: HistoricalFigure['category']): HistoricalFigure[] {
    return Array.from(this.figures.values()).filter(
      figure => figure.category === category
    );
  }

  getFigure(id: string): HistoricalFigure | undefined {
    return this.figures.get(id);
  }

  activateFigure(id: string): boolean {
    if (this.figures.has(id)) {
      this.activeFigures.add(id);
      return true;
    }
    return false;
  }

  getActiveFigures(): HistoricalFigure[] {
    return Array.from(this.activeFigures)
      .map(id => this.figures.get(id))
      .filter((f): f is HistoricalFigure => f !== undefined);
  }

  getAllFigures(): HistoricalFigure[] {
    return Array.from(this.figures.values());
  }
}
