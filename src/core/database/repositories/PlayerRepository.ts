// src/core/database/repositories/PlayerRepository.ts

import { DatabaseAdapter } from '../DatabaseAdapter';
import { Player, PlayerSaveData } from '../../Player';

/**
 * Repository for Player data persistence
 * Implements the Repository Pattern for clean separation of concerns
 * 
 * Note: For simplicity, we store full player data as JSON initially.
 * Future optimization: normalize data into separate tables for better performance.
 */
export class PlayerRepository {
  constructor(private db: DatabaseAdapter) {}

  /**
   * Save a player to the database
   */
  async save(player: Player): Promise<void> {
    const data = player.serialize();
    
    // Store full serialized data as JSON for now
    // Extract key fields for indexing and querying
    const sql = `
      INSERT OR REPLACE INTO players (
        id, name, role_id, kingdom_name, color, treasury, prestige,
        current_year, current_month, is_ai, data, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const kingdom = data.kingdom || { name: '', treasury: 0, prestige: 0 };

    await this.db.execute(sql, [
      player.id,
      data.name,
      data.title?.name || 'Commoner',  // Use title name as role
      kingdom.name || null,
      kingdom.color || null,
      kingdom.treasury || 0,
      kingdom.prestige || 0,
      kingdom.year || 0,
      kingdom.month || 1,
      0, // is_ai - always false for players for now
      JSON.stringify(data)  // Store full data
    ]);
  }

  /**
   * Find a player by ID
   */
  async findById(id: string): Promise<Player | null> {
    const results = await this.db.query<any>(
      'SELECT * FROM players WHERE id = ?',
      [id]
    );

    if (results.length === 0) {
      return null;
    }

    return this.deserializePlayer(results[0]);
  }

  /**
   * Find all players
   */
  async findAll(): Promise<Player[]> {
    const results = await this.db.query<any>('SELECT * FROM players');
    return results.map(row => this.deserializePlayer(row));
  }

  /**
   * Delete a player
   */
  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM players WHERE id = ?', [id]);
  }

  /**
   * Count total players
   */
  async count(): Promise<number> {
    const results = await this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM players'
    );
    return results[0]?.count || 0;
  }

  /**
   * Find players by criteria
   */
  async findWhere(criteria: {
    isAI?: boolean;
    currentYear?: number;
  }): Promise<Player[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (criteria.isAI !== undefined) {
      conditions.push('is_ai = ?');
      params.push(criteria.isAI ? 1 : 0);
    }

    if (criteria.currentYear !== undefined) {
      conditions.push('current_year = ?');
      params.push(criteria.currentYear);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM players ${whereClause}`;

    const results = await this.db.query<any>(sql, params);
    return results.map(row => this.deserializePlayer(row));
  }

  /**
   * Helper method to deserialize database row to Player object
   */
  private deserializePlayer(row: any): Player {
    // Parse the full data from JSON column
    const playerData: PlayerSaveData = JSON.parse(row.data);
    return Player.deserialize(playerData);
  }
}
