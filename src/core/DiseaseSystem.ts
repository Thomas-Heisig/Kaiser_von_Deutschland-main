// src/core/DiseaseSystem.ts

export interface Disease {
  id: string;
  name: string;
  category: 'epidemic' | 'pandemic' | 'endemic';
  firstAppearance: number;
  lastMajorOutbreak: number | null;
  mortality: number;
  infectivity: number;
  duration: number;
  symptoms: string[];
  treatment: {
    medieval: number;
    renaissance: number;
    industrial: number;
    modern: number;
  };
  economicImpact: number;
  socialImpact: number;
  requiredTechnology: string | null;
}

export interface DiseaseOutbreak {
  diseaseId: string;
  startYear: number;
  endYear: number;
  affectedPopulation: number;
  deaths: number;
  regions: string[];
  active: boolean;
}

export class DiseaseSystem {
  private diseases: Map<string, Disease> = new Map();
  private activeOutbreaks: DiseaseOutbreak[] = [];
  private outbreakHistory: DiseaseOutbreak[] = [];

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/diseases.json');
      const data = await response.json();
      
      data.diseases.forEach((disease: Disease) => {
        this.diseases.set(disease.id, disease);
      });
    } catch (error) {
      console.error('Failed to load diseases:', error);
    }
  }

  getDisease(id: string): Disease | undefined {
    return this.diseases.get(id);
  }

  getAllDiseases(): Disease[] {
    return Array.from(this.diseases.values());
  }

  triggerOutbreak(
    diseaseId: string,
    year: number,
    population: number,
    regions: string[]
  ): DiseaseOutbreak | null {
    const disease = this.diseases.get(diseaseId);
    if (!disease) return null;

    const outbreak: DiseaseOutbreak = {
      diseaseId,
      startYear: year,
      endYear: year + Math.ceil(disease.duration / 365),
      affectedPopulation: Math.floor(population * disease.infectivity),
      deaths: Math.floor(population * disease.infectivity * disease.mortality),
      regions,
      active: true
    };

    this.activeOutbreaks.push(outbreak);
    return outbreak;
  }

  updateOutbreaks(currentYear: number): void {
    this.activeOutbreaks = this.activeOutbreaks.filter(outbreak => {
      if (currentYear >= outbreak.endYear) {
        outbreak.active = false;
        this.outbreakHistory.push(outbreak);
        return false;
      }
      return true;
    });
  }

  getActiveOutbreaks(): DiseaseOutbreak[] {
    return this.activeOutbreaks.filter(o => o.active);
  }

  getOutbreakHistory(): DiseaseOutbreak[] {
    return this.outbreakHistory;
  }

  getTreatmentEffectiveness(diseaseId: string, era: keyof Disease['treatment']): number {
    const disease = this.diseases.get(diseaseId);
    return disease?.treatment[era] ?? 0;
  }

  calculateImpact(outbreak: DiseaseOutbreak): {
    economic: number;
    social: number;
    population: number;
  } {
    const disease = this.diseases.get(outbreak.diseaseId);
    if (!disease) {
      return { economic: 0, social: 0, population: 0 };
    }

    return {
      economic: disease.economicImpact * (outbreak.affectedPopulation / 1000),
      social: disease.socialImpact,
      population: outbreak.deaths
    };
  }
}
