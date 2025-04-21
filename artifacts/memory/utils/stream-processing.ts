import { generateUUID } from '@/lib/utils';
import type { Memory, MemoryBlock, MemoryBlockType } from '@/types/memory';

export interface StreamProcessingContext {
  memory: Memory;
  dataStream: any;
  buffer: string;
}

// Define block pattern detection patterns
export const BLOCK_PATTERNS = {
  IMAGE: /!\[(.*?)\]\((.*?)\)|<IMAGE:(.*?)>/i,
  AUDIO: /<AUDIO:(.*?)>|🎵(.*?)🎵/i,
  BLOCK_BREAK: /\n\s*---\s*\n|\n\s*\*\*\*\s*\n|\n\s*___\s*\n/,
};

// Process the current text buffer to determine what type of block to create
export function processStreamBuffer(
  context: StreamProcessingContext,
): MemoryBlock | null {
  const { buffer, memory, dataStream } = context;

  if (!buffer || buffer.trim().length === 0) {
    return null;
  }

  // Check for special patterns
  const imageMatch = BLOCK_PATTERNS.IMAGE.exec(buffer);
  const audioMatch = BLOCK_PATTERNS.AUDIO.exec(buffer);

  let newBlock: MemoryBlock;

  if (imageMatch) {
    // Create an image block
    const description = imageMatch[1] || imageMatch[3] || 'Image';
    newBlock = createBlock('image', '', {
      alt: description,
      caption: `Image: ${description}`,
    });
  } else if (audioMatch) {
    // Create an audio block
    const description = audioMatch[1] || audioMatch[2] || 'Audio recording';
    newBlock = createBlock('audio', '', {
      alt: description,
      caption: `Audio: ${description}`,
    });
  } else {
    // Create a text block
    // Clean up the buffer (remove block breaks)
    const cleanText = buffer.replace(BLOCK_PATTERNS.BLOCK_BREAK, '').trim();
    newBlock = createBlock('text', cleanText);
  }

  // Add the block to the memory
  memory.blocks.push(newBlock);

  // Send the block to the client
  dataStream.writeData({
    type: 'memory-block',
    content: JSON.stringify(newBlock),
  });

  return newBlock;
}

// Utility to create blocks of any type
export function createBlock(
  type: MemoryBlockType,
  content: string,
  metadata?: Record<string, any>,
): MemoryBlock {
  return {
    id: generateUUID(),
    type,
    content,
    metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Update an existing block with new content
export function updateBlock(
  block: MemoryBlock,
  content: string,
  dataStream: any,
) {
  const updatedBlock = {
    ...block,
    content: block.type === 'text' ? block.content + content : content,
    updatedAt: new Date(),
  };

  // Send the update to the client
  dataStream.writeData({
    type: 'memory-block-update',
    content: JSON.stringify({
      id: block.id,
      content,
    }),
  });

  return updatedBlock;
}
