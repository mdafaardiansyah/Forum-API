#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script handles database migrations for the Forum API.
 * It can run migrations up or down, and supports different environments.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Display usage information
 */
function showUsage() {
  console.log(`
Database Migration Script
`);
  console.log('Usage:');
  console.log('  node scripts/database/migrate.js <command> [options]\n');
  console.log('Commands:');
  console.log('  up              Run all pending migrations');
  console.log('  down            Rollback the last migration');
  console.log('  status          Show migration status');
  console.log('  create <name>   Create a new migration file');
  console.log('  reset           Reset database (drop all tables)');
  console.log('\nOptions:');
  console.log('  --env <env>     Environment (development, test, production)');
  console.log('  --help          Show this help message\n');
}

/**
 * Run database migrations up
 */
function migrateUp() {
  console.log(`Running migrations for ${NODE_ENV} environment...`);
  try {
    execSync('npm run migrate up', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Rollback last migration
 */
function migrateDown() {
  console.log(`Rolling back last migration for ${NODE_ENV} environment...`);
  try {
    execSync('npm run migrate down', { stdio: 'inherit' });
    console.log('✅ Rollback completed successfully');
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

/**
 * Show migration status
 */
function showStatus() {
  console.log(`Migration status for ${NODE_ENV} environment:`);
  try {
    execSync('npm run migrate status', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to get migration status:', error.message);
    process.exit(1);
  }
}

/**
 * Create new migration file
 */
function createMigration(name) {
  if (!name) {
    console.error('❌ Migration name is required');
    console.log('Usage: node scripts/database/migrate.js create <migration-name>');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  const filename = `${timestamp}_${name.replace(/\s+/g, '_')}.js`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  const template = `/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Add your migration logic here
  // Example:
  // pgm.createTable('table_name', {
  //   id: 'id',
  //   name: { type: 'varchar(255)', notNull: true },
  //   created_at: {
  //     type: 'timestamp',
  //     notNull: true,
  //     default: pgm.func('current_timestamp'),
  //   },
  // });
};

exports.down = (pgm) => {
  // Add your rollback logic here
  // Example:
  // pgm.dropTable('table_name');
};
`;

  try {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    }
    
    fs.writeFileSync(filepath, template);
    console.log(`✅ Created migration file: ${filename}`);
    console.log(`📁 Location: ${filepath}`);
  } catch (error) {
    console.error('❌ Failed to create migration file:', error.message);
    process.exit(1);
  }
}

/**
 * Reset database (drop all tables)
 */
function resetDatabase() {
  console.log(`⚠️  WARNING: This will drop all tables in ${NODE_ENV} database!`);
  
  if (NODE_ENV === 'production') {
    console.error('❌ Cannot reset production database');
    process.exit(1);
  }

  // In a real implementation, you might want to add confirmation prompt
  console.log('Resetting database...');
  try {
    execSync('npm run migrate down 0', { stdio: 'inherit' });
    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Handle environment override
const envIndex = args.indexOf('--env');
if (envIndex !== -1 && args[envIndex + 1]) {
  process.env.NODE_ENV = args[envIndex + 1];
}

// Handle help flag
if (args.includes('--help') || !command) {
  showUsage();
  process.exit(0);
}

// Execute commands
switch (command) {
  case 'up':
    migrateUp();
    break;
  case 'down':
    migrateDown();
    break;
  case 'status':
    showStatus();
    break;
  case 'create':
    createMigration(args[1]);
    break;
  case 'reset':
    resetDatabase();
    break;
  default:
    console.error(`❌ Unknown command: ${command}`);
    showUsage();
    process.exit(1);
}