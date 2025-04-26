import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatRepository } from '@/lib/repositories/chat-repository';
import { dbClient } from '@/lib/repositories/db-client';

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => '123e4567-e89b-12d3-a456-426614174000',
}));

// Mock the dbClient
vi.mock('@/lib/repositories/db-client', () => {
  return {
    dbClient: {
      executeWithRetry: vi.fn((fn) => fn()),
      transaction: vi.fn((fn) => fn()),
      db: {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => [
                {
                  id: '1',
                  title: 'Test Chat',
                  userId: 'user1',
                  memoryId: 'memory1',
                },
              ]),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() => [
              {
                id: '1',
                title: 'Test Chat',
                userId: 'user1',
                memoryId: 'memory1',
              },
            ]),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn(() => [
                {
                  id: '1',
                  title: 'Updated Chat',
                  userId: 'user1',
                  memoryId: 'memory1',
                },
              ]),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => [{ id: '1' }]),
          })),
        })),
      },
    },
  };
});

describe('ChatRepository', () => {
  let repository: ChatRepository;

  beforeEach(() => {
    repository = new ChatRepository();
    vi.clearAllMocks();
  });

  it('should find a chat by ID', async () => {
    const result = await repository.findById('1');
    expect(result).toEqual({
      id: '1',
      title: 'Test Chat',
      userId: 'user1',
      memoryId: 'memory1',
    });
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should find all chats', async () => {
    const result = await repository.findAll();
    expect(result).toEqual([
      { id: '1', title: 'Test Chat', userId: 'user1', memoryId: 'memory1' },
    ]);
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should create a chat', async () => {
    const result = await repository.create({
      id: '1',
      title: 'Test Chat',
      userId: 'user1',
      memoryId: 'memory1',
    });
    expect(result).toEqual({
      id: '1',
      title: 'Test Chat',
      userId: 'user1',
      memoryId: 'memory1',
    });
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should throw an error when creating a chat without required fields', async () => {
    await expect(
      repository.create({
        title: 'Test Chat',
      }),
    ).rejects.toThrow('Chat id, userId, and title are required');
  });

  it('should update a chat', async () => {
    const result = await repository.update('1', { title: 'Updated Chat' });
    expect(result).toEqual({
      id: '1',
      title: 'Updated Chat',
      userId: 'user1',
      memoryId: 'memory1',
    });
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should delete a chat', async () => {
    const result = await repository.delete('1');
    expect(result).toBe(true);
    expect(dbClient.transaction).toHaveBeenCalled();
  });

  it('should find chats by user ID', async () => {
    const result = await repository.findByUserId('user1');
    expect(result).toEqual([
      { id: '1', title: 'Test Chat', userId: 'user1', memoryId: 'memory1' },
    ]);
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should find chats by memory ID', async () => {
    const result = await repository.findByMemoryId('memory1');
    expect(result).toEqual([
      { id: '1', title: 'Test Chat', userId: 'user1', memoryId: 'memory1' },
    ]);
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should create a memory chat', async () => {
    const result = await repository.createMemoryChat(
      'memory1',
      'user1',
      'Memory Chat',
    );
    expect(result).toEqual({
      id: '1',
      title: 'Test Chat',
      userId: 'user1',
      memoryId: 'memory1',
    });
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should add messages to a chat', async () => {
    const messages = [
      {
        role: 'user',
        parts: { text: 'Hello' },
        attachments: [],
        createdAt: new Date(),
      },
    ];
    const result = await repository.addMessages('1', messages);
    expect(result).toBe(true);
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should get messages for a chat', async () => {
    const result = await repository.getMessages('1');
    expect(result).toEqual([
      { id: '1', title: 'Test Chat', userId: 'user1', memoryId: 'memory1' },
    ]);
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });
});
