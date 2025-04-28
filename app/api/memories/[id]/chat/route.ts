import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getMemoryRepository,
  getChatRepository,
  getMessageRepository,
} from '@/lib/repositories';
import { z } from 'zod';

// Define the pagination schema for query parameters
const paginationSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
});

// DTOs for responses
type MessageResponseDTO = {
  id: string;
  role: string;
  content: string;
  attachments: any[];
  createdAt: string;
};

type ChatResponseDTO = {
  id: string;
  title: string;
  createdAt: string;
  visibility: string;
  messages: MessageResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

// Helper interface for message parts
interface MessagePart {
  text?: string;
  [key: string]: any;
}

/**
 * GET /api/memories/:id/chat - Get chat history for a memory
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const paginationResult = paginationSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    if (!paginationResult.success) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 },
      );
    }

    const { page, limit } = paginationResult.data;

    // Get memory repository to check if memory exists and belongs to user
    const memoryRepository = getMemoryRepository();
    const memory = await memoryRepository.findById(id);

    // Check if memory exists
    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    // Check if user has access to the memory
    if (memory.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get chat repository and message repository
    const chatRepository = getChatRepository();
    const messageRepository = getMessageRepository();

    // Try to find an existing chat for this memory
    const existingChats = await chatRepository.findByMemoryId(id);

    // If no chat exists yet, return empty result
    if (existingChats.length === 0) {
      return NextResponse.json({
        id: '',
        title: 'Memory Chat',
        createdAt: new Date().toISOString(),
        visibility: 'private',
        messages: [],
        pagination: {
          page,
          limit,
          totalItems: 0,
          totalPages: 0,
        },
      });
    }

    // Use the first chat associated with this memory
    const chat = existingChats[0];

    // Get messages for this chat with pagination
    const messages = await messageRepository.findByChatId(chat.id);

    // Apply pagination in-memory
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMessages = messages.slice(startIndex, endIndex);

    // Calculate pagination metadata
    const totalItems = messages.length;
    const totalPages = Math.ceil(totalItems / limit);

    // Format response
    const response: ChatResponseDTO = {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt.toISOString(),
      visibility: chat.visibility,
      messages: paginatedMessages.map((msg) => {
        // Extract content from message parts
        let content = '';

        if (msg.parts) {
          if (Array.isArray(msg.parts) && msg.parts.length > 0) {
            const part = msg.parts[0] as MessagePart;
            content = part.text || '';
          } else if (typeof msg.parts === 'object') {
            const part = msg.parts as MessagePart;
            content = part.text || '';
          }
        }

        return {
          id: msg.id,
          role: msg.role,
          content,
          attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
          createdAt: msg.createdAt.toISOString(),
        };
      }),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error(`Error fetching chat:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
