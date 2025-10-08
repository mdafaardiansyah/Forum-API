/* istanbul ignore file */
const { Pool } = require('pg');

const testConfig = {
  host: process.env.PGHOST_TEST,
  port: process.env.PGPORT_TEST,
  user: process.env.PGUSER_TEST,
  password: process.env.PGPASSWORD_TEST,
  database: process.env.PGDATABASE_TEST,
};

const isTest = process.env.NODE_ENV === 'test';
let pool;

if (isTest) {
  pool = new Pool(testConfig);
} else if (process.env.DATABASE_URL) {
  // Heroku provides DATABASE_URL and requires SSL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  pool = new Pool();
}

module.exports = pool;
