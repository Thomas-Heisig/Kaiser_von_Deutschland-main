// src/core/database/repositories/BuildingRepository.ts

import { DatabaseAdapter } from '../DatabaseAdapter';

/**
 * Building data stored in database
 */
export interface BuildingData {
  id: string;
  playerId: string;
  type: string;
  level: number;
  isActive: boolean;
  constructionYear: number;
}

/**
 * Repository for Building data persistence
 * Implements the Repository Pattern for managing building data in the database
 */
export class BuildingRepository {
  constructor(private db: DatabaseAdapter) {}

  /**
   * Save a building to the database
   */
  async save(building: BuildingData): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO buildings (
        id, player_id, type, level, is_active, construction_year, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    await this.db.execute(sql, [
      building.id,
      building.playerId,
      building.type,
      building.level,
      building.isActive ? 1 : 0,
      building.constructionYear
    ]);
  }

  /**
   * Save multiple buildings in a batch
   */
  async saveBatch(buildings: BuildingData[]): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO buildings (
        id, player_id, type, level, is_active, construction_year, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    for (const building of buildings) {
      await this.db.execute(sql, [
        building.id,
        building.playerId,
        building.type,
        building.level,
        building.isActive ? 1 : 0,
        building.constructionYear
      ]);
    }
  }

  /**
   * Find a building by ID
   */
  async findById(id: string): Promise<BuildingData | null> {
    const results = await this.db.query<any>(
      'SELECT * FROM buildings WHERE id = ?',
      [id]
    );

    if (results.length === 0) {
      return null;
    }

    return this.mapToBuilding(results[0]);
  }

  /**
   * Find all buildings for a player
   */
  async findByPlayerId(playerId: string): Promise<BuildingData[]> {
    const results = await this.db.query<any>(
      'SELECT * FROM buildings WHERE player_id = ?',
      [playerId]
    );
    return results.map(row => this.mapToBuilding(row));
  }

  /**
   * Find active buildings for a player
   */
  async findActiveByPlayerId(playerId: string): Promise<BuildingData[]> {
    const results = await this.db.query<any>(
      'SELECT * FROM buildings WHERE player_id = ? AND is_active = 1',
      [playerId]
    );
    return results.map(row => this.mapToBuilding(row));
  }

  /**
   * Find buildings by type
   */
  async findByType(playerId: string, type: string): Promise<BuildingData[]> {
    const results = await this.db.query<any>(
      'SELECT * FROM buildings WHERE player_id = ? AND type = ?',
      [playerId, type]
    );
    return results.map(row => this.mapToBuilding(row));
  }

  /**
   * Count total buildings for a player
   */
  async count(playerId: string): Promise<number> {
    const results = await this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM buildings WHERE player_id = ?',
      [playerId]
    );
    return results[0]?.count || 0;
  }

  /**
   * Count active buildings for a player
   */
  async countActive(playerId: string): Promise<number> {
    const results = await this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM buildings WHERE player_id = ? AND is_active = 1',
      [playerId]
    );
    return results[0]?.count || 0;
  }

  /**
   * Count buildings by type
   */
  async countByType(playerId: string, type: string): Promise<number> {
    const results = await this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM buildings WHERE player_id = ? AND type = ?',
      [playerId, type]
    );
    return results[0]?.count || 0;
  }

  /**
   * Update building level
   */
  async updateLevel(id: string, newLevel: number): Promise<void> {
    await this.db.execute(
      'UPDATE buildings SET level = ? WHERE id = ?',
      [newLevel, id]
    );
  }

  /**
   * Toggle building active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.db.execute(
      'UPDATE buildings SET is_active = ? WHERE id = ?',
      [isActive ? 1 : 0, id]
    );
  }

  /**
   * Delete a building
   */
  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM buildings WHERE id = ?', [id]);
  }

  /**
   * Delete all buildings for a player
   */
  async deleteByPlayerId(playerId: string): Promise<void> {
    await this.db.execute('DELETE FROM buildings WHERE player_id = ?', [playerId]);
  }

  /**
   * Get building statistics for a player
   */
  async getStatistics(playerId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
    averageLevel: number;
  }> {
    // Total and active counts
    const totalResult = await this.db.query<{ total: number; active: number }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
      FROM buildings WHERE player_id = ?`,
      [playerId]
    );

    const total = totalResult[0]?.total || 0;
    const active = totalResult[0]?.active || 0;
    const inactive = total - active;

    // By type
    const typeResults = await this.db.query<{ type: string; count: number }>(
      `SELECT type, COUNT(*) as count 
       FROM buildings 
       WHERE player_id = ? 
       GROUP BY type`,
      [playerId]
    );

    const byType: Record<string, number> = {};
    typeResults.forEach(row => {
      byType[row.type] = row.count;
    });

    // Average level
    const avgResult = await this.db.query<{ avgLevel: number }>(
      'SELECT AVG(level) as avgLevel FROM buildings WHERE player_id = ?',
      [playerId]
    );

    return {
      total,
      active,
      inactive,
      byType,
      averageLevel: avgResult[0]?.avgLevel || 0
    };
  }

  /**
   * Helper method to map database row to BuildingData
   */
  private mapToBuilding(row: any): BuildingData {
    return {
      id: row.id,
      playerId: row.player_id,
      type: row.type,
      level: row.level,
      isActive: row.is_active === 1,
      constructionYear: row.construction_year
    };
  }
}
