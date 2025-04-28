import type { NextRequest } from 'next/server';
import {
  getMemoryPrompt,
  MEMORY_CATEGORIES,
  MEMORY_TEMPLATE_CATEGORIES,
  createSafeMemoryPrompt,
  MEMORY_PROMPTS_VERSION,
} from '@/lib/ai/memory-prompts';
import { getCurrentVersion, logPromptUsage } from '@/lib/ai/prompt-versions';

export const runtime = 'edge';

/**
 * API endpoint for retrieving memory prompts
 * GET /api/ai/prompts - Returns list of available prompt categories
 * GET /api/ai/prompts?category=childhood - Returns prompt for specific category
 * GET /api/ai/prompts?category=childhood&includeFollowUps=true - Includes follow-up questions
 * GET /api/ai/prompts?category=childhood&safe=true - Includes anti-injection protections
 * GET /api/ai/prompts?includeVersion=true - Includes version information
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const includeFollowUps = searchParams.get('includeFollowUps') === 'true';
    const safe = searchParams.get('safe') === 'true';
    const includeVersion = searchParams.get('includeVersion') === 'true';

    // Return list of available categories if no category specified
    if (!category) {
      const response: any = {
        categories: MEMORY_CATEGORIES,
        templates: Object.entries(MEMORY_TEMPLATE_CATEGORIES).map(
          ([key, value]) => ({
            key,
            name: value.name,
            description: value.description,
          }),
        ),
      };

      if (includeVersion) {
        response.version = MEMORY_PROMPTS_VERSION;
      }

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the prompt for the specified category
    let prompt: string;
    if (safe) {
      prompt = createSafeMemoryPrompt(category);
    } else {
      prompt = getMemoryPrompt(category, includeFollowUps);
    }

    // Log prompt usage for analytics
    logPromptUsage('memoryPrompts', MEMORY_PROMPTS_VERSION.version, {
      category,
      includeFollowUps,
      safe,
    });

    const response: any = {
      category,
      includeFollowUps,
      safe,
      prompt,
    };

    // Include version information if requested
    if (includeVersion) {
      response.version = MEMORY_PROMPTS_VERSION;
      response.currentVersion = getCurrentVersion('memoryPrompts');
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in prompts API:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate prompt',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
