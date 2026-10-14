// src/core/database/repositories/TechnologyRepository.ts

import { DatabaseAdapter } from '../DatabaseAdapter';

/**
 * Technology data stored in database
 */
export interface TechnologyData {
  id: string;
  playerId: string;
  techId: string;
  unlockedYear: number;
}

/**
 * Repository for Technology data persistence
 * Implements the Repository Pattern for managing technology unlocks in the database
 */
export class TechnologyRepository {
  constructor(private db: DatabaseAdapter) {}

  /**
   * Save an unlocked technology to the database
   */
  async save(technology: TechnologyData): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO technologies (
        id, player_id, tech_id, unlocked_year, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    await this.db.execute(sql, [
      technology.id,
      technology.playerId,
      technology.techId,
      technology.unlockedYear
    ]);
  }

  /**
   * Save multiple technologies in a batch
   */
  async saveBatch(technologies: TechnologyData[]): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO technologies (
        id, player_id, tech_id, unlocked_year, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    for (const tech of technologies) {
      await this.db.execute(sql, [
        tech.id,
        tech.playerId,
        tech.techId,
        tech.unlockedYear
      ]);
    }
  }

  /**
   * Find a technology by ID
   */
  async findById(id: string): Promise<TechnologyData | null> {
    const results = await this.db.query<any>(
      'SELECT * FROM technologies WHERE id = ?',
      [id]
    );

    if (results.length === 0) {
      return null;
    }

    return this.mapToTechnology(results[0]);
  }

  /**
   * Find all technologies for a player
   */
  async findByPlayerId(playerId: string): Promise<TechnologyData[]> {
    const results = await this.db.query<any>(
      'SELECT * FROM technologies WHERE player_id = ? ORDER BY unlocked_year ASC',
      [playerId]
    );
    return results.map(row => this.mapToTechnology(row));
  }

  /**
   * Check if a player has unlocked a specific technology
   */
  async hasUnlocked(playerId: string, techId: string): Promise<boolean> {
    const results = await this.db.query<any>(
      'SELECT id FROM technologies WHERE player_id = ? AND tech_id = ?',
      [playerId, techId]
    );
    return results.length > 0;
  }

  /**
   * Get all unlocked tech IDs for a player
   */
  async getUnlockedTechIds(playerId: string): Promise<string[]> {
    const results = await this.db.query<{ tech_id: string }>(
      'SELECT tech_id FROM technologies WHERE player_id = ?',
      [playerId]
    );
    return results.map(row => row.tech_id);
  }

  /**
   * Count total technologies unlocked by a player
   */
  async count(playerId: string): Promise<number> {
    const results = await this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM technologies WHERE player_id = ?',
      [playerId]
    );
    return results[0]?.count || 0;
  }

  /**
   * Get technologies unlocked in a specific year
   */
  async findByYear(playerId: string, year: number): Promise<TechnologyData[]> {
    const results = await this.db.query<any>(
      'SELECT * FROM technologies WHERE player_id = ? AND unlocked_year = ?',
      [playerId, year]
    );
    return results.map(row => this.mapToTechnology(row));
  }

  /**
   * Get technologies unlocked in a year range
   */
  async findByYearRange(playerId: string, startYear: number, endYear: number): Promise<TechnologyData[]> {
    const results = await this.db.query<any>(
      'SELECT * FROM technologies WHERE player_id = ? AND unlocked_year BETWEEN ? AND ? ORDER BY unlocked_year ASC',
      [playerId, startYear, endYear]
    );
    return results.map(row => this.mapToTechnology(row));
  }

  /**
   * Delete a technology unlock
   */
  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM technologies WHERE id = ?', [id]);
  }

  /**
   * Delete all technologies for a player
   */
  async deleteByPlayerId(playerId: string): Promise<void> {
    await this.db.execute('DELETE FROM technologies WHERE player_id = ?', [playerId]);
  }

  /**
   * Delete a specific technology unlock for a player
   */
  async deleteByTechId(playerId: string, techId: string): Promise<void> {
    await this.db.execute(
      'DELETE FROM technologies WHERE player_id = ? AND tech_id = ?',
      [playerId, techId]
    );
  }

  /**
   * Get technology statistics for a player
   */
  async getStatistics(playerId: string): Promise<{
    total: number;
    earliestYear: number | null;
    latestYear: number | null;
    byYear: Record<number, number>;
  }> {
    // Total count
    const total = await this.count(playerId);

    // Earliest and latest years
    const yearResults = await this.db.query<{ 
      earliestYear: number | null; 
      latestYear: number | null;
    }>(
      `SELECT 
        MIN(unlocked_year) as earliestYear,
        MAX(unlocked_year) as latestYear
      FROM technologies WHERE player_id = ?`,
      [playerId]
    );

    const earliestYear = yearResults[0]?.earliestYear || null;
    const latestYear = yearResults[0]?.latestYear || null;

    // Count by year
    const byYearResults = await this.db.query<{ year: number; count: number }>(
      `SELECT unlocked_year as year, COUNT(*) as count 
       FROM technologies 
       WHERE player_id = ? 
       GROUP BY unlocked_year
       ORDER BY unlocked_year ASC`,
      [playerId]
    );

    const byYear: Record<number, number> = {};
    byYearResults.forEach(row => {
      byYear[row.year] = row.count;
    });

    return {
      total,
      earliestYear,
      latestYear,
      byYear
    };
  }

  /**
   * Helper method to map database row to TechnologyData
   */
  private mapToTechnology(row: any): TechnologyData {
    return {
      id: row.id,
      playerId: row.player_id,
      techId: row.tech_id,
      unlockedYear: row.unlocked_year
    };
  }
}
