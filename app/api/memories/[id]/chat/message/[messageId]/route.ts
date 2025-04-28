import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getMemoryRepository,
  getChatRepository,
  getMessageRepository,
} from '@/lib/repositories';

/**
 * DELETE /api/memories/:id/chat/message/:messageId - Delete a message from a memory chat
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } },
) {
  try {
    const { id, messageId } = params;

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

    // Get chat repository to verify this memory has an associated chat
    const chatRepository = getChatRepository();

    // Try to find an existing chat for this memory
    const existingChats = await chatRepository.findByMemoryId(id);

    // If no chat exists, return error
    if (existingChats.length === 0) {
      return NextResponse.json(
        { error: 'No chat found for this memory' },
        { status: 404 },
      );
    }

    // Get the chat ID
    const chatId = existingChats[0].id;

    // Get message repository
    const messageRepository = getMessageRepository();

    // Find the message
    const message = await messageRepository.findById(messageId);

    // Check if message exists
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify message belongs to the correct chat
    if (message.chatId !== chatId) {
      return NextResponse.json(
        { error: 'Message does not belong to this chat' },
        { status: 403 },
      );
    }

    // Delete the message
    const success = await messageRepository.delete(messageId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 },
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error: unknown) {
    console.error(`Error deleting message:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
