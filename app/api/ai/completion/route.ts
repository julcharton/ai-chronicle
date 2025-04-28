import type { NextRequest } from 'next/server';
import {
  streamCompletion,
  generateCompletion,
} from '../../../../lib/ai/completion';
import type { Message } from 'ai';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, stream = true } = await req.json();

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Use streaming or non-streaming based on request
    if (stream) {
      return streamCompletion(messages as Message[]);
    } else {
      const completion = await generateCompletion(messages as Message[]);
      return new Response(JSON.stringify({ completion }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in AI completion route:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate completion',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
