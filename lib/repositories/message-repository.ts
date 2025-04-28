import type { BaseRepository } from './base-repository';
import { dbClient } from './db-client';
import { message, chat } from '../db/schema';
import type { DBMessage } from '../db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Repository for message-related database operations
 */
export class MessageRepository implements BaseRepository<DBMessage, string> {
  /**
   * Find a message by ID
   * @param id Message ID
   * @returns Message if found, null otherwise
   */
  async findById(id: string): Promise<DBMessage | null> {
    return await dbClient.executeWithRetry(async () => {
      const [result] = await dbClient.db
        .select()
        .from(message)
        .where(eq(message.id, id));

      return result || null;
    });
  }

  /**
   * Find all messages (with optional limit)
   * @param limit Optional limit on number of messages returned
   * @returns Array of messages
   */
  async findAll(limit?: number): Promise<DBMessage[]> {
    return await dbClient.executeWithRetry(async () => {
      const query = dbClient.db
        .select()
        .from(message)
        .orderBy(desc(message.createdAt));

      if (limit) {
        // Apply limit in JS
        return (await query).slice(0, limit);
      }

      return await query;
    });
  }

  /**
   * Create a new message
   * @param entity Message data to create
   * @returns Created message
   */
  async create(entity: Partial<DBMessage>): Promise<DBMessage> {
    return await dbClient.executeWithRetry(async () => {
      if (!entity.chatId || !entity.role || !entity.parts) {
        throw new Error('Message chatId, role, and parts are required');
      }

      // Create message ID if not provided
      const messageId = entity.id || uuidv4();

      // Ensure chat exists
      const [chatExists] = await dbClient.db
        .select({ id: chat.id })
        .from(chat)
        .where(eq(chat.id, entity.chatId));

      if (!chatExists) {
        throw new Error(`Chat with ID ${entity.chatId} not found`);
      }

      const [createdMessage] = await dbClient.db
        .insert(message)
        .values({
          id: messageId,
          chatId: entity.chatId,
          role: entity.role,
          parts: entity.parts,
          attachments: entity.attachments || [],
          createdAt: entity.createdAt || new Date(),
        })
        .returning();

      if (!createdMessage) {
        throw new Error('Failed to create message');
      }

      return createdMessage;
    });
  }

  /**
   * Update an existing message
   * @param id Message ID
   * @param data Message data to update
   * @returns Updated message
   */
  async update(id: string, data: Partial<DBMessage>): Promise<DBMessage> {
    return await dbClient.executeWithRetry(async () => {
      const updateData: any = {};

      if (data.parts !== undefined) {
        updateData.parts = data.parts;
      }

      if (data.role !== undefined) {
        updateData.role = data.role;
      }

      if (data.attachments !== undefined) {
        updateData.attachments = data.attachments;
      }

      const [updatedMessage] = await dbClient.db
        .update(message)
        .set(updateData)
        .where(eq(message.id, id))
        .returning();

      if (!updatedMessage) {
        throw new Error(`Message with ID ${id} not found`);
      }

      return updatedMessage;
    });
  }

  /**
   * Delete a message by ID
   * @param id Message ID
   * @returns Boolean indicating success
   */
  async delete(id: string): Promise<boolean> {
    return await dbClient.executeWithRetry(async () => {
      const result = await dbClient.db
        .delete(message)
        .where(eq(message.id, id))
        .returning({ id: message.id });

      return result.length > 0;
    });
  }

  /**
   * Find messages by user ID (via chat association)
   * @param userId User ID
   * @returns Array of messages from the user's chats
   */
  async findByUserId(userId: string): Promise<DBMessage[]> {
    return await dbClient.executeWithRetry(async () => {
      // Find user's chats first
      const userChats = await dbClient.db
        .select({ id: chat.id })
        .from(chat)
        .where(eq(chat.userId, userId));

      if (userChats.length === 0) {
        return [];
      }

      // Extract chat IDs
      const chatIds = userChats.map((c) => c.id);

      // Find messages from these chats
      if (chatIds.length === 1) {
        return await dbClient.db
          .select()
          .from(message)
          .where(eq(message.chatId, chatIds[0]))
          .orderBy(desc(message.createdAt));
      } else {
        return await dbClient.db
          .select()
          .from(message)
          .where(inArray(message.chatId, chatIds))
          .orderBy(desc(message.createdAt));
      }
    });
  }

  /**
   * Find messages by chat ID
   * @param chatId Chat ID
   * @param limit Optional limit on number of messages returned
   * @returns Array of messages from the chat
   */
  async findByChatId(chatId: string, limit?: number): Promise<DBMessage[]> {
    return await dbClient.executeWithRetry(async () => {
      const query = dbClient.db
        .select()
        .from(message)
        .where(eq(message.chatId, chatId))
        .orderBy(desc(message.createdAt));

      if (limit) {
        // Apply limit in JS
        return (await query).slice(0, limit);
      }

      return await query;
    });
  }

  /**
   * Create multiple messages at once
   * @param messages Array of message data to create
   * @returns Boolean indicating success
   */
  async createMany(messages: Partial<DBMessage>[]): Promise<boolean> {
    if (messages.length === 0) {
      return true;
    }

    return await dbClient.transaction(async () => {
      const insertedIds = [];

      for (const msg of messages) {
        if (!msg.chatId || !msg.role || !msg.parts) {
          throw new Error('Each message needs chatId, role, and parts');
        }

        // Create message ID if not provided
        const messageId = msg.id || uuidv4();

        const [createdMessage] = await dbClient.db
          .insert(message)
          .values({
            id: messageId,
            chatId: msg.chatId,
            role: msg.role,
            parts: msg.parts,
            attachments: msg.attachments || [],
            createdAt: msg.createdAt || new Date(),
          })
          .returning({ id: message.id });

        if (createdMessage) {
          insertedIds.push(createdMessage.id);
        }
      }

      return insertedIds.length === messages.length;
    });
  }

  /**
   * Run a database transaction
   * @param operation Function containing operations to execute in a transaction
   * @returns Result of the transaction
   */
  async transaction<R>(operation: () => Promise<R>): Promise<R> {
    return await dbClient.transaction(operation);
  }
}
