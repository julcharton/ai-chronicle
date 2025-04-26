import type { BaseRepository } from './base-repository';
import { dbClient } from './db-client';
import { chat, message } from '../db/schema';
import type { Chat, DBMessage } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Repository for chat-related database operations
 */
export class ChatRepository implements BaseRepository<Chat, string> {
  /**
   * Find a chat by ID
   * @param id Chat ID
   * @returns Chat if found, null otherwise
   */
  async findById(id: string): Promise<Chat | null> {
    return await dbClient.executeWithRetry(async () => {
      const [result] = await dbClient.db
        .select()
        .from(chat)
        .where(eq(chat.id, id));

      return result || null;
    });
  }

  /**
   * Find all chats
   * @returns Array of all chats
   */
  async findAll(): Promise<Chat[]> {
    return await dbClient.executeWithRetry(async () => {
      return await dbClient.db
        .select()
        .from(chat)
        .orderBy(desc(chat.createdAt));
    });
  }

  /**
   * Create a new chat
   * @param entity Chat data to create
   * @returns Created chat
   */
  async create(entity: Partial<Chat>): Promise<Chat> {
    return await dbClient.executeWithRetry(async () => {
      if (!entity.id || !entity.userId || !entity.title) {
        throw new Error('Chat id, userId, and title are required');
      }

      const [createdChat] = await dbClient.db
        .insert(chat)
        .values({
          id: entity.id,
          title: entity.title,
          userId: entity.userId,
          createdAt: new Date(),
          visibility: entity.visibility ?? 'private',
          memoryId: entity.memoryId,
        })
        .returning();

      if (!createdChat) {
        throw new Error('Failed to create chat');
      }

      return createdChat;
    });
  }

  /**
   * Update an existing chat
   * @param id Chat ID
   * @param data Chat data to update
   * @returns Updated chat
   */
  async update(id: string, data: Partial<Chat>): Promise<Chat> {
    return await dbClient.executeWithRetry(async () => {
      const updateData: any = {};

      if (data.title !== undefined) {
        updateData.title = data.title;
      }

      if (data.visibility !== undefined) {
        updateData.visibility = data.visibility;
      }

      if (data.memoryId !== undefined) {
        updateData.memoryId = data.memoryId;
      }

      const [updatedChat] = await dbClient.db
        .update(chat)
        .set(updateData)
        .where(eq(chat.id, id))
        .returning();

      if (!updatedChat) {
        throw new Error(`Chat with ID ${id} not found`);
      }

      return updatedChat;
    });
  }

  /**
   * Delete a chat by ID
   * @param id Chat ID
   * @returns Boolean indicating success
   */
  async delete(id: string): Promise<boolean> {
    return await dbClient.transaction(async () => {
      // Delete associated messages first
      await dbClient.db.delete(message).where(eq(message.chatId, id));

      // Then delete the chat
      const result = await dbClient.db
        .delete(chat)
        .where(eq(chat.id, id))
        .returning({ id: chat.id });

      return result.length > 0;
    });
  }

  /**
   * Find chats by user ID
   * @param userId User ID
   * @returns Array of chats belonging to the user
   */
  async findByUserId(userId: string): Promise<Chat[]> {
    return await dbClient.executeWithRetry(async () => {
      return await dbClient.db
        .select()
        .from(chat)
        .where(eq(chat.userId, userId))
        .orderBy(desc(chat.createdAt));
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
   * Find chats associated with a memory
   * @param memoryId Memory ID
   * @returns Array of chats related to the memory
   */
  async findByMemoryId(memoryId: string): Promise<Chat[]> {
    return await dbClient.executeWithRetry(async () => {
      return await dbClient.db
        .select()
        .from(chat)
        .where(eq(chat.memoryId, memoryId))
        .orderBy(desc(chat.createdAt));
    });
  }

  /**
   * Create a memory chat with specialized handling
   * @param memoryId Memory ID
   * @param userId User ID
   * @param title Title for the chat
   * @returns Created chat
   */
  async createMemoryChat(
    memoryId: string,
    userId: string,
    title: string,
  ): Promise<Chat> {
    return await dbClient.executeWithRetry(async () => {
      const chatId = uuidv4();

      const [createdChat] = await dbClient.db
        .insert(chat)
        .values({
          id: chatId,
          title,
          userId,
          memoryId,
          createdAt: new Date(),
          visibility: 'private',
        })
        .returning();

      if (!createdChat) {
        throw new Error('Failed to create memory chat');
      }

      return createdChat;
    });
  }

  /**
   * Add messages to a chat
   * @param chatId Chat ID
   * @param messages Array of messages to add
   * @returns Boolean indicating success
   */
  async addMessages(
    chatId: string,
    messages: Omit<DBMessage, 'id' | 'chatId'>[],
  ): Promise<boolean> {
    return await dbClient.executeWithRetry(async () => {
      // Check if chat exists
      const chatExists = await this.findById(chatId);

      if (!chatExists) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }

      // Insert messages
      const messagesToInsert = messages.map((msg) => ({
        id: uuidv4(),
        chatId,
        role: msg.role,
        parts: msg.parts,
        attachments: msg.attachments,
        createdAt: msg.createdAt ?? new Date(),
      }));

      const result = await dbClient.db
        .insert(message)
        .values(messagesToInsert)
        .returning({ id: message.id });

      return result.length === messages.length;
    });
  }

  /**
   * Get all messages for a chat
   * @param chatId Chat ID
   * @returns Array of messages
   */
  async getMessages(chatId: string): Promise<DBMessage[]> {
    return await dbClient.executeWithRetry(async () => {
      return await dbClient.db
        .select()
        .from(message)
        .where(eq(message.chatId, chatId))
        .orderBy(desc(message.createdAt));
    });
  }
}
