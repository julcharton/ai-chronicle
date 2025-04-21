import { generateUUID } from '@/lib/utils';
import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { documentHandlersByArtifactKind } from '@/lib/artifacts/server';

interface CreateMemoryProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createMemory = ({ session, dataStream }: CreateMemoryProps) =>
  tool({
    description:
      'Create a memory artifact that combines text, images, and audio to capture personal memories or stories. This tool helps organize memories into structured blocks that can be edited and enhanced later.',
    parameters: z.object({
      title: z.string().describe('The title of the memory to create'),
      theme: z
        .string()
        .optional()
        .describe('The general theme or topic of the memory'),
      timeframe: z
        .string()
        .optional()
        .describe(
          'When this memory occurred (e.g., "summer 2019", "childhood")',
        ),
    }),
    execute: async ({ title, theme, timeframe }) => {
      const id = generateUUID();

      // Set memory kind
      dataStream.writeData({
        type: 'kind',
        content: 'memory',
      });

      // Set document ID
      dataStream.writeData({
        type: 'id',
        content: id,
      });

      // Set title
      dataStream.writeData({
        type: 'title',
        content: title,
      });

      // Pass theme and timeframe as structured data
      if (theme) {
        dataStream.writeData({
          type: 'theme',
          content: theme,
        });
      }

      if (timeframe) {
        dataStream.writeData({
          type: 'timeframe',
          content: timeframe,
        });
      }

      // Reset content
      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      // Find the memory document handler
      const memoryHandler = documentHandlersByArtifactKind.find(
        (handler) => handler.kind === 'memory',
      );

      if (!memoryHandler) {
        throw new Error('Memory document handler not found');
      }

      // Create the memory
      await memoryHandler.onCreateDocument({
        id,
        title,
        dataStream,
        session,
      });

      // Signal completion
      dataStream.writeData({ type: 'finish', content: '' });

      return {
        id,
        title,
        kind: 'memory',
        content: 'A memory artifact was created based on your conversation.',
      };
    },
  });
