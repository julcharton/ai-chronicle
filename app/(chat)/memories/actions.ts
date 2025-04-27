'use server';

import { auth } from '@/app/(auth)/auth';
import { getMemoryRepository, getChatRepository } from '@/lib/repositories';
import type { Memory, MemoryMetadata } from '@/lib/types';
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
    // Use the memory repository to fetch memories
    const memoryRepository = getMemoryRepository();
    const memories = await memoryRepository.findByUserId(session.user.id);

    // Map database memories to Memory interface
    return memories.map((mem) => ({
      id: mem.id,
      title: mem.title,
      content: mem.content || '',
      createdAt: mem.createdAt.toISOString(),
      updatedAt: mem.updatedAt.toISOString(),
      userId: mem.userId,
      // Extract metadata fields or use defaults
      ...((mem.metadata as MemoryMetadata) || {}),
    }));
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
    const metadata: MemoryMetadata = {
      tags: [],
      isPublic: false,
      aiGenerated: false,
    };

    // Use the memory repository to create a new memory
    const memoryRepository = getMemoryRepository();
    await memoryRepository.create({
      id,
      title,
      content: '',
      userId: session.user.id,
      metadata,
    });

    return { id };
  } catch (error) {
    console.error('Failed to create memory:', error);
    return { error: 'Failed to create memory' };
  }
}

/**
 * Gets or creates a chat associated with a memory
 */
export async function getChatForMemory(
  memoryId: string,
): Promise<{ chatId: string } | { error: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  try {
    // Get chat repository to check for existing chats
    const chatRepository = getChatRepository();

    // Try to find an existing chat for this memory
    const existingChats = await chatRepository.findByMemoryId(memoryId);

    if (existingChats.length > 0) {
      // Use the first chat associated with this memory
      return { chatId: existingChats[0].id };
    }

    // Create a new chat for this memory
    const chat = await chatRepository.createMemoryChat(
      memoryId,
      session.user.id,
      'Memory Chat',
    );

    return { chatId: chat.id };
  } catch (error) {
    console.error('Failed to get/create chat for memory:', error);
    return { error: 'Failed to initialize memory chat' };
  }
}
