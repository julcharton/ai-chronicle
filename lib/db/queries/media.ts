import 'server-only';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { media, memory, type Media } from '../schema';

// Database client setup
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Adds media to a memory
 * @param memoryId - ID of the memory to attach media to
 * @param mediaData - Data for the new media
 * @returns The created media record
 */
export async function addMediaToMemory(
  memoryId: string,
  mediaData: Omit<Media, 'id' | 'memoryId' | 'createdAt'>,
) {
  try {
    // Verify the memory exists
    const [existingMemory] = await db
      .select()
      .from(memory)
      .where(eq(memory.id, memoryId))
      .limit(1);

    if (!existingMemory) {
      throw new Error(`Memory with id ${memoryId} not found`);
    }

    // Validate required fields
    if (!mediaData.fileUrl) {
      throw new Error('Media file URL is required');
    }

    if (!mediaData.type) {
      throw new Error('Media type is required');
    }

    // Insert the media
    const result = await db
      .insert(media)
      .values({
        memoryId,
        fileUrl: mediaData.fileUrl,
        type: mediaData.type,
        caption: mediaData.caption,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to add media to memory', error);
    throw error;
  }
}

/**
 * Updates existing media metadata
 * @param id - ID of the media to update
 * @param mediaData - New data for the media
 * @returns The updated media record
 */
export async function updateMedia(
  id: string,
  mediaData: Partial<Omit<Media, 'id' | 'memoryId' | 'createdAt'>>,
) {
  try {
    // Check if media exists
    const [existingMedia] = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (!existingMedia) {
      throw new Error(`Media with id ${id} not found`);
    }

    // Update the media
    const result = await db
      .update(media)
      .set(mediaData)
      .where(eq(media.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to update media', error);
    throw error;
  }
}

/**
 * Deletes media from a memory
 * @param id - ID of the media to delete
 * @returns The deletion result
 */
export async function deleteMedia(id: string) {
  try {
    return await db.delete(media).where(eq(media.id, id)).returning();
  } catch (error) {
    console.error('Failed to delete media', error);
    throw error;
  }
}

/**
 * Gets all media for a specific memory
 * @param memoryId - ID of the memory to get media for
 * @returns Array of media objects
 */
export async function getMediaByMemoryId(memoryId: string) {
  try {
    return await db.select().from(media).where(eq(media.memoryId, memoryId));
  } catch (error) {
    console.error('Failed to get media for memory', error);
    throw error;
  }
}

/**
 * Gets a single media item by ID
 * @param id - ID of the media to retrieve
 * @returns The media record
 */
export async function getMediaById(id: string) {
  try {
    const [result] = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (!result) {
      throw new Error(`Media with id ${id} not found`);
    }

    return result;
  } catch (error) {
    console.error('Failed to get media by id', error);
    throw error;
  }
}
