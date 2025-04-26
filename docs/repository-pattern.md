# Repository Pattern Implementation

This document describes the implementation of the Repository Pattern in the AI Chronicle application.

## Overview

The Repository Pattern is a design pattern that abstracts the data access layer from the rest of the application. It provides a clean separation of concerns and helps in maintaining, testing, and scaling the application.

In our implementation, we have created separate repositories for different entities (Memory, Chat) that provide a consistent interface for data access operations.

## Structure

```
lib/repositories/
├── base-repository.ts       # Base interface that all repositories implement
├── db-client.ts             # Enhanced database client with retry and transaction support
├── memory-repository.ts     # Repository for memory-related operations
├── chat-repository.ts       # Repository for chat-related operations
└── index.ts                 # Factory to access repositories
```

## Base Repository Interface

The `BaseRepository` interface defines common CRUD operations that all repositories should implement:

```typescript
export interface BaseRepository<T, K> {
  findById(id: K): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: K, data: Partial<T>): Promise<T>;
  delete(id: K): Promise<boolean>;
  findByUserId(userId: string): Promise<T[]>;
  transaction<R>(operation: () => Promise<R>): Promise<R>;
}
```

## Database Client

The `DbClient` class enhances the basic database client with:

- Retry logic for transient failures
- Transaction support
- Error handling

## Memory Repository

The `MemoryRepository` implements `BaseRepository<Memory, string>` and provides:

- Basic CRUD operations for memories
- User-specific memory queries
- Metadata handling
- Auto-save functionality for content updates
- Tag-based filtering

## Chat Repository

The `ChatRepository` implements `BaseRepository<Chat, string>` and provides:

- Basic CRUD operations for chats
- Methods for working with chat messages
- Memory-chat relationship functionality

## Repository Factory

The `RepositoryFactory` provides a single point of access for all repositories using the Singleton pattern. It ensures that only one instance of each repository exists in the application.

```typescript
// Get a specific repository
const memoryRepository = getMemoryRepository();
const chatRepository = getChatRepository();

// Or get the factory and then access repositories
const factory = getRepositoryFactory();
const memoryRepository = factory.getMemoryRepository();
```

## Error Handling

Repositories include comprehensive error handling:

- Validation before operations (e.g., ensuring required fields are present)
- Database error handling and retries for transient failures
- Typed error responses

## Transactions

For operations that require consistency across multiple tables, we use transactions:

```typescript
await chatRepository.transaction(async () => {
  // Delete associated messages
  await deleteMessages(chatId);
  
  // Delete the chat itself
  await deleteChat(chatId);
});
```

## Usage in Server Actions

Server actions use repositories to access data:

```typescript
// In a server action
import { getMemoryRepository } from '@/lib/repositories';

export async function getMemories() {
  const memoryRepository = getMemoryRepository();
  return await memoryRepository.findByUserId(userId);
}
```

## Testing

Repositories are designed to be easily testable:

- Pure JavaScript/TypeScript with no external dependencies
- All database operations are done through the database client
- Mocks can be created for the database client in tests

## Extending

To add a new repository:

1. Create a new file `your-entity-repository.ts`
2. Implement the `BaseRepository` interface
3. Add the repository to the factory in `index.ts` 