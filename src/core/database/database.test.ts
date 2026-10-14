// src/core/database/database.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserDatabaseAdapter } from './BrowserDatabaseAdapter';
import { MigrationRunner } from './MigrationRunner';
import { Migration001InitialSchema } from './migrations/001_initial_schema';

describe('DatabaseAdapter', () => {
  let db: BrowserDatabaseAdapter;

  beforeEach(async () => {
    db = new BrowserDatabaseAdapter();
    await db.init();
  });

  it('should initialize successfully', async () => {
    const version = await db.getVersion();
    expect(version).toBe(0);
  });

  it('should execute INSERT and SELECT queries', async () => {
    await db.execute(`
      CREATE TABLE test (
        id INTEGER PRIMARY KEY,
        name TEXT
      )
    `);

    const id = await db.insert('INSERT INTO test (name) VALUES (?)', ['Test Name']);
    expect(id).toBeGreaterThan(0);

    const results = await db.query<{ id: number; name: string }>('SELECT * FROM test');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Test Name');
  });

  it('should handle transactions', async () => {
    await db.execute('CREATE TABLE test (value INTEGER)');

    await db.transaction(async () => {
      await db.execute('INSERT INTO test (value) VALUES (1)');
      await db.execute('INSERT INTO test (value) VALUES (2)');
    });

    const results = await db.query('SELECT * FROM test');
    expect(results).toHaveLength(2);
  });

  it('should rollback failed transactions', async () => {
    await db.execute('CREATE TABLE test (value INTEGER)');

    try {
      await db.transaction(async () => {
        await db.execute('INSERT INTO test (value) VALUES (1)');
        throw new Error('Intentional error');
      });
    } catch (error) {
      // Expected to throw
    }

    const results = await db.query('SELECT * FROM test');
    expect(results).toHaveLength(0);
  });

  it('should export and import database', async () => {
    await db.execute('CREATE TABLE test (name TEXT)');
    await db.execute('INSERT INTO test (name) VALUES (?)', ['Test']);

    const exported = await db.export();
    expect(exported).toBeInstanceOf(Uint8Array);

    const db2 = new BrowserDatabaseAdapter();
    await db2.init();
    await db2.import(exported);

    const results = await db2.query('SELECT * FROM test');
    expect(results).toHaveLength(1);
  });
});

describe('MigrationRunner', () => {
  let db: BrowserDatabaseAdapter;
  let runner: MigrationRunner;

  beforeEach(async () => {
    db = new BrowserDatabaseAdapter();
    await db.init();
    runner = new MigrationRunner(db);
  });

  it('should run pending migrations', async () => {
    runner.register(new Migration001InitialSchema());

    const count = await runner.runPending();
    expect(count).toBe(1);

    const version = await db.getVersion();
    expect(version).toBe(1);
  });

  it('should not re-run applied migrations', async () => {
    runner.register(new Migration001InitialSchema());

    await runner.runPending();
    const count = await runner.runPending();

    expect(count).toBe(0);
  });

  it('should create tables from initial schema', async () => {
    runner.register(new Migration001InitialSchema());
    await runner.runPending();

    // Verify tables were created
    const tables = await db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_db_version'
      ORDER BY name
    `);

    const tableNames = tables.map((t: any) => t.name);
    expect(tableNames).toContain('players');
    expect(tableNames).toContain('citizens');
    expect(tableNames).toContain('buildings');
    expect(tableNames).toContain('technologies');
    expect(tableNames).toContain('policies');
    expect(tableNames).toContain('game_events');
  });

  it('should provide migration status', async () => {
    runner.register(new Migration001InitialSchema());
    
    const statusBefore = await runner.getMigrationStatus();
    expect(statusBefore[0].applied).toBe(false);

    await runner.runPending();

    const statusAfter = await runner.getMigrationStatus();
    expect(statusAfter[0].applied).toBe(true);
  });
});
