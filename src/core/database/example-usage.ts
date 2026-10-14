// src/core/database/example-usage.ts
/**
 * Example usage of the database system
 * This file demonstrates how to use the database layer in the game
 */

import { BrowserDatabaseAdapter, MigrationRunner, Migration001InitialSchema, PlayerRepository } from './index';

/**
 * Initialize the database with migrations
 */
export async function initializeDatabase(): Promise<BrowserDatabaseAdapter> {
  // Create database adapter
  const db = new BrowserDatabaseAdapter();
  await db.init();

  // Run migrations
  const migrationRunner = new MigrationRunner(db);
  migrationRunner.register(new Migration001InitialSchema());
  
  const migrationsRun = await migrationRunner.runPending();
  console.log(`Ran ${migrationsRun} migrations`);

  return db;
}

/**
 * Example: Save and load game state
 */
export async function exampleSaveLoad() {
  const db = await initializeDatabase();
  
  // Create repository
  const playerRepo = new PlayerRepository(db);

  // Save would happen in GameEngine
  // const player = new Player(...);
  // await playerRepo.save(player);

  // Load players
  const players = await playerRepo.findAll();
  console.log(`Loaded ${players.length} players`);

  // Export database for save file
  const dbData = await db.export();
  console.log(`Database size: ${dbData.length} bytes`);

  // Could save to localStorage
  localStorage.setItem('game-save-db', JSON.stringify(Array.from(dbData)));

  await db.close();
}

/**
 * Example: Import saved game
 */
export async function exampleLoadSave() {
  const db = new BrowserDatabaseAdapter();
  await db.init();

  // Load from localStorage
  const savedData = localStorage.getItem('game-save-db');
  if (savedData) {
    const dataArray = JSON.parse(savedData);
    const uint8Array = new Uint8Array(dataArray);
    await db.import(uint8Array);
    
    console.log('Game loaded successfully');
  }

  await db.close();
}
