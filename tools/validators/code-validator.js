#!/usr/bin/env node

/**
 * Code Validator Tool
 * 
 * This tool validates code quality, architecture compliance, and best practices
 * for the Forum API project following Clean Architecture principles.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Validation rules and patterns
 */
const VALIDATION_RULES = {
  // Clean Architecture layer dependencies
  layerDependencies: {
    'src/Domains': [], // No dependencies
    'src/Applications': ['src/Domains'], // Only depends on Domains
    'src/Infrastructures': ['src/Domains', 'src/Applications'], // Depends on inner layers
    'src/Interfaces': ['src/Domains', 'src/Applications', 'src/Infrastructures'] // Depends on all inner layers
  },
  
  // File naming conventions
  namingConventions: {
    entities: /^[A-Z][a-zA-Z0-9]*\.js$/,
    repositories: /^[A-Z][a-zA-Z0-9]*Repository\.js$/,
    useCases: /^[A-Z][a-zA-Z0-9]*UseCase\.js$/,
    tests: /^.*\.test\.js$/,
    handlers: /^[a-z][a-zA-Z0-9]*Handler\.js$/
  },
  
  // Required methods in repositories
  repositoryMethods: [
    'add', 'get.*ById', 'get.*s', 'update', 'delete', 'verify.*Availability'
  ],
  
  // Security patterns to avoid
  securityAntiPatterns: [
    /password.*=.*['"].*['"]/, // Hardcoded passwords
    /api[_-]?key.*=.*['"].*['"]/, // Hardcoded API keys
    /secret.*=.*['"].*['"]/, // Hardcoded secrets
    /eval\s*\(/, // eval() usage
    /innerHTML\s*=/, // innerHTML usage
    /document\.write\s*\(/ // document.write usage
  ]
};

/**
 * Validation results collector
 */
class ValidationResults {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }
  
  addError(message, file = null, line = null) {
    this.errors.push({ type: 'error', message, file, line });
  }
  
  addWarning(message, file = null, line = null) {
    this.warnings.push({ type: 'warning', message, file, line });
  }
  
  addInfo(message, file = null, line = null) {
    this.info.push({ type: 'info', message, file, line });
  }
  
  hasErrors() {
    return this.errors.length > 0;
  }
  
  getTotal() {
    return this.errors.length + this.warnings.length + this.info.length;
  }
  
  print() {
    console.log('\n📊 Validation Results:\n');
    
    if (this.errors.length > 0) {
      console.log('❌ Errors:');
      this.errors.forEach(item => {
        const location = item.file ? ` (${item.file}${item.line ? `:${item.line}` : ''})` : '';
        console.log(`   • ${item.message}${location}`);
      });
      console.log('');
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach(item => {
        const location = item.file ? ` (${item.file}${item.line ? `:${item.line}` : ''})` : '';
        console.log(`   • ${item.message}${location}`);
      });
      console.log('');
    }
    
    if (this.info.length > 0) {
      console.log('💡 Info:');
      this.info.forEach(item => {
        const location = item.file ? ` (${item.file}${item.line ? `:${item.line}` : ''})` : '';
        console.log(`   • ${item.message}${location}`);
      });
      console.log('');
    }
    
    // Summary
    const total = this.getTotal();
    if (total === 0) {
      console.log('✅ No issues found!');
    } else {
      console.log(`📈 Summary: ${this.errors.length} errors, ${this.warnings.length} warnings, ${this.info.length} info`);
    }
  }
}

/**
 * Get all JavaScript files in a directory recursively
 */
function getJavaScriptFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      getJavaScriptFiles(fullPath, files);
    } else if (stat.isFile() && item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Validate Clean Architecture layer dependencies
 */
function validateLayerDependencies(results) {
  console.log('🏗️  Validating Clean Architecture layer dependencies...');
  
  const srcFiles = getJavaScriptFiles('src');
  
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(process.cwd(), file);
    
    // Determine which layer this file belongs to
    let currentLayer = null;
    for (const layer of Object.keys(VALIDATION_RULES.layerDependencies)) {
      if (relativePath.startsWith(layer)) {
        currentLayer = layer;
        break;
      }
    }
    
    if (!currentLayer) continue;
    
    // Check imports/requires
    const importRegex = /(?:require\s*\(\s*['"]([^'"]+)['"]|import.*from\s*['"]([^'"]+)['"])/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2];
      
      // Skip external modules
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        continue;
      }
      
      // Resolve relative path
      const resolvedPath = path.resolve(path.dirname(file), importPath);
      const relativeImportPath = path.relative(process.cwd(), resolvedPath);
      
      // Check if import violates layer dependency rules
      const allowedLayers = VALIDATION_RULES.layerDependencies[currentLayer];
      let isValidImport = false;
      
      for (const allowedLayer of allowedLayers) {
        if (relativeImportPath.startsWith(allowedLayer)) {
          isValidImport = true;
          break;
        }
      }
      
      // Check if importing from same layer (allowed)
      if (relativeImportPath.startsWith(currentLayer)) {
        isValidImport = true;
      }
      
      if (!isValidImport && relativeImportPath.startsWith('src/')) {
        results.addError(
          `Layer dependency violation: ${currentLayer} should not import from ${relativeImportPath}`,
          relativePath
        );
      }
    }
  }
}

/**
 * Validate file naming conventions
 */
function validateNamingConventions(results) {
  console.log('📝 Validating file naming conventions...');
  
  const checkNaming = (dir, pattern, type) => {
    if (!fs.existsSync(dir)) return;
    
    const files = getJavaScriptFiles(dir);
    
    for (const file of files) {
      const filename = path.basename(file);
      
      if (!pattern.test(filename)) {
        results.addWarning(
          `${type} file naming convention violation: ${filename}`,
          path.relative(process.cwd(), file)
        );
      }
    }
  };
  
  // Check entities
  checkNaming('src/Domains', VALIDATION_RULES.namingConventions.entities, 'Entity');
  
  // Check repositories
  const repoFiles = getJavaScriptFiles('src/Domains');
  for (const file of repoFiles) {
    const filename = path.basename(file);
    if (filename.includes('Repository') && !VALIDATION_RULES.namingConventions.repositories.test(filename)) {
      results.addWarning(
        `Repository naming convention violation: ${filename}`,
        path.relative(process.cwd(), file)
      );
    }
  }
  
  // Check use cases
  checkNaming('src/Applications/use_case', VALIDATION_RULES.namingConventions.useCases, 'UseCase');
  
  // Check tests
  checkNaming('tests', VALIDATION_RULES.namingConventions.tests, 'Test');
}

/**
 * Validate repository implementations
 */
function validateRepositories(results) {
  console.log('🗄️  Validating repository implementations...');
  
  const repoFiles = getJavaScriptFiles('src/Infrastructures/repository');
  
  for (const file of repoFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const filename = path.basename(file, '.js');
    
    if (!filename.includes('Repository')) continue;
    
    // Check if it extends the abstract repository
    const extendsRegex = /class\s+\w+\s+extends\s+(\w+Repository)/;
    const extendsMatch = content.match(extendsRegex);
    
    if (!extendsMatch) {
      results.addError(
        `Repository implementation should extend abstract repository: ${filename}`,
        path.relative(process.cwd(), file)
      );
    }
    
    // Check for required methods
    for (const methodPattern of VALIDATION_RULES.repositoryMethods) {
      const regex = new RegExp(`async\s+${methodPattern}\s*\\(`, 'g');
      if (!regex.test(content)) {
        results.addWarning(
          `Repository missing method pattern: ${methodPattern} in ${filename}`,
          path.relative(process.cwd(), file)
        );
      }
    }
  }
}

/**
 * Validate security patterns
 */
function validateSecurity(results) {
  console.log('🔒 Validating security patterns...');
  
  const allFiles = getJavaScriptFiles('src');
  
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      for (const pattern of VALIDATION_RULES.securityAntiPatterns) {
        if (pattern.test(line)) {
          results.addError(
            `Security anti-pattern detected: ${line.trim()}`,
            path.relative(process.cwd(), file),
            index + 1
          );
        }
      }
    });
  }
}

/**
 * Validate test coverage
 */
function validateTestCoverage(results) {
  console.log('🧪 Validating test coverage...');
  
  const srcFiles = getJavaScriptFiles('src');
  const testFiles = getJavaScriptFiles('tests');
  
  // Extract test file names (without .test.js)
  const testNames = testFiles.map(file => {
    const basename = path.basename(file, '.test.js');
    return basename.replace(/\.test$/, '');
  });
  
  // Check if important files have tests
  const importantPatterns = [
    /UseCase\.js$/,
    /Repository\.js$/,
    /entities\/.*\.js$/
  ];
  
  for (const file of srcFiles) {
    const filename = path.basename(file, '.js');
    const isImportant = importantPatterns.some(pattern => pattern.test(file));
    
    if (isImportant && !testNames.includes(filename)) {
      results.addWarning(
        `Missing test file for: ${filename}`,
        path.relative(process.cwd(), file)
      );
    }
  }
}

/**
 * Validate code style with ESLint
 */
function validateCodeStyle(results) {
  console.log('🎨 Validating code style with ESLint...');
  
  try {
    execSync('npx eslint src --format json', { stdio: 'pipe' });
    results.addInfo('ESLint validation passed');
  } catch (error) {
    try {
      const eslintOutput = JSON.parse(error.stdout.toString());
      
      for (const file of eslintOutput) {
        for (const message of file.messages) {
          const severity = message.severity === 2 ? 'addError' : 'addWarning';
          results[severity](
            `ESLint: ${message.message} (${message.ruleId})`,
            path.relative(process.cwd(), file.filePath),
            message.line
          );
        }
      }
    } catch (parseError) {
      results.addWarning('Could not parse ESLint output');
    }
  }
}

/**
 * Run all validations
 */
function runValidations(options = {}) {
  const results = new ValidationResults();
  
  console.log('🔍 Starting code validation...\n');
  
  try {
    if (!options.skipArchitecture) {
      validateLayerDependencies(results);
    }
    
    if (!options.skipNaming) {
      validateNamingConventions(results);
    }
    
    if (!options.skipRepositories) {
      validateRepositories(results);
    }
    
    if (!options.skipSecurity) {
      validateSecurity(results);
    }
    
    if (!options.skipTests) {
      validateTestCoverage(results);
    }
    
    if (!options.skipStyle) {
      validateCodeStyle(results);
    }
    
  } catch (error) {
    results.addError(`Validation error: ${error.message}`);
  }
  
  results.print();
  
  return results;
}

/**
 * Show usage information
 */
function showUsage() {
  console.log('\nCode Validator Tool\n');
  console.log('Usage: node tools/validators/code-validator.js [options]\n');
  console.log('Options:');
  console.log('  --skip-architecture    Skip Clean Architecture validation');
  console.log('  --skip-naming          Skip naming convention validation');
  console.log('  --skip-repositories    Skip repository validation');
  console.log('  --skip-security        Skip security pattern validation');
  console.log('  --skip-tests           Skip test coverage validation');
  console.log('  --skip-style           Skip code style validation');
  console.log('  --help                 Show this help message\n');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help')) {
  showUsage();
  process.exit(0);
}

const options = {
  skipArchitecture: args.includes('--skip-architecture'),
  skipNaming: args.includes('--skip-naming'),
  skipRepositories: args.includes('--skip-repositories'),
  skipSecurity: args.includes('--skip-security'),
  skipTests: args.includes('--skip-tests'),
  skipStyle: args.includes('--skip-style')
};

// Run validations
const results = runValidations(options);

// Exit with appropriate code
process.exit(results.hasErrors() ? 1 : 0);