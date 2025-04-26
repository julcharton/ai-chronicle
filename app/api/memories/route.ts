import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMemoryRepository } from '@/lib/repositories';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Define the schema for memory creation
const createMemorySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(150, 'Title cannot exceed 150 characters'),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional().default(false),
});

// DTOs for responses
type MemoryResponseDTO = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isPublic?: boolean;
};

/**
 * GET /api/memories - List all memories for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const tag = searchParams.get('tag');

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page parameter' },
        { status: 400 },
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 },
      );
    }

    // Get memory repository
    const memoryRepository = getMemoryRepository();

    // Fetch memories from the repository
    const memories = await memoryRepository.findByUserId(session.user.id);

    // Apply filtering, sorting and pagination in-memory
    // This would ideally be done at the database level for larger datasets
    let filteredMemories = [...memories];

    // Filter by tag if provided
    if (tag) {
      filteredMemories = filteredMemories.filter((memory) => {
        const tags = (memory.metadata as any)?.tags || [];
        return tags.includes(tag);
      });
    }

    // Sort memories
    filteredMemories.sort((a, b) => {
      if (sortBy === 'title') {
        return order === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortBy === 'updatedAt') {
        return order === 'asc'
          ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else {
        // Default: sort by createdAt
        return order === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedMemories = filteredMemories.slice(startIndex, endIndex);

    // Format response
    const response = {
      data: paginatedMemories.map(
        (memory): MemoryResponseDTO => ({
          id: memory.id,
          title: memory.title,
          content: memory.content || '',
          createdAt: new Date(memory.createdAt).toISOString(),
          updatedAt: new Date(memory.updatedAt).toISOString(),
          tags: (memory.metadata as any)?.tags,
          isPublic: (memory.metadata as any)?.isPublic,
        }),
      ),
      pagination: {
        total: filteredMemories.length,
        page,
        limit,
        totalPages: Math.ceil(filteredMemories.length / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/memories - Create a new memory
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    // Validate against schema
    const validationResult = createMemorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { title, content, tags, isPublic } = validationResult.data;

    // Get memory repository
    const memoryRepository = getMemoryRepository();

    // Create a new memory
    const memory = await memoryRepository.create({
      id: uuidv4(),
      title,
      content: content || '',
      userId: session.user.id,
      metadata: {
        tags,
        isPublic,
        aiGenerated: false,
      },
    });

    // Format response
    const response: MemoryResponseDTO = {
      id: memory.id,
      title: memory.title,
      content: memory.content || '',
      createdAt: new Date(memory.createdAt).toISOString(),
      updatedAt: new Date(memory.updatedAt).toISOString(),
      tags: (memory.metadata as any)?.tags,
      isPublic: (memory.metadata as any)?.isPublic,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
