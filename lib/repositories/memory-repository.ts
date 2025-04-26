import type { BaseRepository } from './base-repository';
import { dbClient } from './db-client';
import { memory } from '../db/schema';
import type { Memory } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import type { MemoryMetadata } from '@/lib/types';

/**
 * Repository for memory-related database operations
 */
export class MemoryRepository implements BaseRepository<Memory, string> {
  /**
   * Find a memory by ID
   * @param id Memory ID
   * @returns Memory if found, null otherwise
   */
  async findById(id: string): Promise<Memory | null> {
    return await dbClient.executeWithRetry(async () => {
      const [result] = await dbClient.db
        .select()
        .from(memory)
        .where(eq(memory.id, id));

      return result || null;
    });
  }

  /**
   * Find all memories
   * @returns Array of all memories
   */
  async findAll(): Promise<Memory[]> {
    return await dbClient.executeWithRetry(async () => {
      return await dbClient.db
        .select()
        .from(memory)
        .orderBy(desc(memory.createdAt));
    });
  }

  /**
   * Create a new memory
   * @param entity Memory data to create
   * @returns Created memory
   */
  async create(entity: Partial<Memory>): Promise<Memory> {
    return await dbClient.executeWithRetry(async () => {
      const createdAt = new Date();

      if (!entity.id || !entity.userId) {
        throw new Error('Memory id and userId are required');
      }

      const [createdMemory] = await dbClient.db
        .insert(memory)
        .values({
          id: entity.id,
          title: entity.title ?? 'Untitled Memory',
          content: entity.content ?? '',
          userId: entity.userId,
          createdAt,
          updatedAt: createdAt,
          metadata: entity.metadata ?? null,
        })
        .returning();

      if (!createdMemory) {
        throw new Error('Failed to create memory');
      }

      return createdMemory;
    });
  }

  /**
   * Update an existing memory
   * @param id Memory ID
   * @param data Memory data to update
   * @returns Updated memory
   */
  async update(id: string, data: Partial<Memory>): Promise<Memory> {
    return await dbClient.executeWithRetry(async () => {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.title !== undefined) {
        updateData.title = data.title;
      }

      if (data.content !== undefined) {
        updateData.content = data.content;
      }

      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata;
      }

      const [updatedMemory] = await dbClient.db
        .update(memory)
        .set(updateData)
        .where(eq(memory.id, id))
        .returning();

      if (!updatedMemory) {
        throw new Error(`Memory with ID ${id} not found`);
      }

      return updatedMemory;
    });
  }

  /**
   * Delete a memory by ID
   * @param id Memory ID
   * @returns Boolean indicating success
   */
  async delete(id: string): Promise<boolean> {
    return await dbClient.executeWithRetry(async () => {
      const result = await dbClient.db
        .delete(memory)
        .where(eq(memory.id, id))
        .returning({ id: memory.id });

      return result.length > 0;
    });
  }

  /**
   * Find memories by user ID
   * @param userId User ID
   * @returns Array of memories belonging to the user
   */
  async findByUserId(userId: string): Promise<Memory[]> {
    return await dbClient.executeWithRetry(async () => {
      return await dbClient.db
        .select()
        .from(memory)
        .where(eq(memory.userId, userId))
        .orderBy(desc(memory.createdAt));
    });
  }

  /**
   * Update memory metadata
   * @param id Memory ID
   * @param metadata Memory metadata to update
   * @returns Updated memory
   */
  async updateMetadata(id: string, metadata: MemoryMetadata): Promise<Memory> {
    return await dbClient.executeWithRetry(async () => {
      // First get the existing memory to merge metadata properly
      const existingMemory = await this.findById(id);

      if (!existingMemory) {
        throw new Error(`Memory with ID ${id} not found`);
      }

      // Merge existing metadata with new metadata
      const updatedMetadata = {
        ...((existingMemory.metadata as Record<string, any>) || {}),
        ...metadata,
      };

      const [updatedMemory] = await dbClient.db
        .update(memory)
        .set({
          metadata: updatedMetadata,
          updatedAt: new Date(),
        })
        .where(eq(memory.id, id))
        .returning();

      return updatedMemory;
    });
  }

  /**
   * Execute a transaction
   * @param operation Function to execute in transaction
   * @returns Result of the transaction
   */
  async transaction<R>(operation: () => Promise<R>): Promise<R> {
    return await dbClient.transaction(operation);
  }

  /**
   * Auto-save memory content with retry logic
   * This is specifically designed for frequent updates during editing
   * @param id Memory ID
   * @param content Content to save
   * @returns Updated memory
   */
  async autoSave(id: string, content: string): Promise<Memory> {
    return await dbClient.executeWithRetry(async () => {
      const [updatedMemory] = await dbClient.db
        .update(memory)
        .set({
          content,
          updatedAt: new Date(),
        })
        .where(eq(memory.id, id))
        .returning();

      if (!updatedMemory) {
        throw new Error(`Memory with ID ${id} not found`);
      }

      return updatedMemory;
    });
  }

  /**
   * Find memories by tags
   * @param userId User ID
   * @param tags Array of tags to filter by
   * @returns Array of memories with the specified tags
   */
  async findByTags(userId: string, tags: string[]): Promise<Memory[]> {
    // Note: This is a simplified implementation
    // In real PostgreSQL, we would use JSONB containment operators
    // For now, we'll fetch all memories for the user and filter in-memory

    const userMemories = await this.findByUserId(userId);

    return userMemories.filter((mem) => {
      const memoryTags = (mem.metadata as any)?.tags || [];
      return tags.some((tag) => memoryTags.includes(tag));
    });
  }
}
