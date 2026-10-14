// src/core/database/repositories/CitizenRepository.ts

import { DatabaseAdapter } from '../DatabaseAdapter';
import { Citizen } from '../../CitizenSystem';

/**
 * Repository for Citizen data persistence
 * Implements the Repository Pattern for managing citizen data in the database
 */
export class CitizenRepository {
  constructor(private db: DatabaseAdapter) {}

  /**
   * Save a citizen to the database
   */
  async save(citizen: Citizen, playerId: string): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO citizens (
        id, player_id, name, age, profession, health, happiness,
        birth_year, death_year, is_alive, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    await this.db.execute(sql, [
      citizen.id,
      playerId,
      `${citizen.firstName} ${citizen.lastName}`,
      citizen.age,
      citizen.profession,
      citizen.health.overall,
      citizen.happiness,
      citizen.birthYear,
      citizen.deathYear || null,
      citizen.isAlive ? 1 : 0
    ]);
  }

  /**
   * Save multiple citizens in a batch for better performance
   */
  async saveBatch(citizens: Citizen[], playerId: string): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO citizens (
        id, player_id, name, age, profession, health, happiness,
        birth_year, death_year, is_alive, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    for (const citizen of citizens) {
      await this.db.execute(sql, [
        citizen.id,
        playerId,
        `${citizen.firstName} ${citizen.lastName}`,
        citizen.age,
        citizen.profession,
        citizen.health.overall,
        citizen.happiness,
        citizen.birthYear,
        citizen.deathYear || null,
        citizen.isAlive ? 1 : 0
      ]);
    }
  }

  /**
   * Find a citizen by ID
   */
  async findById(id: string): Promise<any | null> {
    const results = await this.db.query<any>(
      'SELECT * FROM citizens WHERE id = ?',
      [id]
    );

    if (results.length === 0) {
      return null;
    }

    return results[0];
  }

  /**
   * Find all citizens for a player
   */
  async findByPlayerId(playerId: string): Promise<any[]> {
    return await this.db.query<any>(
      'SELECT * FROM citizens WHERE player_id = ?',
      [playerId]
    );
  }

  /**
   * Find all living citizens
   */
  async findAlive(playerId: string): Promise<any[]> {
    return await this.db.query<any>(
      'SELECT * FROM citizens WHERE player_id = ? AND is_alive = 1',
      [playerId]
    );
  }

  /**
   * Count total citizens for a player
   */
  async count(playerId: string): Promise<number> {
    const results = await this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM citizens WHERE player_id = ?',
      [playerId]
    );
    return results[0]?.count || 0;
  }

  /**
   * Count living citizens for a player
   */
  async countAlive(playerId: string): Promise<number> {
    const results = await this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM citizens WHERE player_id = ? AND is_alive = 1',
      [playerId]
    );
    return results[0]?.count || 0;
  }

  /**
   * Find citizens by profession
   */
  async findByProfession(playerId: string, profession: string): Promise<any[]> {
    return await this.db.query<any>(
      'SELECT * FROM citizens WHERE player_id = ? AND profession = ? AND is_alive = 1',
      [playerId, profession]
    );
  }

  /**
   * Delete a citizen
   */
  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM citizens WHERE id = ?', [id]);
  }

  /**
   * Delete all citizens for a player
   */
  async deleteByPlayerId(playerId: string): Promise<void> {
    await this.db.execute('DELETE FROM citizens WHERE player_id = ?', [playerId]);
  }

  /**
   * Update citizen's age
   */
  async updateAge(id: string, newAge: number): Promise<void> {
    await this.db.execute(
      'UPDATE citizens SET age = ? WHERE id = ?',
      [newAge, id]
    );
  }

  /**
   * Mark a citizen as deceased
   */
  async markAsDeceased(id: string, deathYear: number): Promise<void> {
    await this.db.execute(
      'UPDATE citizens SET is_alive = 0, death_year = ? WHERE id = ?',
      [deathYear, id]
    );
  }

  /**
   * Get population statistics for a player
   */
  async getStatistics(playerId: string): Promise<{
    total: number;
    alive: number;
    deceased: number;
    byProfession: Record<string, number>;
    averageAge: number;
    averageHappiness: number;
    averageHealth: number;
  }> {
    // Total and alive counts
    const totalResult = await this.db.query<{ total: number; alive: number }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_alive = 1 THEN 1 ELSE 0 END) as alive
      FROM citizens WHERE player_id = ?`,
      [playerId]
    );

    const total = totalResult[0]?.total || 0;
    const alive = totalResult[0]?.alive || 0;
    const deceased = total - alive;

    // By profession
    const professionResults = await this.db.query<{ profession: string; count: number }>(
      `SELECT profession, COUNT(*) as count 
       FROM citizens 
       WHERE player_id = ? AND is_alive = 1 
       GROUP BY profession`,
      [playerId]
    );

    const byProfession: Record<string, number> = {};
    professionResults.forEach(row => {
      byProfession[row.profession] = row.count;
    });

    // Averages
    const avgResults = await this.db.query<{ 
      avgAge: number; 
      avgHappiness: number;
      avgHealth: number;
    }>(
      `SELECT 
        AVG(age) as avgAge,
        AVG(happiness) as avgHappiness,
        AVG(health) as avgHealth
      FROM citizens WHERE player_id = ? AND is_alive = 1`,
      [playerId]
    );

    return {
      total,
      alive,
      deceased,
      byProfession,
      averageAge: avgResults[0]?.avgAge || 0,
      averageHappiness: avgResults[0]?.avgHappiness || 0,
      averageHealth: avgResults[0]?.avgHealth || 0
    };
  }
}
