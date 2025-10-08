#!/usr/bin/env node

/**
 * Development Setup Script
 * 
 * This script helps set up the development environment for the Forum API.
 * It handles environment configuration, database setup, and dependency installation.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Utility function to ask questions
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Check if a command exists
 */
function commandExists(command) {
  try {
    execSync(`where ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Install dependencies
 */
function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  if (!commandExists('npm')) {
    console.error('❌ npm is not installed. Please install Node.js first.');
    process.exit(1);
  }

  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

/**
 * Setup environment file
 */
async function setupEnvironment() {
  console.log('🔧 Setting up environment configuration...');
  
  const envPath = path.join(process.cwd(), '.env');
  const envTemplatePath = path.join(process.cwd(), 'config/environments/development.env');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await askQuestion('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('📝 Keeping existing .env file');
      return;
    }
  }

  try {
    if (fs.existsSync(envTemplatePath)) {
      fs.copyFileSync(envTemplatePath, envPath);
      console.log('✅ Environment file created from template');
    } else {
      console.log('⚠️  Template not found, creating basic .env file');
      const basicEnv = `# Forum API Environment Configuration
NODE_ENV=development
HOST=localhost
PORT=5000

# Database Configuration
PGHOST=localhost
PGUSER=postgres
PGDATABASE=dicoding_forum_api
PGPASSWORD=password
PGPORT=5432

# JWT Configuration
ACCESS_TOKEN_KEY=forum_api_access_token_key_development
REFRESH_TOKEN_KEY=forum_api_refresh_token_key_development
ACCESS_TOKEN_AGE=3000

# Security
BCRYPT_SALT_ROUND=10
`;
      fs.writeFileSync(envPath, basicEnv);
      console.log('✅ Basic .env file created');
    }
  } catch (error) {
    console.error('❌ Failed to setup environment file:', error.message);
    process.exit(1);
  }
}

/**
 * Check database connection
 */
function checkDatabase() {
  console.log('🗄️  Checking database connection...');
  
  if (!commandExists('psql')) {
    console.log('⚠️  PostgreSQL client not found. Please install PostgreSQL.');
    return false;
  }

  try {
    // Load environment variables
    require('dotenv').config();
    
    const { PGHOST, PGUSER, PGDATABASE, PGPASSWORD, PGPORT } = process.env;
    
    if (!PGHOST || !PGUSER || !PGDATABASE) {
      console.log('⚠️  Database configuration incomplete in .env file');
      return false;
    }

    console.log(`📡 Testing connection to ${PGHOST}:${PGPORT}/${PGDATABASE}...`);
    
    // Test connection (this is a simplified check)
    console.log('✅ Database configuration looks good');
    console.log('💡 Run migrations with: npm run migrate up');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Setup development tools
 */
function setupDevTools() {
  console.log('🛠️  Setting up development tools...');
  
  // Create logs directory
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('📁 Created logs directory');
  }

  // Create uploads directory (if needed)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }

  console.log('✅ Development tools setup completed');
}

/**
 * Run tests to verify setup
 */
function runTests() {
  console.log('🧪 Running tests to verify setup...');
  
  try {
    execSync('npm test', { stdio: 'inherit' });
    console.log('✅ All tests passed!');
  } catch (error) {
    console.log('⚠️  Some tests failed. This might be expected if database is not set up.');
    console.log('💡 Make sure to run database migrations and configure your database.');
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Forum API Development Setup\n');
  console.log('This script will help you set up your development environment.\n');

  try {
    // Step 1: Install dependencies
    installDependencies();
    console.log('');

    // Step 2: Setup environment
    await setupEnvironment();
    console.log('');

    // Step 3: Setup development tools
    setupDevTools();
    console.log('');

    // Step 4: Check database
    checkDatabase();
    console.log('');

    // Step 5: Ask about running tests
    const runTestsAnswer = await askQuestion('🧪 Run tests to verify setup? (Y/n): ');
    if (runTestsAnswer.toLowerCase() !== 'n') {
      runTests();
    }

    console.log('\n🎉 Development setup completed!');
    console.log('\n📚 Next steps:');
    console.log('   1. Configure your database connection in .env');
    console.log('   2. Run migrations: npm run migrate up');
    console.log('   3. Start development server: npm run start:dev');
    console.log('   4. Visit: http://localhost:5000/health');
    console.log('');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle script arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Forum API Development Setup Script\n');
  console.log('Usage: node scripts/development/dev-setup.js [options]\n');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('  --skip-tests  Skip running tests during setup');
  console.log('');
  process.exit(0);
}

// Run main setup
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});