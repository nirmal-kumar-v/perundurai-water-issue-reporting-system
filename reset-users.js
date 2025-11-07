// reset-users.js - Clear users collection so new credentials are seeded
const { MongoClient } = require('mongodb');

const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'water_complaint_system';

async function resetUsers() {
  try {
    const client = await MongoClient.connect(MONGO_URL);
    const db = client.db(DB_NAME);
    
    console.log('🗑️  Dropping users collection...');
    await db.collection('users').drop().catch(() => console.log('Collection does not exist, will create new'));
    
    console.log('✅ Users collection reset');
    console.log('👉 Now restart your server to load new credentials:');
    console.log('   node server/server.js');
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetUsers();
