const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runMigrations() {
  try {
    console.log('🔄 Database migration başlayır...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    
    console.log('✅ Database migration uğurla tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration xətası:', error);
    process.exit(1);
  }
}

runMigrations();
