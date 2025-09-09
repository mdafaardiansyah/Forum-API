#!/usr/bin/env node

/**
 * Deployment Script
 * 
 * This script handles deployment tasks for the Forum API.
 * It supports different deployment targets and environments.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Display usage information
 */
function showUsage() {
  console.log('\nForum API Deployment Script\n');
  console.log('Usage:');
  console.log('  node scripts/deployment/deploy.js <target> [options]\n');
  console.log('Targets:');
  console.log('  heroku          Deploy to Heroku');
  console.log('  docker          Build and deploy Docker container');
  console.log('  staging         Deploy to staging environment');
  console.log('  production      Deploy to production environment');
  console.log('\nOptions:');
  console.log('  --env <env>     Environment (staging, production)');
  console.log('  --branch <name> Git branch to deploy (default: main)');
  console.log('  --skip-tests    Skip running tests before deployment');
  console.log('  --help          Show this help message\n');
}

/**
 * Run pre-deployment checks
 */
function preDeploymentChecks(skipTests = false) {
  console.log('🔍 Running pre-deployment checks...');
  
  // Check if we're in a git repository
  try {
    execSync('git status', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not in a git repository');
    process.exit(1);
  }

  // Check for uncommitted changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.warn('⚠️  You have uncommitted changes:');
      console.log(status);
      console.log('💡 Consider committing your changes before deployment');
    }
  } catch (error) {
    console.error('❌ Failed to check git status:', error.message);
  }

  // Run tests unless skipped
  if (!skipTests) {
    console.log('🧪 Running tests...');
    try {
      execSync('npm test', { stdio: 'inherit' });
      console.log('✅ All tests passed');
    } catch (error) {
      console.error('❌ Tests failed. Deployment aborted.');
      process.exit(1);
    }
  }

  // Check for required files
  const requiredFiles = ['package.json', 'Procfile'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Required file missing: ${file}`);
      process.exit(1);
    }
  }

  console.log('✅ Pre-deployment checks passed');
}

/**
 * Deploy to Heroku
 */
function deployToHeroku(branch = 'main') {
  console.log('🚀 Deploying to Heroku...');
  
  try {
    // Check if Heroku CLI is installed
    execSync('heroku --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Heroku CLI not found. Please install it first.');
    console.log('💡 Visit: https://devcenter.heroku.com/articles/heroku-cli');
    process.exit(1);
  }

  try {
    // Check if logged in to Heroku
    execSync('heroku auth:whoami', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not logged in to Heroku. Please run: heroku login');
    process.exit(1);
  }

  try {
    console.log(`📤 Pushing ${branch} branch to Heroku...`);
    execSync(`git push heroku ${branch}:main`, { stdio: 'inherit' });
    
    console.log('🔄 Running database migrations on Heroku...');
    execSync('heroku run npm run migrate up', { stdio: 'inherit' });
    
    console.log('📊 Checking application status...');
    execSync('heroku ps', { stdio: 'inherit' });
    
    console.log('🌐 Opening application...');
    execSync('heroku open', { stdio: 'inherit' });
    
    console.log('✅ Heroku deployment completed successfully!');
  } catch (error) {
    console.error('❌ Heroku deployment failed:', error.message);
    process.exit(1);
  }
}

/**
 * Build and deploy Docker container
 */
function deployDocker(environment = 'production') {
  console.log('🐳 Building and deploying Docker container...');
  
  try {
    // Check if Docker is installed
    execSync('docker --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Docker not found. Please install Docker first.');
    process.exit(1);
  }

  const imageName = 'forum-api';
  const tag = `${imageName}:${environment}`;

  try {
    console.log('🔨 Building Docker image...');
    execSync(`docker build -t ${tag} .`, { stdio: 'inherit' });
    
    console.log('🏃 Running Docker container...');
    execSync(`docker run -d -p 5000:5000 --name forum-api-${environment} ${tag}`, { stdio: 'inherit' });
    
    console.log('📊 Checking container status...');
    execSync('docker ps', { stdio: 'inherit' });
    
    console.log('✅ Docker deployment completed successfully!');
    console.log('🌐 Application should be available at: http://localhost:5000');
  } catch (error) {
    console.error('❌ Docker deployment failed:', error.message);
    process.exit(1);
  }
}

/**
 * Deploy to staging environment
 */
function deployToStaging(branch = 'develop') {
  console.log('🎭 Deploying to staging environment...');
  
  try {
    // Set staging environment
    process.env.NODE_ENV = 'staging';
    
    console.log('📦 Installing dependencies...');
    execSync('npm ci', { stdio: 'inherit' });
    
    console.log('🔄 Running database migrations...');
    execSync('npm run migrate up', { stdio: 'inherit' });
    
    console.log('🚀 Starting application in staging mode...');
    execSync('npm run start:staging', { stdio: 'inherit' });
    
    console.log('✅ Staging deployment completed!');
  } catch (error) {
    console.error('❌ Staging deployment failed:', error.message);
    process.exit(1);
  }
}

/**
 * Deploy to production environment
 */
function deployToProduction(branch = 'main') {
  console.log('🏭 Deploying to production environment...');
  
  // Extra safety checks for production
  if (branch !== 'main' && branch !== 'master') {
    console.error('❌ Production deployments must be from main/master branch');
    process.exit(1);
  }

  try {
    // Set production environment
    process.env.NODE_ENV = 'production';
    
    console.log('📦 Installing production dependencies...');
    execSync('npm ci --only=production', { stdio: 'inherit' });
    
    console.log('🔄 Running database migrations...');
    execSync('npm run migrate up', { stdio: 'inherit' });
    
    console.log('🚀 Starting application in production mode...');
    execSync('npm start', { stdio: 'inherit' });
    
    console.log('✅ Production deployment completed!');
  } catch (error) {
    console.error('❌ Production deployment failed:', error.message);
    process.exit(1);
  }
}

/**
 * Create deployment checklist
 */
function createDeploymentChecklist() {
  const checklist = `
# Deployment Checklist

## Pre-Deployment
- [ ] All tests are passing
- [ ] Code has been reviewed
- [ ] Environment variables are configured
- [ ] Database migrations are ready
- [ ] Security configurations are in place
- [ ] Performance optimizations are applied

## During Deployment
- [ ] Backup current database (if applicable)
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Run database migrations
- [ ] Verify application is running

## Post-Deployment
- [ ] Monitor application logs
- [ ] Check application metrics
- [ ] Verify all endpoints are working
- [ ] Test critical user flows
- [ ] Update documentation if needed
- [ ] Notify team of successful deployment

## Rollback Plan
- [ ] Keep previous version available
- [ ] Document rollback procedure
- [ ] Test rollback in staging
- [ ] Monitor for issues requiring rollback
`;

  fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
  console.log('📋 Deployment checklist created: DEPLOYMENT_CHECKLIST.md');
}

// Parse command line arguments
const args = process.argv.slice(2);
const target = args[0];

// Parse options
let environment = 'production';
let branch = 'main';
let skipTests = false;

for (let i = 1; i < args.length; i++) {
  switch (args[i]) {
    case '--env':
      environment = args[i + 1];
      i++;
      break;
    case '--branch':
      branch = args[i + 1];
      i++;
      break;
    case '--skip-tests':
      skipTests = true;
      break;
    case '--help':
      showUsage();
      process.exit(0);
      break;
  }
}

// Handle help or no target
if (!target || target === '--help') {
  showUsage();
  process.exit(0);
}

// Run pre-deployment checks
preDeploymentChecks(skipTests);

// Execute deployment based on target
switch (target) {
  case 'heroku':
    deployToHeroku(branch);
    break;
  case 'docker':
    deployDocker(environment);
    break;
  case 'staging':
    deployToStaging(branch);
    break;
  case 'production':
    deployToProduction(branch);
    break;
  case 'checklist':
    createDeploymentChecklist();
    break;
  default:
    console.error(`❌ Unknown deployment target: ${target}`);
    showUsage();
    process.exit(1);
}