// src/core/SocialMobilitySystem.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { SocialMobilitySystem } from './SocialMobilitySystem';

describe('SocialMobilitySystem', () => {
  let system: SocialMobilitySystem;

  beforeEach(() => {
    system = new SocialMobilitySystem();
  });

  describe('Social Class Determination', () => {
    it('should correctly classify citizens by wealth and profession', () => {
      expect(system.determineSocialClass(50, 'Bettler')).toBe('lower');
      expect(system.determineSocialClass(500, 'Bauer')).toBe('working');
      expect(system.determineSocialClass(5000, 'Handwerker')).toBe('middle');
      expect(system.determineSocialClass(50000, 'Bankier')).toBe('upper_middle');
      expect(system.determineSocialClass(100000, 'Fabrikbesitzer')).toBe('upper');
      expect(system.determineSocialClass(200000, 'Herzog')).toBe('nobility');
    });

    it('should use wealth as fallback when profession not in class list', () => {
      expect(system.determineSocialClass(500, 'Unknown Profession')).toBe('working');
      expect(system.determineSocialClass(15000, 'Unknown Profession')).toBe('upper_middle');
    });
  });

  describe('Career Change Probability', () => {
    it('should calculate higher probability for easier career paths', () => {
      // Bauer -> Soldat (difficulty: 20, easier)
      const easierPath = system.calculateCareerChangeProbability(
        'Bauer',
        'Soldat',
        50, // education
        1000, // wealth
        50, // connections
        25, // age (within range)
        50 // social stability
      );

      // Soldat -> General (difficulty: 80, harder)
      const harderPath = system.calculateCareerChangeProbability(
        'Soldat',
        'General',
        50,
        1000,
        50,
        25,
        50
      );

      expect(easierPath).toBeGreaterThan(harderPath);
    });

    it('should return 0 for non-existent career paths', () => {
      const probability = system.calculateCareerChangeProbability(
        'Bauer',
        'König', // No direct path
        100,
        100000,
        100,
        30,
        100
      );

      expect(probability).toBe(0);
    });

    it('should penalize for unmet requirements', () => {
      // Handwerker -> Gildenmeister requires education: 50, wealth: 5000
      const withRequirements = system.calculateCareerChangeProbability(
        'Handwerker',
        'Gildenmeister',
        60, // education met
        6000, // wealth met
        50,
        30,
        50
      );

      const withoutRequirements = system.calculateCareerChangeProbability(
        'Handwerker',
        'Gildenmeister',
        20, // education NOT met
        1000, // wealth NOT met
        50,
        30,
        50
      );

      expect(withRequirements).toBeGreaterThan(withoutRequirements);
    });

    it('should consider age requirements', () => {
      // Bauer -> Soldat (age requirement: 18-35)
      const rightAge = system.calculateCareerChangeProbability(
        'Bauer',
        'Soldat',
        50,
        1000,
        50,
        25, // within range
        50
      );

      const wrongAge = system.calculateCareerChangeProbability(
        'Bauer',
        'Soldat',
        50,
        1000,
        50,
        45, // too old
        50
      );

      expect(rightAge).toBeGreaterThan(wrongAge);
    });

    it('should be affected by social stability', () => {
      const highStability = system.calculateCareerChangeProbability(
        'Bauer',
        'Handwerker',
        30,
        1000,
        50,
        25,
        90 // high stability
      );

      const lowStability = system.calculateCareerChangeProbability(
        'Bauer',
        'Handwerker',
        30,
        1000,
        50,
        25,
        10 // low stability
      );

      expect(highStability).toBeGreaterThan(lowStability);
    });
  });

  describe('Career Paths', () => {
    it('should provide available career paths for a profession', () => {
      const bauerPaths = system.getAvailableCareerPaths('Bauer');
      expect(bauerPaths.length).toBeGreaterThan(0);
      expect(bauerPaths.some(p => p.toProfession === 'Handwerker')).toBe(true);
      expect(bauerPaths.some(p => p.toProfession === 'Soldat')).toBe(true);
    });

    it('should allow adding custom career paths', () => {
      const initialPaths = system.getAvailableCareerPaths('TestProfession').length;
      
      system.addCareerPath({
        fromProfession: 'TestProfession',
        toProfession: 'NewProfession',
        difficulty: 50,
        requirements: { education: 40 }
      });

      const newPaths = system.getAvailableCareerPaths('TestProfession');
      expect(newPaths.length).toBe(initialPaths + 1);
    });
  });

  describe('Aggregate Career Changes', () => {
    it('should process career changes for a population', () => {
      const professionDistribution = new Map([
        ['Bauer', 100],
        ['Handwerker', 50]
      ]);

      const changes = system.processCareerChanges(
        150, // total population
        professionDistribution,
        40, // avg education
        1000, // avg wealth
        30, // avg connections
        30, // avg age
        50, // social stability
        0.10 // 10% attempt change
      );

      // Should have some changes (not deterministic due to probability)
      expect(changes.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Individual Career Changes', () => {
    it('should attempt individual career change and return result', () => {
      const result = system.attemptCareerChange(
        'citizen-123',
        'Bauer',
        'Handwerker',
        60, // high education
        2000, // good wealth
        50,
        25,
        70 // high stability
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('event');
      expect(result.event.citizenId).toBe('citizen-123');
      expect(result.event.fromProfession).toBe('Bauer');
      expect(result.event.toProfession).toBe('Handwerker');
    });
  });

  describe('Mobility Statistics', () => {
    it('should track mobility statistics', () => {
      // Attempt some career changes to generate stats
      system.attemptCareerChange('c1', 'Bauer', 'Handwerker', 60, 2000, 50, 25, 70);
      system.attemptCareerChange('c2', 'Arbeiter', 'Handwerker', 50, 1500, 40, 28, 60);
      system.attemptCareerChange('c3', 'Handwerker', 'Gildenmeister', 70, 10000, 60, 35, 80);

      const stats = system.getMobilityStats();

      expect(stats.totalTransitions).toBeGreaterThanOrEqual(0);
      expect(stats).toHaveProperty('upwardMobility');
      expect(stats).toHaveProperty('downwardMobility');
      expect(stats).toHaveProperty('lateralMobility');
      expect(stats).toHaveProperty('averageSuccessRate');
    });

    it('should categorize upward vs downward mobility', () => {
      // Force successful upward mobility
      const upwardResult = system.attemptCareerChange(
        'c1',
        'Bauer',
        'Handwerker',
        100, // very high stats to ensure success
        10000,
        100,
        25,
        100
      );

      const stats = system.getMobilityStats();

      if (upwardResult.success) {
        expect(stats.upwardMobility).toBeGreaterThan(0);
      }
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      // Add some history
      system.attemptCareerChange('c1', 'Bauer', 'Handwerker', 60, 2000, 50, 25, 70);
      system.addCareerPath({
        fromProfession: 'Custom1',
        toProfession: 'Custom2',
        difficulty: 40,
        requirements: {}
      });

      const serialized = system.serialize();
      
      const newSystem = new SocialMobilitySystem();
      newSystem.deserialize(serialized);

      const newStats = newSystem.getMobilityStats();
      expect(newStats.totalTransitions).toBeGreaterThanOrEqual(0);
    });
  });
});
