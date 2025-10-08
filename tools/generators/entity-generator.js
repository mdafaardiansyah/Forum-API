#!/usr/bin/env node

/**
 * Entity Generator Tool
 * 
 * This tool generates boilerplate code for new entities following Clean Architecture patterns.
 * It creates domain entities, repositories, use cases, and basic tests.
 */

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
 * Convert string to PascalCase
 */
function toPascalCase(str) {
  return str.replace(/(?:^|\s)\w/g, (match) => match.toUpperCase().replace(/\s/g, ''));
}

/**
 * Convert string to camelCase
 */
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert string to snake_case
 */
function toSnakeCase(str) {
  return str.replace(/\s+/g, '_').toLowerCase();
}

/**
 * Generate domain entity
 */
function generateEntity(entityName, fields) {
  const className = toPascalCase(entityName);
  
  let fieldValidations = '';
  let fieldAssignments = '';
  
  fields.forEach(field => {
    const fieldName = toCamelCase(field.name);
    fieldValidations += `    this._verifyPayload({ ${fieldName} });
`;
    fieldAssignments += `    this.${fieldName} = ${fieldName};
`;
  });

  return `class ${className} {
  constructor(payload) {
${fieldValidations}
${fieldAssignments}  }

  _verifyPayload({ ${fields.map(f => toCamelCase(f.name)).join(', ')} }) {
${fields.map(field => {
    const fieldName = toCamelCase(field.name);
    return `    if (!${fieldName}) {
      throw new Error('${className.toUpperCase()}.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof ${fieldName} !== '${field.type}') {
      throw new Error('${className.toUpperCase()}.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }`;
  }).join('\n\n')}
  }
}

module.exports = ${className};
`;
}

/**
 * Generate repository interface
 */
function generateRepositoryInterface(entityName) {
  const className = toPascalCase(entityName);
  const repositoryName = `${className}Repository`;
  const entityVar = toCamelCase(entityName);
  
  return `class ${repositoryName} {
  async add${className}(new${className}) {
    throw new Error('${repositoryName.toUpperCase()}.METHOD_NOT_IMPLEMENTED');
  }

  async get${className}ById(${entityVar}Id) {
    throw new Error('${repositoryName.toUpperCase()}.METHOD_NOT_IMPLEMENTED');
  }

  async get${className}s() {
    throw new Error('${repositoryName.toUpperCase()}.METHOD_NOT_IMPLEMENTED');
  }

  async update${className}(${entityVar}Id, update${className}) {
    throw new Error('${repositoryName.toUpperCase()}.METHOD_NOT_IMPLEMENTED');
  }

  async delete${className}(${entityVar}Id) {
    throw new Error('${repositoryName.toUpperCase()}.METHOD_NOT_IMPLEMENTED');
  }

  async verify${className}Availability(${entityVar}Id) {
    throw new Error('${repositoryName.toUpperCase()}.METHOD_NOT_IMPLEMENTED');
  }
}

module.exports = ${repositoryName};
`;
}

/**
 * Generate repository implementation
 */
function generateRepositoryImplementation(entityName) {
  const className = toPascalCase(entityName);
  const repositoryName = `${className}Repository`;
  const implName = `${className}RepositoryPostgres`;
  const entityVar = toCamelCase(entityName);
  const tableName = toSnakeCase(entityName) + 's';
  
  return `const ${repositoryName} = require('../../Domains/${entityVar}s/${className}Repository');
const Added${className} = require('../../Domains/${entityVar}s/entities/Added${className}');
const InvariantError = require('../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const { nanoid } = require('nanoid');

class ${implName} extends ${repositoryName} {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async add${className}(new${className}) {
    const { ${new${className}.constructor.name.replace('New', '').split('').map((char, i) => i === 0 ? char.toLowerCase() : char).join('')} } = new${className};
    const id = \`${entityVar}-\${this._idGenerator()}\`;
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO ${tableName} VALUES($1, $2, $3) RETURNING id, title, owner',
      values: [id, title, owner],
    };

    const result = await this._pool.query(query);

    return new Added${className}({ ...result.rows[0] });
  }

  async get${className}ById(${entityVar}Id) {
    const query = {
      text: 'SELECT * FROM ${tableName} WHERE id = $1',
      values: [${entityVar}Id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('${entityVar} tidak ditemukan');
    }

    return result.rows[0];
  }

  async get${className}s() {
    const query = {
      text: 'SELECT * FROM ${tableName} ORDER BY created_at DESC',
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async update${className}(${entityVar}Id, update${className}) {
    // Implementation for update
    throw new Error('${implName.toUpperCase()}.METHOD_NOT_IMPLEMENTED');
  }

  async delete${className}(${entityVar}Id) {
    const query = {
      text: 'DELETE FROM ${tableName} WHERE id = $1',
      values: [${entityVar}Id],
    };

    await this._pool.query(query);
  }

  async verify${className}Availability(${entityVar}Id) {
    const query = {
      text: 'SELECT id FROM ${tableName} WHERE id = $1',
      values: [${entityVar}Id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('${entityVar} tidak ditemukan');
    }
  }
}

module.exports = ${implName};
`;
}

/**
 * Generate use case
 */
function generateUseCase(entityName, action = 'Add') {
  const className = toPascalCase(entityName);
  const useCaseName = `${action}${className}UseCase`;
  const entityVar = toCamelCase(entityName);
  const repositoryVar = `${entityVar}Repository`;
  
  return `const New${className} = require('../../Domains/${entityVar}s/entities/New${className}');

class ${useCaseName} {
  constructor({ ${repositoryVar} }) {
    this._${repositoryVar} = ${repositoryVar};
  }

  async execute(useCasePayload) {
    const new${className} = new New${className}(useCasePayload);
    return this._${repositoryVar}.add${className}(new${className});
  }
}

module.exports = ${useCaseName};
`;
}

/**
 * Generate test file
 */
function generateTest(entityName, type = 'entity') {
  const className = toPascalCase(entityName);
  
  if (type === 'entity') {
    return `const ${className} = require('../${className}');

describe('a ${className} entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      // missing required properties
    };

    // Action and Assert
    expect(() => new ${className}(payload)).toThrowError('${className.toUpperCase()}.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      // wrong data types
    };

    // Action and Assert
    expect(() => new ${className}(payload)).toThrowError('${className.toUpperCase()}.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create ${className} object correctly', () => {
    // Arrange
    const payload = {
      // correct payload
    };

    // Action
    const { /* destructure properties */ } = new ${className}(payload);

    // Assert
    // Add assertions here
  });
});
`;
  }
  
  return `// Test file for ${className}\n// TODO: Implement tests\n`;
}

/**
 * Create directory if it doesn't exist
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate all files for an entity
 */
async function generateEntityFiles(entityName, fields) {
  const entityVar = toCamelCase(entityName);
  const className = toPascalCase(entityName);
  
  console.log(`\n🏗️  Generating files for ${className} entity...`);
  
  // Create directories
  const domainDir = path.join('src', 'Domains', `${entityVar}s`);
  const entitiesDir = path.join(domainDir, 'entities');
  const infraDir = path.join('src', 'Infrastructures', 'repository');
  const useCaseDir = path.join('src', 'Applications', 'use_case');
  const testDir = path.join('tests', 'domains', `${entityVar}s`, 'entities');
  
  ensureDirectoryExists(entitiesDir);
  ensureDirectoryExists(infraDir);
  ensureDirectoryExists(useCaseDir);
  ensureDirectoryExists(testDir);
  
  // Generate files
  const files = [
    {
      path: path.join(entitiesDir, `New${className}.js`),
      content: generateEntity(`New${entityName}`, fields)
    },
    {
      path: path.join(entitiesDir, `Added${className}.js`),
      content: generateEntity(`Added${entityName}`, fields)
    },
    {
      path: path.join(domainDir, `${className}Repository.js`),
      content: generateRepositoryInterface(entityName)
    },
    {
      path: path.join(infraDir, `${className}RepositoryPostgres.js`),
      content: generateRepositoryImplementation(entityName)
    },
    {
      path: path.join(useCaseDir, `Add${className}UseCase.js`),
      content: generateUseCase(entityName, 'Add')
    },
    {
      path: path.join(testDir, `New${className}.test.js`),
      content: generateTest(`New${entityName}`, 'entity')
    }
  ];
  
  // Write files
  files.forEach(file => {
    fs.writeFileSync(file.path, file.content);
    console.log(`✅ Created: ${file.path}`);
  });
  
  console.log(`\n🎉 Successfully generated ${className} entity files!`);
  console.log('\n📝 Next steps:');
  console.log('   1. Update the database migration');
  console.log('   2. Register dependencies in container');
  console.log('   3. Create HTTP handlers and routes');
  console.log('   4. Write comprehensive tests');
  console.log('   5. Update API documentation');
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Entity Generator Tool\n');
  
  try {
    // Get entity name
    const entityName = await askQuestion('Enter entity name (e.g., "Product", "Category"): ');
    
    if (!entityName.trim()) {
      console.error('❌ Entity name is required');
      process.exit(1);
    }
    
    // Get fields
    console.log('\nEnter entity fields (press Enter with empty name to finish):');
    const fields = [];
    
    while (true) {
      const fieldName = await askQuestion(`Field name: `);
      
      if (!fieldName.trim()) {
        break;
      }
      
      const fieldType = await askQuestion(`Field type (string/number/boolean): `);
      
      fields.push({
        name: fieldName.trim(),
        type: fieldType.trim() || 'string'
      });
    }
    
    if (fields.length === 0) {
      console.error('❌ At least one field is required');
      process.exit(1);
    }
    
    // Generate files
    await generateEntityFiles(entityName.trim(), fields);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Entity Generator Tool\n');
  console.log('This tool generates boilerplate code for new entities following Clean Architecture patterns.\n');
  console.log('Usage: node tools/generators/entity-generator.js\n');
  console.log('The tool will interactively ask for:');
  console.log('  - Entity name');
  console.log('  - Entity fields and their types\n');
  console.log('Generated files:');
  console.log('  - Domain entities (New*, Added*)');
  console.log('  - Repository interface and implementation');
  console.log('  - Use case');
  console.log('  - Basic tests\n');
  process.exit(0);
}

// Run the generator
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});