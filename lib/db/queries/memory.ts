import 'server-only';

import { and, eq, inArray, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm/sql';
import postgres from 'postgres';
import { memory, media, type Memory, memoryPermission, user } from '../schema';

// Database client setup
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Creates a new memory record
 * @param userId - ID of the user creating the memory
 * @param memoryData - Data for the new memory
 * @returns The result of the insertion operation
 */
export async function createMemory(
  userId: string,
  memoryData: Omit<Memory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
) {
  try {
    // Validate required fields
    if (!memoryData.title) {
      throw new Error('Memory title is required');
    }

    if (!memoryData.occurredAt) {
      throw new Error('Memory occurred date is required');
    }

    if (!memoryData.blocks) {
      throw new Error('Memory content blocks are required');
    }

    // Initialize tags array if not provided
    const tags = memoryData.tags || [];

    // Insert the memory
    const result = await db
      .insert(memory)
      .values({
        userId,
        title: memoryData.title,
        occurredAt: memoryData.occurredAt,
        visibility: memoryData.visibility || 'private',
        source: memoryData.source,
        blocks: memoryData.blocks,
        tags,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to create memory in database', error);
    throw error;
  }
}

/**
 * Retrieves a single memory with its associated media
 * @param id - ID of the memory to retrieve
 * @returns The memory with its media attachments
 */
export async function getMemoryById(id: string) {
  try {
    // Get the memory
    const [memoryResult] = await db
      .select()
      .from(memory)
      .where(eq(memory.id, id))
      .limit(1);

    if (!memoryResult) {
      throw new Error(`Memory with id ${id} not found`);
    }

    // Get associated media
    const mediaResults = await db
      .select()
      .from(media)
      .where(eq(media.memoryId, id));

    return {
      ...memoryResult,
      media: mediaResults,
    };
  } catch (error) {
    console.error('Failed to get memory by id from database', error);
    throw error;
  }
}

/**
 * Retrieves all memories for a user
 * @param userId - ID of the user whose memories to retrieve
 * @param limit - Maximum number of memories to return
 * @param offset - Number of memories to skip
 * @returns The user's memories
 */
export async function getMemoriesByUserId(
  userId: string,
  limit = 20,
  offset = 0,
) {
  try {
    // Get all memories for the user
    const memories = await db
      .select()
      .from(memory)
      .where(eq(memory.userId, userId))
      .limit(limit)
      .offset(offset);

    // Return empty array if no memories found
    if (!memories.length) {
      return { memories: [], count: 0 };
    }

    // Get total count for pagination
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memory)
      .where(eq(memory.userId, userId));

    // Get media for each memory
    const memoryIds = memories.map((m) => m.id);

    const allMedia =
      memoryIds.length > 0
        ? await db
            .select()
            .from(media)
            .where(inArray(media.memoryId, memoryIds))
        : [];

    // Group media by memory ID
    const mediaByMemoryId = allMedia.reduce(
      (acc, m) => {
        if (!acc[m.memoryId]) {
          acc[m.memoryId] = [];
        }
        acc[m.memoryId].push(m);
        return acc;
      },
      {} as Record<string, typeof allMedia>,
    );

    // Add media to each memory
    const memoriesWithMedia = memories.map((m) => ({
      ...m,
      media: mediaByMemoryId[m.id] || [],
    }));

    return {
      memories: memoriesWithMedia,
      count: Number(result.count),
    };
  } catch (error) {
    console.error('Failed to get memories by user id from database', error);
    throw error;
  }
}

/**
 * Updates an existing memory
 * @param id - ID of the memory to update
 * @param memoryData - New data for the memory
 * @returns The updated memory
 */
export async function updateMemory(
  id: string,
  memoryData: Partial<
    Omit<Memory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >,
) {
  try {
    // Check if memory exists
    const [existingMemory] = await db
      .select()
      .from(memory)
      .where(eq(memory.id, id))
      .limit(1);

    if (!existingMemory) {
      throw new Error(`Memory with id ${id} not found`);
    }

    // Update the memory
    const result = await db
      .update(memory)
      .set({
        ...memoryData,
        updatedAt: new Date(),
      })
      .where(eq(memory.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to update memory in database', error);
    throw error;
  }
}

/**
 * Deletes a memory and its associated media
 * @param id - ID of the memory to delete
 * @returns The deletion result
 */
export async function deleteMemory(id: string) {
  try {
    // The cascade delete will handle associated media deletion automatically
    return await db.delete(memory).where(eq(memory.id, id)).returning();
  } catch (error) {
    console.error('Failed to delete memory from database', error);
    throw error;
  }
}

/**
 * Retrieves memories visible to a user based on permissions and relationships
 * @param userId - ID of the user viewing the memories
 * @param limit - Maximum number of memories to return
 * @param offset - Number of memories to skip
 * @returns Memories the user has permission to view
 */
export async function getVisibleMemories(
  userId: string,
  limit = 20,
  offset = 0,
) {
  try {
    // Get memories the user has explicit permission to view
    const userPermissions = await db
      .select()
      .from(memoryPermission)
      .where(
        and(
          eq(memoryPermission.userId, userId),
          eq(memoryPermission.permissionType, 'view'),
        ),
      );

    const permissionMemoryIds = userPermissions.map((p) => p.memoryId);

    // Get user's own memories and public memories
    const memories = await db
      .select()
      .from(memory)
      .where(
        or(
          eq(memory.userId, userId),
          eq(memory.visibility, 'public'),
          permissionMemoryIds.length > 0
            ? inArray(memory.id, permissionMemoryIds)
            : eq(memory.id, ''), // This will never match but is safer than a null check
        ),
      )
      .limit(limit)
      .offset(offset);

    // Get media for these memories
    const memoryIds = memories.map((m) => m.id);

    const allMedia =
      memoryIds.length > 0
        ? await db
            .select()
            .from(media)
            .where(inArray(media.memoryId, memoryIds))
        : [];

    // Group media by memory ID
    const mediaByMemoryId = allMedia.reduce(
      (acc, m) => {
        if (!acc[m.memoryId]) {
          acc[m.memoryId] = [];
        }
        acc[m.memoryId].push(m);
        return acc;
      },
      {} as Record<string, typeof allMedia>,
    );

    // Add media to each memory
    const memoriesWithMedia = memories.map((m) => ({
      ...m,
      media: mediaByMemoryId[m.id] || [],
    }));

    return memoriesWithMedia;
  } catch (error) {
    console.error('Failed to get visible memories from database', error);
    throw error;
  }
}
