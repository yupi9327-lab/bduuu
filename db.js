const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL database-ə bağlantı uğurlu!');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL bağlantı xətası:', err);
});

module.exports = pool;
