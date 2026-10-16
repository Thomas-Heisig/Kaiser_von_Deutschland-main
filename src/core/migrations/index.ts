/**
 * @deprecated LEGACY / ALTERNATIVE IMPLEMENTATION.
 * Not used by the production entry src/main.ts -> KingdomGameUI.
 * Retained for historical behavior and schema compatibility; do not add new features here.
 * See docs/05-technical-architecture/system-consolidation.md before migration/removal.
 */
/**
 * Database Migrations Index
 * 
 * All migrations must be registered here in order
 */

import { Migration } from '../DatabaseAdapter';
import { migration_001_initial_schema } from './001_initial_schema';
import { migration_002_gameplay_modes } from './002_gameplay_modes';

/**
 * All migrations in chronological order
 */
export const allMigrations: Migration[] = [
  migration_001_initial_schema,
  migration_002_gameplay_modes,
  // Add new migrations here
];

/**
 * Get migrations up to a specific version
 */
export function getMigrationsUpTo(version: number): Migration[] {
  return allMigrations.filter(m => m.version <= version);
}

/**
 * Get latest migration version
 */
export function getLatestVersion(): number {
  return Math.max(...allMigrations.map(m => m.version), 0);
}
