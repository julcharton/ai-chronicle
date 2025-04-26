/**
 * Memory interface representing a user's stored memory
 */
export interface Memory {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tags?: string[];
  isPublic?: boolean;
  summary?: string;
  source?: string;
  aiGenerated?: boolean;
}

/**
 * Memory metadata that can be stored in the memory.metadata JSON field
 */
export interface MemoryMetadata {
  tags?: string[];
  isPublic?: boolean;
  summary?: string;
  source?: string;
  aiGenerated?: boolean;
}

/**
 * Chat interface representing a chat associated with a memory
 */
export interface MemoryChat {
  id: string;
  title: string;
  createdAt: string;
  memoryId: string;
  userId: string;
}
