/**
 * Day/Night Cycle and Activity System
 * 
 * Manages time-based activities, events, and economic cycles.
 * Scalable simulation of daily rhythms for entire populations.
 */

export interface TimeOfDay {
  hour: number; // 0-23
  period: 'night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening';
  lightLevel: number; // 0-100
}

export interface ActivitySchedule {
  activityType: string;
  startHour: number;
  endHour: number;
  participants: number; // percentage of population
  location: 'home' | 'work' | 'market' | 'church' | 'tavern' | 'theater' | 'street' | 'university';
  economicImpact: number; // gold generated/spent per participant
}

export interface DailyEvent {
  id: string;
  name: string;
  type: 'market' | 'sermon' | 'performance' | 'festival' | 'patrol' | 'shift_change';
  timeOfDay: TimeOfDay['period'];
  duration: number; // hours
  frequency: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  participants: number;
  economicValue: number;
  culturalValue: number;
  socialValue: number;
}

export interface EraSchedule {
  era: 'medieval' | 'renaissance' | 'industrial' | 'modern';
  workStartHour: number;
  workEndHour: number;
  marketHours: { start: number; end: number };
  entertainmentHours: { start: number; end: number };
  nightActivities: boolean; // Are there significant night activities?
  electricLighting: boolean; // Affects night activity levels
}

export class DayNightCycleSystem {
  private currentHour: number = 6; // Start at 6 AM
  private currentDay: number = 0;
  
  /** Activity schedules by era */
  private eraSchedules: Map<string, EraSchedule> = new Map();
  
  /** Daily events */
  private dailyEvents: DailyEvent[] = [];
  
  /** Active activities by hour */
  private hourlyActivities: Map<number, ActivitySchedule[]> = new Map();

  constructor() {
    this.initializeEraSchedules();
    this.initializeDailyEvents();
    this.generateHourlyActivities('medieval');
  }

  /**
   * Initialize era-specific schedules
   */
  private initializeEraSchedules(): void {
    this.eraSchedules.set('medieval', {
      era: 'medieval',
      workStartHour: 6,
      workEndHour: 18,
      marketHours: { start: 8, end: 16 },
      entertainmentHours: { start: 18, end: 21 },
      nightActivities: false,
      electricLighting: false
    });

    this.eraSchedules.set('renaissance', {
      era: 'renaissance',
      workStartHour: 6,
      workEndHour: 18,
      marketHours: { start: 7, end: 18 },
      entertainmentHours: { start: 18, end: 22 },
      nightActivities: true,
      electricLighting: false
    });

    this.eraSchedules.set('industrial', {
      era: 'industrial',
      workStartHour: 6,
      workEndHour: 20, // Longer workdays
      marketHours: { start: 6, end: 20 },
      entertainmentHours: { start: 19, end: 23 },
      nightActivities: true,
      electricLighting: true
    });

    this.eraSchedules.set('modern', {
      era: 'modern',
      workStartHour: 8,
      workEndHour: 17,
      marketHours: { start: 6, end: 22 },
      entertainmentHours: { start: 17, end: 2 }, // Until 2 AM
      nightActivities: true,
      electricLighting: true
    });
  }

  /**
   * Initialize daily events
   */
  private initializeDailyEvents(): void {
    this.dailyEvents = [
      {
        id: 'morning_market',
        name: 'Morgenmarkt',
        type: 'market',
        timeOfDay: 'morning',
        duration: 4,
        frequency: 'daily',
        participants: 5000,
        economicValue: 10000,
        culturalValue: 20,
        socialValue: 50
      },
      {
        id: 'sunday_sermon',
        name: 'Sonntagsgottesdienst',
        type: 'sermon',
        timeOfDay: 'morning',
        duration: 2,
        frequency: 'weekly',
        participants: 10000,
        economicValue: 1000,
        culturalValue: 70,
        socialValue: 80
      },
      {
        id: 'evening_theater',
        name: 'Abendtheater',
        type: 'performance',
        timeOfDay: 'evening',
        duration: 3,
        frequency: 'daily',
        participants: 500,
        economicValue: 2000,
        culturalValue: 90,
        socialValue: 60
      },
      {
        id: 'night_watch',
        name: 'Nachtwache',
        type: 'patrol',
        timeOfDay: 'night',
        duration: 8,
        frequency: 'daily',
        participants: 200,
        economicValue: -500,
        culturalValue: 10,
        socialValue: 30
      },
      {
        id: 'university_lectures',
        name: 'Universitätsvorlesungen',
        type: 'performance',
        timeOfDay: 'morning',
        duration: 4,
        frequency: 'daily',
        participants: 300,
        economicValue: 500,
        culturalValue: 95,
        socialValue: 40
      },
      {
        id: 'coffee_house',
        name: 'Kaffeehaus-Diskussionen',
        type: 'performance',
        timeOfDay: 'afternoon',
        duration: 3,
        frequency: 'daily',
        participants: 200,
        economicValue: 300,
        culturalValue: 70,
        socialValue: 80
      }
    ];
  }

  /**
   * Generate hourly activity schedules for an era
   */
  private generateHourlyActivities(era: EraSchedule['era']): void {
    const schedule = this.eraSchedules.get(era);
    if (!schedule) return;

    this.hourlyActivities.clear();

    for (let hour = 0; hour < 24; hour++) {
      const activities: ActivitySchedule[] = [];

      // Sleep
      if (hour >= 22 || hour < 5) {
        activities.push({
          activityType: 'sleeping',
          startHour: 22,
          endHour: 6,
          participants: 90,
          location: 'home',
          economicImpact: 0
        });
      }

      // Morning routines
      if (hour >= 5 && hour < 7) {
        activities.push({
          activityType: 'morning_routines',
          startHour: 5,
          endHour: 7,
          participants: 80,
          location: 'home',
          economicImpact: 0
        });
      }

      // Work hours
      if (hour >= schedule.workStartHour && hour < schedule.workEndHour) {
        activities.push({
          activityType: 'working',
          startHour: schedule.workStartHour,
          endHour: schedule.workEndHour,
          participants: 60,
          location: 'work',
          economicImpact: 5
        });
      }

      // Market hours
      if (hour >= schedule.marketHours.start && hour < schedule.marketHours.end) {
        activities.push({
          activityType: 'shopping',
          startHour: schedule.marketHours.start,
          endHour: schedule.marketHours.end,
          participants: 20,
          location: 'market',
          economicImpact: 3
        });
      }

      // Church (Sunday morning)
      if (hour >= 9 && hour < 11) {
        activities.push({
          activityType: 'church_service',
          startHour: 9,
          endHour: 11,
          participants: 40,
          location: 'church',
          economicImpact: 0.5
        });
      }

      // Entertainment
      if (hour >= schedule.entertainmentHours.start && hour <= schedule.entertainmentHours.end) {
        if (schedule.nightActivities || hour < 22) {
          activities.push({
            activityType: 'entertainment',
            startHour: schedule.entertainmentHours.start,
            endHour: schedule.entertainmentHours.end,
            participants: 15,
            location: era === 'medieval' ? 'tavern' : 'theater',
            economicImpact: 2
          });
        }
      }

      // Night patrol (always active)
      if (hour >= 20 || hour < 6) {
        activities.push({
          activityType: 'night_watch',
          startHour: 20,
          endHour: 6,
          participants: 1,
          location: 'street',
          economicImpact: -0.5
        });
      }

      this.hourlyActivities.set(hour, activities);
    }
  }

  /**
   * Advance time by one hour
   */
  public advanceHour(): {
    hour: number;
    timeOfDay: TimeOfDay;
    activeActivities: ActivitySchedule[];
    events: DailyEvent[];
    economicImpact: number;
  } {
    this.currentHour = (this.currentHour + 1) % 24;
    
    if (this.currentHour === 0) {
      this.currentDay++;
    }

    const timeOfDay = this.getTimeOfDay(this.currentHour);
    const activeActivities = this.hourlyActivities.get(this.currentHour) || [];
    const events = this.getEventsForHour(this.currentHour, timeOfDay.period);
    
    // Calculate economic impact
    const economicImpact = activeActivities.reduce(
      (sum, activity) => sum + activity.economicImpact * activity.participants,
      0
    ) + events.reduce((sum, event) => sum + event.economicValue, 0);

    return {
      hour: this.currentHour,
      timeOfDay,
      activeActivities,
      events,
      economicImpact
    };
  }

  /**
   * Get time of day information
   */
  public getTimeOfDay(hour: number): TimeOfDay {
    let period: TimeOfDay['period'];
    let lightLevel: number;

    if (hour >= 0 && hour < 5) {
      period = 'night';
      lightLevel = 0;
    } else if (hour >= 5 && hour < 7) {
      period = 'dawn';
      lightLevel = 30;
    } else if (hour >= 7 && hour < 11) {
      period = 'morning';
      lightLevel = 80;
    } else if (hour >= 11 && hour < 13) {
      period = 'noon';
      lightLevel = 100;
    } else if (hour >= 13 && hour < 17) {
      period = 'afternoon';
      lightLevel = 90;
    } else if (hour >= 17 && hour < 19) {
      period = 'dusk';
      lightLevel = 50;
    } else if (hour >= 19 && hour < 22) {
      period = 'evening';
      lightLevel = 20;
    } else {
      period = 'night';
      lightLevel = 0;
    }

    return { hour, period, lightLevel };
  }

  /**
   * Get events scheduled for this hour
   */
  private getEventsForHour(_hour: number, period: TimeOfDay['period']): DailyEvent[] {
    const events: DailyEvent[] = [];

    for (const event of this.dailyEvents) {
      if (event.timeOfDay === period) {
        // Check frequency
        if (event.frequency === 'daily') {
          events.push(event);
        } else if (event.frequency === 'weekly' && this.currentDay % 7 === 0) {
          events.push(event);
        } else if (event.frequency === 'monthly' && this.currentDay % 30 === 0) {
          events.push(event);
        }
      }
    }

    return events;
  }

  /**
   * Calculate population distribution at current time
   */
  public getPopulationDistribution(totalPopulation: number): Map<string, number> {
    const distribution = new Map<string, number>();
    const activities = this.hourlyActivities.get(this.currentHour) || [];

    for (const activity of activities) {
      const count = Math.floor(totalPopulation * (activity.participants / 100));
      const current = distribution.get(activity.location) || 0;
      distribution.set(activity.location, current + count);
    }

    return distribution;
  }

  /**
   * Get economic impact for a day
   */
  public getDailyEconomicImpact(population: number): number {
    let total = 0;

    for (let hour = 0; hour < 24; hour++) {
      const activities = this.hourlyActivities.get(hour) || [];
      for (const activity of activities) {
        const participants = Math.floor(population * (activity.participants / 100));
        total += activity.economicImpact * participants;
      }
    }

    // Add daily events
    const dayEvents = this.dailyEvents.filter(e => e.frequency === 'daily');
    for (const event of dayEvents) {
      total += event.economicValue;
    }

    return total;
  }

  /**
   * Switch to different era schedule
   */
  public setEra(era: EraSchedule['era']): void {
    this.generateHourlyActivities(era);
  }

  /**
   * Add custom daily event
   */
  public addDailyEvent(event: DailyEvent): void {
    this.dailyEvents.push(event);
  }

  /**
   * Get current time
   */
  public getCurrentTime(): { hour: number; day: number; timeOfDay: TimeOfDay } {
    return {
      hour: this.currentHour,
      day: this.currentDay,
      timeOfDay: this.getTimeOfDay(this.currentHour)
    };
  }

  /**
   * Serialize for save
   */
  public serialize(): any {
    return {
      currentHour: this.currentHour,
      currentDay: this.currentDay,
      eraSchedules: Array.from(this.eraSchedules.entries()),
      dailyEvents: this.dailyEvents,
      hourlyActivities: Array.from(this.hourlyActivities.entries())
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.currentHour !== undefined) {
      this.currentHour = data.currentHour;
    }
    if (data.currentDay !== undefined) {
      this.currentDay = data.currentDay;
    }
    if (data.eraSchedules) {
      this.eraSchedules = new Map(data.eraSchedules);
    }
    if (data.dailyEvents) {
      this.dailyEvents = data.dailyEvents;
    }
    if (data.hourlyActivities) {
      this.hourlyActivities = new Map(data.hourlyActivities);
    }
  }
}
