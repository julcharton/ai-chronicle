import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import type { Memory } from '@/types/memory';
import { serializeMemory } from '@/types/memory';
import {
  processStreamBuffer,
  createBlock,
  updateBlock,
  BLOCK_PATTERNS,
} from './utils/stream-processing';
import {
  recognizeBlockType,
  hasBlockBreak,
  splitAtBlockBreaks,
} from './utils/pattern-recognition';

// This handler is for the memory artifact type
export const memoryDocumentHandler = createDocumentHandler<'memory'>({
  kind: 'memory',
  onCreateDocument: async ({ title, dataStream }) => {
    // Initialize the memory
    const memory: Memory = {
      blocks: [],
      title,
      description: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let currentBuffer = '';

    // Stream AI-generated content

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: `Create a memory with multiple blocks of different types.
      Use --- to separate blocks.
      For images, use <IMAGE:description> to create image placeholders.
      For audio, use <AUDIO:description> to create audio placeholders.
      Make the memory feel personal and immersive.`,
      prompt: title,
      experimental_transform: smoothStream({ chunking: 'word' }),
    });

    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        const { textDelta } = delta;
        currentBuffer += textDelta;

        // Check if we have a block break
        if (hasBlockBreak(currentBuffer)) {
          // Split at block breaks and process each segment
          const segments = splitAtBlockBreaks(currentBuffer);

          // Process all complete segments except the last one (which might be incomplete)
          for (let i = 0; i < segments.length - 1; i++) {
            processStreamBuffer({
              buffer: segments[i],
              memory,
              dataStream,
            });
          }

          // Keep the last segment as the current buffer
          currentBuffer = segments[segments.length - 1] || '';
          continue;
        }

        // If we have a memory with at least one block, try to update the last one
        if (memory.blocks.length > 0) {
          const lastBlock = memory.blocks[memory.blocks.length - 1];

          // Check if the buffer contains a new block type
          const potentialType = recognizeBlockType(currentBuffer);

          if (potentialType !== lastBlock.type) {
            // We're switching block types, create a new block
            processStreamBuffer({
              buffer: currentBuffer,
              memory,
              dataStream,
            });
            currentBuffer = '';
          } else if (lastBlock.type === 'text') {
            // Continue appending to the text block
            memory.blocks[memory.blocks.length - 1] = updateBlock(
              lastBlock,
              textDelta,
              dataStream,
            );
          }
        } else if (
          currentBuffer.length > 20 ||
          currentBuffer.match(BLOCK_PATTERNS.IMAGE) ||
          currentBuffer.match(BLOCK_PATTERNS.AUDIO)
        ) {
          // Create the first block once we have enough content or a special block type
          processStreamBuffer({
            buffer: currentBuffer,
            memory,
            dataStream,
          });
          currentBuffer = '';
        }
      }
    }

    // Process any remaining text in the buffer
    if (currentBuffer.trim().length > 0) {
      processStreamBuffer({
        buffer: currentBuffer,
        memory,
        dataStream,
      });
    }

    // Finalize the memory
    dataStream.writeData({ type: 'finish', content: '' });

    return serializeMemory(memory);
  },

  // Implementation for updating an existing memory
  onUpdateDocument: async ({ document, description, dataStream }) => {
    // Parse the existing memory
    try {
      JSON.parse(document.content || '{}');
    } catch (e) {
      console.error('Error parsing memory document:', e);
    }

    // Implementation for updating
    // This will be expanded in later subtasks

    return document.content || '';
  },
});
