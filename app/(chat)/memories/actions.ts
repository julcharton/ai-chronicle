'use server';

import { auth } from '@/app/(auth)/auth';
import { getDocumentsByUserId, saveDocument } from '@/lib/db/queries';
import type { Memory } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetches all memories for the current user
 */
export async function getMemories(): Promise<Memory[]> {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  try {
    // Fetch documents that are of type 'text' (memories)
    const documents = await getDocumentsByUserId({
      userId: session.user.id,
      kind: 'text',
    });

    // Map documents to Memory interface
    const memories = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content || '',
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.createdAt.toISOString(), // Using createdAt as updatedAt for now
    }));

    return memories;
  } catch (error) {
    console.error('Failed to fetch memories:', error);
    return [];
  }
}

/**
 * Creates a new memory document and returns its ID
 */
export async function createMemory(): Promise<
  { id: string } | { error: string }
> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  try {
    const id = uuidv4();
    const title = 'Untitled Memory';

    // Create new document with 'text' kind to represent a memory
    await saveDocument({
      id,
      title,
      content: '',
      kind: 'text',
      userId: session.user.id,
    });

    return { id };
  } catch (error) {
    console.error('Failed to create memory:', error);
    return { error: 'Failed to create memory' };
  }
}
