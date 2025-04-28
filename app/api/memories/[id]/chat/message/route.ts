import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getMemoryRepository,
  getChatRepository,
  getMessageRepository,
} from '@/lib/repositories';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Define schema for message creation
const sendMessageSchema = z.object({
  role: z
    .string()
    .refine((val) => ['user', 'assistant', 'system'].includes(val), {
      message: "Role must be one of 'user', 'assistant', or 'system'",
    }),
  content: z.string().min(1, 'Content is required'),
  attachments: z.array(z.any()).optional().default([]),
});

// DTO for response
type MessageResponseDTO = {
  id: string;
  role: string;
  content: string;
  attachments: any[];
  createdAt: string;
};

/**
 * POST /api/memories/:id/chat/message - Send a new message to a memory chat
 */
export async function POST(
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

    // Parse and validate the request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    // Validate the request body against schema
    const validationResult = sendMessageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { role, content, attachments } = validationResult.data;

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

    // Get chat repository to find or create a chat for this memory
    const chatRepository = getChatRepository();

    // Try to find an existing chat for this memory
    const existingChats = await chatRepository.findByMemoryId(id);

    let chatId: string;

    // If no chat exists, create one
    if (existingChats.length === 0) {
      const newChat = await chatRepository.createMemoryChat(
        id,
        session.user.id,
        'Memory Chat',
      );
      chatId = newChat.id;
    } else {
      // Use the first chat associated with this memory
      chatId = existingChats[0].id;
    }

    // Get message repository to add a new message
    const messageRepository = getMessageRepository();

    // Create message parts (following the expected structure)
    const parts = [{ text: content }];

    // Create the message
    const message = await messageRepository.create({
      id: uuidv4(),
      chatId,
      role,
      parts,
      attachments,
      createdAt: new Date(),
    });

    // Format response
    const response: MessageResponseDTO = {
      id: message.id,
      role: message.role,
      content, // Use the original content for simplicity
      attachments: Array.isArray(message.attachments)
        ? message.attachments
        : [],
      createdAt: message.createdAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error(`Error sending message:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
