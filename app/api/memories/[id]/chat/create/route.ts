import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMemoryRepository, getChatRepository } from '@/lib/repositories';
import { z } from 'zod';

// Define schema for chat creation
const createChatSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title is too long')
    .optional(),
  visibility: z.enum(['public', 'private']).optional().default('private'),
});

// DTO for response
type ChatResponseDTO = {
  id: string;
  title: string;
  createdAt: string;
  visibility: string;
  memoryId: string;
};

/**
 * POST /api/memories/:id/chat/create - Create a new chat for a memory
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
    const validationResult = createChatSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { title, visibility } = validationResult.data;

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

    // Get chat repository to create a new chat
    const chatRepository = getChatRepository();

    // Create a new chat
    const chatTitle = title || `${memory.title} Chat`;

    // Create chat with basic info first
    const newChat = await chatRepository.createMemoryChat(
      id,
      session.user.id,
      chatTitle,
    );

    // If visibility is different from default, update it
    if (visibility !== 'private') {
      await chatRepository.update(newChat.id, { visibility });
    }

    // Format response
    const response: ChatResponseDTO = {
      id: newChat.id,
      title: newChat.title,
      createdAt: newChat.createdAt.toISOString(),
      visibility: visibility, // Use the requested visibility
      memoryId: id,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error(`Error creating chat:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
