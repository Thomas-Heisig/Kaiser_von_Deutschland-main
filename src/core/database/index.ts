// src/core/database/index.ts

// Core interfaces and errors
export * from './DatabaseAdapter';

// Implementations
export { BrowserDatabaseAdapter } from './BrowserDatabaseAdapter';

// Migration system
export * from './Migration';
export { MigrationRunner } from './MigrationRunner';

// Migrations
export { Migration001InitialSchema } from './migrations/001_initial_schema';

// Repositories
export * from './repositories';
