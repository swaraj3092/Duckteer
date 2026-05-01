import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;
console.log('Testing connection to:', uri.replace(/:([^@]+)@/, ':****@'));

const client = new MongoClient(uri, {
  tls: true,
  tlsAllowInvalidCertificates: true,
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected successfully to Atlas');
    const db = client.db('test');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections);
  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    await client.close();
  }
}

run();
