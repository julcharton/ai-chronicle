import type { MemoryBlockType } from '@/types/memory';

// Regular expressions for block type detection
const patterns = {
  imageStart: /^!?\[|^<IMAGE:/i,
  audioStart: /^<AUDIO:|^🎵/i,
  blockBreak: /^-{3,}$|^\*{3,}$|^_{3,}$/,
};

// Content recognition for determining what type of block to create
export function recognizeBlockType(content: string): MemoryBlockType {
  // Check for image markers
  if (content.match(/!\[.*?\]\(.*?\)/i) || content.match(/<IMAGE:.*?>/i)) {
    return 'image';
  }

  // Check for audio markers
  if (content.match(/<AUDIO:.*?>/i) || content.match(/🎵.*?🎵/i)) {
    return 'audio';
  }

  // Default to text
  return 'text';
}

// Extract metadata from block content based on patterns
export function extractBlockMetadata(
  content: string,
  type: MemoryBlockType,
): {
  content: string;
  metadata: Record<string, any>;
} {
  switch (type) {
    case 'image': {
      // Extract image alt text or description
      const markdownMatch = content.match(/!\[(.*?)\]\((.*?)\)/i);
      const htmlMatch = content.match(/<IMAGE:(.*?)>/i);

      if (markdownMatch) {
        return {
          content: markdownMatch[2] || '', // URL if provided
          metadata: {
            alt: markdownMatch[1] || 'Image',
            caption: markdownMatch[1] || 'Image',
          },
        };
      } else if (htmlMatch) {
        return {
          content: '', // No URL yet
          metadata: {
            alt: htmlMatch[1] || 'Image',
            caption: htmlMatch[1] || 'Image',
          },
        };
      }
      break;
    }
    case 'audio': {
      // Extract audio description
      const match =
        content.match(/<AUDIO:(.*?)>/i) || content.match(/🎵(.*?)🎵/i);
      if (match) {
        return {
          content: '', // No URL yet
          metadata: {
            alt: match[1] || 'Audio recording',
            caption: match[1] || 'Audio recording',
          },
        };
      }
      break;
    }
  }

  // Default return
  return { content, metadata: {} };
}

// Detect if the current buffer contains a block break
export function hasBlockBreak(content: string): boolean {
  return !!content.match(/\n\s*---\s*\n|\n\s*\*\*\*\s*\n|\n\s*___\s*\n/);
}

// Split text at block breaks
export function splitAtBlockBreaks(content: string): string[] {
  return content
    .split(/\n\s*---\s*\n|\n\s*\*\*\*\s*\n|\n\s*___\s*\n/)
    .filter(Boolean);
}
