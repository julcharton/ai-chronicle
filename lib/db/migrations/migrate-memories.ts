// Migration script to move memory documents to the dedicated memory table
import 'server-only';
import { db } from '@/lib/db/client';
import { document, memory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Migrates memory documents (documents with kind='text') to the memory table
 * This is a one-time migration to transition from using the document table for memories
 * to using the dedicated memory table
 */
export async function migrateMemoriesToDedicatedTable() {
  try {
    console.log('Starting memory migration...');
    
    // Get all documents with kind='text'
    const memoryDocuments = await db
      .select()
      .from(document)
      .where(eq(document.kind, 'text'));
    
    console.log(`Found ${memoryDocuments.length} memory documents to migrate`);
    
    // For each document, create a corresponding memory
    for (const doc of memoryDocuments) {
      console.log(`Migrating memory document: ${doc.id}`);
      
      try {
        // Insert into memory table
        await db.insert(memory).values({
          id: doc.id,
          title: doc.title,
          content: doc.content || '',
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          userId: doc.userId,
          metadata: doc.metadata,
        });
        
        console.log(`Successfully migrated memory: ${doc.id}`);
      } catch (error) {
        console.error(`Failed to migrate memory ${doc.id}:`, error);
      }
    }
    
    console.log('Memory migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
} 