import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRepository } from '@/lib/repositories/memory-repository';
import { dbClient } from '@/lib/repositories/db-client';

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
                  title: 'Test Memory',
                  content: 'Content',
                  userId: 'user1',
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
                title: 'Test Memory',
                content: 'Content',
                userId: 'user1',
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
                  title: 'Updated Memory',
                  content: 'Content',
                  userId: 'user1',
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

describe('MemoryRepository', () => {
  let repository: MemoryRepository;

  beforeEach(() => {
    repository = new MemoryRepository();
    vi.clearAllMocks();
  });

  it('should find a memory by ID', async () => {
    const result = await repository.findById('1');
    expect(result).toEqual({
      id: '1',
      title: 'Test Memory',
      content: 'Content',
      userId: 'user1',
    });
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should find all memories', async () => {
    const result = await repository.findAll();
    expect(result).toEqual([
      { id: '1', title: 'Test Memory', content: 'Content', userId: 'user1' },
    ]);
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should create a memory', async () => {
    const result = await repository.create({
      id: '1',
      title: 'Test Memory',
      content: 'Content',
      userId: 'user1',
    });
    expect(result).toEqual({
      id: '1',
      title: 'Test Memory',
      content: 'Content',
      userId: 'user1',
    });
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should throw an error when creating a memory without id or userId', async () => {
    await expect(
      repository.create({
        title: 'Test Memory',
        content: 'Content',
      }),
    ).rejects.toThrow('Memory id and userId are required');
  });

  it('should update a memory', async () => {
    const result = await repository.update('1', { title: 'Updated Memory' });
    expect(result).toEqual({
      id: '1',
      title: 'Updated Memory',
      content: 'Content',
      userId: 'user1',
    });
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should delete a memory', async () => {
    const result = await repository.delete('1');
    expect(result).toBe(true);
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should find memories by user ID', async () => {
    const result = await repository.findByUserId('user1');
    expect(result).toEqual([
      { id: '1', title: 'Test Memory', content: 'Content', userId: 'user1' },
    ]);
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });

  it('should auto-save memory content', async () => {
    const result = await repository.autoSave('1', 'New Content');
    expect(result).toEqual({
      id: '1',
      title: 'Updated Memory',
      content: 'Content',
      userId: 'user1',
    });
    expect(dbClient.executeWithRetry).toHaveBeenCalled();
  });
});
