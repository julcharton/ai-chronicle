export type MemoryBlockType = 'text' | 'image' | 'audio' | 'video';

export interface MemoryBlock {
  id: string;
  type: MemoryBlockType;
  content: string; // For text blocks, this is the actual text. For image/audio, it's the URL
  metadata?: {
    alt?: string; // For images
    caption?: string; // For any block type
    timestamp?: number; // For audio/video timestamps
    duration?: number; // For audio duration
    [key: string]: any; // Any other metadata
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Memory {
  blocks: MemoryBlock[];
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Serializes a Memory object to a JSON string
 */
export function serializeMemory(memory: Memory): string {
  return JSON.stringify(memory);
}

/**
 * Deserializes a JSON string to a Memory object,
 * handling date conversion
 */
export function deserializeMemory(json: string): Memory {
  const parsed = JSON.parse(json);

  // Handle date conversion
  if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
  if (parsed.updatedAt) parsed.updatedAt = new Date(parsed.updatedAt);

  // Convert dates in blocks
  if (parsed.blocks) {
    parsed.blocks = parsed.blocks.map((block: any) => {
      if (block.createdAt) block.createdAt = new Date(block.createdAt);
      if (block.updatedAt) block.updatedAt = new Date(block.updatedAt);
      return block;
    });
  }

  return parsed as Memory;
}
