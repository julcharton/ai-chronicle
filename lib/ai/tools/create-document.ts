import { generateUUID } from '@/lib/utils';
import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';
import { getDocumentsByChatId } from '@/lib/db/queries';

interface CreateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
  chatId?: string;
}

// Only allow text and code document types
const allowedArtifactKinds = ['text', 'code'] as const;

export const createDocument = ({
  session,
  dataStream,
  chatId,
}: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(allowedArtifactKinds),
      chatId: chatId
        ? z
            .string()
            .default(chatId) // Use the provided chatId as default
        : z.string().describe('The ID of the chat this document belongs to'),
    }),
    execute: async ({ title, kind, chatId: paramChatId }) => {
      // Use the chatId from parameters or the one provided in props
      const documentChatId = paramChatId || chatId;

      if (!documentChatId) {
        throw new Error('Chat ID is required to create a document');
      }

      // Check if a document already exists for this chat
      const existingDocuments = await getDocumentsByChatId({
        id: documentChatId,
      });
      if (existingDocuments.length > 0) {
        return {
          error:
            'A document already exists for this chat. Please use updateDocument instead.',
          documentId: existingDocuments[0].id,
        };
      }

      const id = generateUUID();

      dataStream.writeData({
        type: 'kind',
        content: kind,
      });

      dataStream.writeData({
        type: 'id',
        content: id,
      });

      dataStream.writeData({
        type: 'title',
        content: title,
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind,
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        session,
        chatId: documentChatId, // Pass chatId to document handler
      });

      dataStream.writeData({ type: 'finish', content: '' });

      return {
        id,
        title,
        kind,
        chatId: documentChatId,
        content: 'A document was created and is now visible to the user.',
      };
    },
  });
