import { OpenAI } from 'openai';
import { AI_MODELS } from './models';
import type { Message } from 'ai';

// Initialize OpenAI client with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Max retries for API calls
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

// Error handling utility
const handleError = (error: unknown) => {
  // OpenAI API errors
  if (error instanceof OpenAI.APIError) {
    const { status, message } = error;
    console.error(`OpenAI API Error (${status}): ${message}`);

    // Handle rate limiting
    if (status === 429) {
      console.error(
        'Rate limit reached, consider implementing backoff strategy',
      );
    }

    // Handle authentication issues
    if (status === 401) {
      console.error('Authentication error. Check your API key.');
    }

    throw error; // Re-throw for caller to handle
  }

  // Network/unknown errors
  console.error('Unexpected error during AI completion:', error);
  throw new Error('Failed to generate AI completion. Please try again.');
};

// Function to retry API calls with exponential backoff
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    // Don't retry if it's an auth error or final attempt
    if (
      (error instanceof OpenAI.APIError && error.status === 401) ||
      retries <= 0
    ) {
      throw error;
    }

    // Wait with exponential backoff
    const delay = RETRY_DELAY_MS * 2 ** (MAX_RETRIES - retries);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry with one less attempt
    return withRetry(fn, retries - 1);
  }
};

// Convert Vercel AI SDK message format to OpenAI format
const convertToOpenAIMessages = (messages: Message[]) => {
  return messages.map((m) => {
    // Filter out 'data' role which isn't supported by OpenAI
    const role = m.role === 'data' ? 'user' : m.role;
    return {
      role,
      content: m.content,
    };
  });
};

/**
 * Generate a completion from OpenAI (non-streaming)
 */
export const generateCompletion = async (
  messages: Message[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {},
) => {
  const {
    model = AI_MODELS.chatGPT4Turbo,
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  try {
    return await withRetry(async () => {
      const response = await openai.chat.completions.create({
        model,
        messages: convertToOpenAIMessages(messages) as any, // Type assertion to bypass strict typing
        temperature,
        max_tokens: maxTokens,
      });

      return response.choices[0].message.content;
    });
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Stream a completion from OpenAI
 */
export const streamCompletion = async (
  messages: Message[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {},
) => {
  const {
    model = AI_MODELS.chatGPT4Turbo,
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  try {
    // Use any to bypass type checking since we're using a compatible format
    const response = await openai.chat.completions.create({
      model,
      messages: convertToOpenAIMessages(messages) as any, // Type assertion to bypass strict typing
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    // Convert the response to a ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return the stream directly
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    // Return error as a response for consistency
    return new Response(
      `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      { status: 500 },
    );
  }
};

// API client for internal use (not directly exposed)
export const aiClient = {
  generateCompletion,
  streamCompletion,
  models: AI_MODELS,
};
