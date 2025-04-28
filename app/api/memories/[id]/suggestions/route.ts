import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMemoryRepository } from '@/lib/repositories';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';
import { LRUCache, generateSuggestionCacheKey } from '@/lib/utils/cache';
import { suggestionsRateLimiter } from '@/lib/utils/rate-limit';

// Configure OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define schema for suggestion request
const suggestionRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  prompt: z.string().optional(),
  maxSuggestions: z.number().min(1).max(5).default(1),
});

// DTO for response
type SuggestionResponseDTO = {
  id: string;
  suggestions: Array<{
    id: string;
    content: string;
    position?: number;
    originalText?: string;
    description?: string;
  }>;
};

// Type for parsed OpenAI response
type OpenAIJsonResponse = {
  suggestions?: string[];
  [key: string]: unknown;
};

// Cache for suggestion responses (store up to 100 responses for 10 minutes)
const suggestionCache = new LRUCache<string, SuggestionResponseDTO>(
  100,
  10 * 60 * 1000,
);

/**
 * POST /api/memories/:id/suggestions - Generate AI suggestions for memory content
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

    // Check rate limiting
    const rateLimitResult = suggestionsRateLimiter.checkAndConsume(
      session.user.id,
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetMs: rateLimitResult.resetMs,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(
              rateLimitResult.resetMs / 1000,
            ).toString(),
          },
        },
      );
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

    // Validate against schema
    const validationResult = suggestionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { content, prompt, maxSuggestions } = validationResult.data;

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

    // Generate cache key
    const cacheKey = generateSuggestionCacheKey(
      id,
      content,
      prompt || 'default',
      maxSuggestions,
    );

    // Check cache first
    const cachedResponse = suggestionCache.get(cacheKey);
    if (cachedResponse) {
      console.log(`Cache hit for suggestions: ${id.substring(0, 8)}`);

      // Return cached response with cache headers
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        },
      });
    }

    // Generate AI suggestions based on content
    const suggestions = await generateAISuggestions(
      content,
      prompt || 'Provide suggestions to enhance this memory with more details.',
      maxSuggestions,
    );

    // Format response
    const response: SuggestionResponseDTO = {
      id: uuidv4(),
      suggestions,
    };

    // Cache the response
    suggestionCache.set(cacheKey, response);

    // Add rate limit headers to response
    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(
          rateLimitResult.resetMs / 1000,
        ).toString(),
      },
    });
  } catch (error: unknown) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * Generate suggestions using OpenAI
 */
async function generateAISuggestions(
  content: string,
  prompt: string,
  maxSuggestions: number,
): Promise<
  Array<{
    id: string;
    content: string;
    position?: number;
    originalText?: string;
    description?: string;
  }>
> {
  try {
    // Create system prompt that emphasizes not fabricating details
    const systemPrompt = `You are an AI assistant that helps users capture their memories accurately. Your goal is to suggest ways to enhance memory entries by asking questions or providing prompts that help the user recall more details. Do NOT fabricate details or suggest content that isn't grounded in the user's actual experience.

Instructions:
1. Analyze the provided memory content
2. Identify areas where more detail would enhance the memory
3. Generate ${maxSuggestions} suggestion(s) to help the user recall more details
4. Each suggestion should be helpful but respect the authenticity of the memory
5. Format each suggestion as "Based on your mention of X, can you add more details about Y?"

Return each suggestion as a separate item in a JSON array.`;

    // Combine user content with prompt
    const userPrompt = `${prompt}\n\nHere's my memory entry:\n"${content}"`;

    // Call OpenAI API with retry logic
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        });

        // Extract suggestions from response
        const responseText = response.choices[0]?.message.content || '';

        let parsedResponse: OpenAIJsonResponse;
        try {
          parsedResponse = JSON.parse(responseText);
        } catch (error) {
          console.error('Error parsing JSON response:', error);
          return createFallbackSuggestions('parsing');
        }

        // Format suggestions
        const suggestions = (parsedResponse.suggestions || [])
          .slice(0, maxSuggestions)
          .map((suggestion: string) => ({
            id: uuidv4(),
            content: suggestion,
            description: 'AI-generated suggestion',
          }));

        return suggestions.length > 0
          ? suggestions
          : createFallbackSuggestions('empty');
      } catch (error: any) {
        attempts++;

        // If it's a rate limit error or this is the last attempt, throw
        if (error?.status === 429 || attempts >= maxAttempts) {
          throw error;
        }

        // Otherwise, wait and retry
        const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
        console.log(
          `Retrying OpenAI API call after ${delay}ms (attempt ${attempts}/${maxAttempts})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // If we've exhausted all retries
    return createFallbackSuggestions('retries-exhausted');
  } catch (error) {
    console.error('OpenAI API error:', error);
    return createFallbackSuggestions('api-error');
  }
}

/**
 * Create fallback suggestions when AI generation fails
 */
function createFallbackSuggestions(reason: string): Array<{
  id: string;
  content: string;
  description: string;
}> {
  const fallbackSuggestions = [
    {
      id: uuidv4(),
      content:
        'Consider adding more specific details about when and where this memory took place.',
      description: 'Fallback suggestion',
    },
    {
      id: uuidv4(),
      content: 'Try to include more about how you felt during this experience.',
      description: 'Fallback suggestion',
    },
    {
      id: uuidv4(),
      content:
        'Adding sensory details like sounds, smells, or tastes could make this memory more vivid.',
      description: 'Fallback suggestion',
    },
  ];

  // Return a single fallback suggestion or all of them based on the reason
  return reason === 'empty' ? fallbackSuggestions : [fallbackSuggestions[0]];
}
