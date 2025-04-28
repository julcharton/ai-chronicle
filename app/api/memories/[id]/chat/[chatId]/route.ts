import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getMemoryRepository,
  getChatRepository,
  getMessageRepository,
} from '@/lib/repositories';

// DTO for response
type ChatResponseDTO = {
  id: string;
  title: string;
  createdAt: string;
  visibility: string;
  memoryId: string;
};

/**
 * GET /api/memories/:id/chat/:chatId - Get information about a specific chat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; chatId: string } },
) {
  try {
    const { id, chatId } = params;

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get chat repository and find the chat
    const chatRepository = getChatRepository();
    const chat = await chatRepository.findById(chatId);

    // Check if chat exists
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify the chat belongs to the specified memory
    if (chat.memoryId !== id) {
      return NextResponse.json(
        { error: 'Chat does not belong to this memory' },
        { status: 403 },
      );
    }

    // Format response
    const response: ChatResponseDTO = {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt.toISOString(),
      visibility: chat.visibility,
      memoryId: id,
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

/**
 * DELETE /api/memories/:id/chat/:chatId - Delete a chat
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; chatId: string } },
) {
  try {
    const { id, chatId } = params;

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get chat repository and find the chat
    const chatRepository = getChatRepository();
    const chat = await chatRepository.findById(chatId);

    // Check if chat exists
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify the chat belongs to the specified memory
    if (chat.memoryId !== id) {
      return NextResponse.json(
        { error: 'Chat does not belong to this memory' },
        { status: 403 },
      );
    }

    // Delete the chat and all associated messages
    const success = await chatRepository.delete(chatId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete chat' },
        { status: 500 },
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error: unknown) {
    console.error(`Error deleting chat:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/memories/:id/chat/:chatId - Update chat information
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; chatId: string } },
) {
  try {
    const { id, chatId } = params;

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    let body: { title?: string; visibility?: string };
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    // Check for valid update fields
    const { title, visibility } = body;
    if (!title && !visibility) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 },
      );
    }

    // Validate visibility if present
    if (visibility && !['public', 'private'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Visibility must be "public" or "private"' },
        { status: 400 },
      );
    }

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

    // Get chat repository and find the chat
    const chatRepository = getChatRepository();
    const chat = await chatRepository.findById(chatId);

    // Check if chat exists
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify the chat belongs to the specified memory
    if (chat.memoryId !== id) {
      return NextResponse.json(
        { error: 'Chat does not belong to this memory' },
        { status: 403 },
      );
    }

    // Update the chat
    const updatedChat = await chatRepository.update(chatId, {
      title,
      visibility: visibility as 'public' | 'private',
    });

    // Format response
    const response: ChatResponseDTO = {
      id: updatedChat.id,
      title: updatedChat.title,
      createdAt: updatedChat.createdAt.toISOString(),
      visibility: updatedChat.visibility,
      memoryId: id,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error(`Error updating chat:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
