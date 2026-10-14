// src/core/TimeSystem.ts

/**
 * Zeit-Modi für unterschiedliche Spielgeschwindigkeiten
 */
export enum TimeMode {
  DETAIL = 'detail', // 1 Sekunde = 1 Tag - Für persönliches Rollenspiel
  BALANCED = 'balanced', // 1 Sekunde = 1 Monat - Für Familien-/Karrieresimulation
  STRATEGIC = 'strategic' // 1 Sekunde = 1 Jahr - Für dynastische/historische Simulation
}

/**
 * Zeit-Konfiguration
 */
export interface TimeConfig {
  mode: TimeMode;
  speed: number; // Geschwindigkeitsmultiplikator (0.5 = langsam, 1 = normal, 2 = schnell)
  isPaused: boolean;
}

/**
 * Zeit-Ereignis
 */
export interface TimeEvent {
  timestamp: number; // Absoluter Zeitstempel in Tagen
  year: number;
  month: number;
  day: number;
  description: string;
}

/**
 * Zeit-System
 * Verwaltet die Spielzeit mit verschiedenen Geschwindigkeitsmodi
 */
export class TimeSystem {
  private mode: TimeMode;
  private speed: number;
  private isPaused: boolean;
  
  // Zeit in Tagen seit Spielstart (Year 0 = Tag 0)
  private currentDay: number;
  private startYear: number;
  
  // Callbacks für Zeit-Updates
  private onDayChange?: (day: number, month: number, year: number) => void;
  private onMonthChange?: (month: number, year: number) => void;
  private onYearChange?: (year: number) => void;
  
  // Update-Tracking
  private lastUpdateTime: number = 0;
  private accumulatedTime: number = 0;
  
  constructor(startYear: number = 0, mode: TimeMode = TimeMode.BALANCED) {
    this.startYear = startYear;
    this.currentDay = startYear * 365; // Vereinfachte Berechnung (ohne Schaltjahre)
    this.mode = mode;
    this.speed = 1.0;
    this.isPaused = false;
  }
  
  /**
   * Aktualisiert die Zeit basierend auf Delta-Zeit
   */
  public update(_deltaTime: number): void {
    if (this.isPaused) {
      return;
    }
    
    // Berechne wie viel Zeit seit letztem Update vergangen ist
    const now = Date.now();
    if (this.lastUpdateTime === 0) {
      this.lastUpdateTime = now;
      return;
    }
    
    const realDeltaMs = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    
    // Berechne Spielzeit-Delta basierend auf Modus
    const gameDelta = this.calculateGameTimeDelta(realDeltaMs);
    
    this.accumulatedTime += gameDelta;
    
    // Update in Schritten von mindestens 1 Tag
    while (this.accumulatedTime >= 1) {
      this.advanceDay();
      this.accumulatedTime -= 1;
    }
  }
  
  /**
   * Berechnet Spielzeit-Delta basierend auf Realzeit und Modus
   */
  private calculateGameTimeDelta(realDeltaMs: number): number {
    const realDeltaSec = realDeltaMs / 1000;
    
    switch (this.mode) {
      case TimeMode.DETAIL:
        // 1 Sekunde = 1 Tag
        return realDeltaSec * this.speed;
      
      case TimeMode.BALANCED:
        // 1 Sekunde = 1 Monat (≈30 Tage)
        return realDeltaSec * 30 * this.speed;
      
      case TimeMode.STRATEGIC:
        // 1 Sekunde = 1 Jahr (365 Tage)
        return realDeltaSec * 365 * this.speed;
      
      default:
        return realDeltaSec * 30 * this.speed;
    }
  }
  
  /**
   * Schreitet einen Tag voran
   */
  private advanceDay(): void {
    const oldMonth = this.getCurrentMonth();
    const oldYear = this.getCurrentYear();
    
    this.currentDay++;
    
    const newMonth = this.getCurrentMonth();
    const newYear = this.getCurrentYear();
    const newDay = this.getCurrentDay();
    
    // Tag-Callback
    if (this.onDayChange) {
      this.onDayChange(newDay, newMonth, newYear);
    }
    
    // Monat-Callback (wenn Monat gewechselt)
    if (newMonth !== oldMonth && this.onMonthChange) {
      this.onMonthChange(newMonth, newYear);
    }
    
    // Jahr-Callback (wenn Jahr gewechselt)
    if (newYear !== oldYear && this.onYearChange) {
      this.onYearChange(newYear);
    }
  }
  
  /**
   * Setzt Zeit-Modus
   */
  public setMode(mode: TimeMode): void {
    console.log(`Zeit-Modus geändert: ${this.mode} -> ${mode}`);
    this.mode = mode;
  }
  
  /**
   * Holt aktuellen Zeit-Modus
   */
  public getMode(): TimeMode {
    return this.mode;
  }
  
  /**
   * Setzt Geschwindigkeitsmultiplikator
   */
  public setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(10, speed)); // Begrenzt auf 0.1x - 10x
    console.log(`Geschwindigkeit geändert: ${this.speed}x`);
  }
  
  /**
   * Holt Geschwindigkeitsmultiplikator
   */
  public getSpeed(): number {
    return this.speed;
  }
  
  /**
   * Pausiert die Zeit
   */
  public pause(): void {
    this.isPaused = true;
    console.log('Zeit pausiert');
  }
  
  /**
   * Setzt die Zeit fort
   */
  public resume(): void {
    this.isPaused = false;
    this.lastUpdateTime = Date.now(); // Reset, um große Zeitsprünge zu vermeiden
    console.log('Zeit fortgesetzt');
  }
  
  /**
   * Prüft ob Zeit pausiert ist
   */
  public getPaused(): boolean {
    return this.isPaused;
  }
  
  /**
   * Holt aktuelles Jahr
   */
  public getCurrentYear(): number {
    return this.startYear + Math.floor(this.currentDay / 365);
  }
  
  /**
   * Holt aktuellen Monat (1-12)
   */
  public getCurrentMonth(): number {
    const dayOfYear = this.currentDay % 365;
    return Math.floor(dayOfYear / 30) + 1;
  }
  
  /**
   * Holt aktuellen Tag im Monat (1-30)
   */
  public getCurrentDay(): number {
    const dayOfYear = this.currentDay % 365;
    return (dayOfYear % 30) + 1;
  }
  
  /**
   * Holt aktuellen absoluten Tag
   */
  public getAbsoluteDay(): number {
    return this.currentDay;
  }
  
  /**
   * Springt zu einem bestimmten Datum
   */
  public setDate(year: number, month: number = 1, day: number = 1): void {
    this.currentDay = (year - this.startYear) * 365 + (month - 1) * 30 + (day - 1);
    console.log(`Datum gesetzt: ${day}.${month}.${year}`);
  }
  
  /**
   * Registriert Callback für tägliche Updates
   */
  public onDayChangeCallback(callback: (day: number, month: number, year: number) => void): void {
    this.onDayChange = callback;
  }
  
  /**
   * Registriert Callback für monatliche Updates
   */
  public onMonthChangeCallback(callback: (month: number, year: number) => void): void {
    this.onMonthChange = callback;
  }
  
  /**
   * Registriert Callback für jährliche Updates
   */
  public onYearChangeCallback(callback: (year: number) => void): void {
    this.onYearChange = callback;
  }
  
  /**
   * Holt Zeit-Konfiguration
   */
  public getConfig(): TimeConfig {
    return {
      mode: this.mode,
      speed: this.speed,
      isPaused: this.isPaused
    };
  }
  
  /**
   * Holt formatiertes Datum
   */
  public getFormattedDate(): string {
    const day = this.getCurrentDay();
    const month = this.getCurrentMonth();
    const year = this.getCurrentYear();
    
    return `${day}.${month}.${year}`;
  }
  
  /**
   * Holt detaillierte Zeit-Information
   */
  public getTimeInfo(): {
    year: number;
    month: number;
    day: number;
    absoluteDay: number;
    mode: TimeMode;
    speed: number;
    isPaused: boolean;
    formattedDate: string;
  } {
    return {
      year: this.getCurrentYear(),
      month: this.getCurrentMonth(),
      day: this.getCurrentDay(),
      absoluteDay: this.currentDay,
      mode: this.mode,
      speed: this.speed,
      isPaused: this.isPaused,
      formattedDate: this.getFormattedDate()
    };
  }
  
  /**
   * Holt lesbare Beschreibung des Zeit-Modus
   */
  public getModeDescription(): string {
    switch (this.mode) {
      case TimeMode.DETAIL:
        return 'Detail-Modus (1 Sek = 1 Tag)';
      case TimeMode.BALANCED:
        return 'Ausgewogen (1 Sek = 1 Monat)';
      case TimeMode.STRATEGIC:
        return 'Strategisch (1 Sek = 1 Jahr)';
      default:
        return 'Unbekannt';
    }
  }
  
  /**
   * Berechnet wie viel Realzeit bis zum nächsten Zeitpunkt vergeht
   */
  public getTimeUntilNext(unit: 'day' | 'month' | 'year'): number {
    let daysUntil = 0;
    
    switch (unit) {
      case 'day':
        daysUntil = 1;
        break;
      case 'month':
        daysUntil = 30 - (this.currentDay % 30);
        break;
      case 'year':
        daysUntil = 365 - (this.currentDay % 365);
        break;
    }
    
    // Konvertiere zu Realzeit basierend auf Modus
    switch (this.mode) {
      case TimeMode.DETAIL:
        return (daysUntil / this.speed) * 1000; // in ms
      case TimeMode.BALANCED:
        return (daysUntil / (30 * this.speed)) * 1000;
      case TimeMode.STRATEGIC:
        return (daysUntil / (365 * this.speed)) * 1000;
      default:
        return (daysUntil / (30 * this.speed)) * 1000;
    }
  }
  
  /**
   * Erstellt Snapshot für Speichern/Laden
   */
  public createSnapshot(): any {
    return {
      currentDay: this.currentDay,
      startYear: this.startYear,
      mode: this.mode,
      speed: this.speed,
      isPaused: this.isPaused
    };
  }
  
  /**
   * Lädt Snapshot
   */
  public loadSnapshot(snapshot: any): void {
    this.currentDay = snapshot.currentDay;
    this.startYear = snapshot.startYear;
    this.mode = snapshot.mode;
    this.speed = snapshot.speed;
    this.isPaused = snapshot.isPaused;
    this.lastUpdateTime = Date.now();
    this.accumulatedTime = 0;
    
    console.log(`Zeit geladen: ${this.getFormattedDate()}, Modus: ${this.mode}`);
  }
}
