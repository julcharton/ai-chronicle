import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMemoryRepository } from '@/lib/repositories';
import { z } from 'zod';
import type { MemoryMetadata } from '@/lib/types';

// Define schema for memory update
const updateMemorySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(150, 'Title cannot exceed 150 characters')
    .optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// DTO for response
type MemoryResponseDTO = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
};

/**
 * GET /api/memories/[id] - Get a specific memory
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

    // Get memory repository
    const memoryRepository = getMemoryRepository();

    // Fetch the memory
    const memory = await memoryRepository.findById(id);

    // Check if memory exists
    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    // Check if user has access to the memory
    if (memory.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Format response
    const response: MemoryResponseDTO = {
      id: memory.id,
      title: memory.title,
      content: memory.content || '',
      createdAt: new Date(memory.createdAt).toISOString(),
      updatedAt: new Date(memory.updatedAt).toISOString(),
      tags: memory.metadata?.tags,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error(`Error fetching memory:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/memories/[id] - Update a memory
 */
export async function PUT(
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
    } catch (error: unknown) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    // Validate against schema
    const validationResult = updateMemorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { title, content, tags } = validationResult.data;

    // Get memory repository
    const memoryRepository = getMemoryRepository();

    // Check if memory exists and belongs to user
    const existingMemory = await memoryRepository.findById(id);

    if (!existingMemory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    if (existingMemory.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare metadata update
    const currentMetadata = existingMemory.metadata || {};
    const updatedMetadata: MemoryMetadata = {
      ...currentMetadata,
    };

    if (tags !== undefined) {
      updatedMetadata.tags = tags;
    }

    // Update the memory
    const updateData = {
      title: title !== undefined ? title : undefined,
      content: content !== undefined ? content : undefined,
      metadata: updatedMetadata,
    };

    const updatedMemory = await memoryRepository.update(id, updateData);

    // Format response
    const response: MemoryResponseDTO = {
      id: updatedMemory.id,
      title: updatedMemory.title,
      content: updatedMemory.content || '',
      createdAt: new Date(updatedMemory.createdAt).toISOString(),
      updatedAt: new Date(updatedMemory.updatedAt).toISOString(),
      tags: updatedMemory.metadata?.tags,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error(`Error updating memory:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/memories/[id] - Delete a memory
 */
export async function DELETE(
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

    // Get memory repository
    const memoryRepository = getMemoryRepository();

    // Check if memory exists and belongs to user
    const existingMemory = await memoryRepository.findById(id);

    if (!existingMemory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    if (existingMemory.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the memory
    await memoryRepository.delete(id);

    // Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error(`Error deleting memory:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
