// DEPRECATED: This migration script is no longer needed as the database schema has been updated.
// The Message and Vote tables have been properly renamed and the old tables have been removed.
// Keeping this file for historical reference only.

import { config } from 'dotenv';
import postgres from 'postgres';
import { chat, message, vote } from '../schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import { inArray } from 'drizzle-orm';
import { appendResponseMessages, UIMessage } from 'ai';

config({
  path: '.env.local',
});

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

// This function is no longer needed as the migration has been completed
async function createNewTable() {
  console.info('This migration script is deprecated and no longer needed.');
  console.info('The database schema has already been updated.');
  console.info('No migration will be performed.');
}

createNewTable()
  .then(() => {
    console.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
