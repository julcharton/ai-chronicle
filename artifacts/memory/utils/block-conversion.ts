import type { MemoryBlock, MemoryBlockType } from '@/types/memory';

interface ConversionOptions {
  preserveMetadata?: boolean;
  extractTextFromImage?: boolean;
}

export function convertBlockType(
  block: MemoryBlock,
  targetType: MemoryBlockType,
  options: ConversionOptions = { preserveMetadata: true },
): MemoryBlock {
  // Create a new block with the target type
  const newBlock: MemoryBlock = {
    id: block.id, // Preserve the ID
    type: targetType,
    content: '',
    metadata: options.preserveMetadata ? { ...block.metadata } : {},
    createdAt: block.createdAt,
    updatedAt: new Date(),
  };

  // Handle content conversion based on source and target types
  if (block.type === 'text') {
    if (targetType === 'image') {
      newBlock.content = ''; // Empty URL for placeholder
      newBlock.metadata = {
        ...newBlock.metadata,
        alt: block.content.slice(0, 100), // Use text as alt/caption
        caption: block.content.slice(0, 100),
      };
    } else if (targetType === 'audio') {
      newBlock.content = ''; // Empty URL for placeholder
      newBlock.metadata = {
        ...newBlock.metadata,
        alt: block.content.slice(0, 100), // Use text as alt/caption
        caption: block.content.slice(0, 100),
      };
    }
  } else if (block.type === 'image') {
    if (targetType === 'text') {
      newBlock.content =
        block.metadata?.alt || block.metadata?.caption || 'Image';
    } else if (targetType === 'audio') {
      newBlock.content = ''; // Empty URL for placeholder
    }
  } else if (block.type === 'audio') {
    if (targetType === 'text') {
      newBlock.content =
        block.metadata?.alt || block.metadata?.caption || 'Audio';
    } else if (targetType === 'image') {
      newBlock.content = ''; // Empty URL for placeholder
    }
  }

  return newBlock;
}
