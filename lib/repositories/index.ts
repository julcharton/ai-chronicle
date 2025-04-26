import { MemoryRepository } from './memory-repository';
import { ChatRepository } from './chat-repository';

// Export repository types for use in other files
export type { BaseRepository } from './base-repository';

/**
 * Repository factory that provides access to all repositories
 * Uses a singleton pattern to ensure only one instance of each repository exists
 */
class RepositoryFactory {
  private static instance: RepositoryFactory;
  private memoryRepository: MemoryRepository;
  private chatRepository: ChatRepository;

  private constructor() {
    this.memoryRepository = new MemoryRepository();
    this.chatRepository = new ChatRepository();
  }

  /**
   * Get the singleton instance of the repository factory
   */
  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }

    return RepositoryFactory.instance;
  }

  /**
   * Get the memory repository
   */
  public getMemoryRepository(): MemoryRepository {
    return this.memoryRepository;
  }

  /**
   * Get the chat repository
   */
  public getChatRepository(): ChatRepository {
    return this.chatRepository;
  }
}

// Export a function to get the repository factory
export function getRepositoryFactory(): RepositoryFactory {
  return RepositoryFactory.getInstance();
}

// Export convenience functions to get specific repositories
export function getMemoryRepository(): MemoryRepository {
  return getRepositoryFactory().getMemoryRepository();
}

export function getChatRepository(): ChatRepository {
  return getRepositoryFactory().getChatRepository();
}
