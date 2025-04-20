// Export model constants
export { AI_MODELS, chatModels, DEFAULT_CHAT_MODEL } from './models';

// Export providers
export { myProvider } from './providers';

// Export transcription utilities
export { transcribeAudio, transcribeAudioFromUrl } from './transcription';

// Export completion utilities
export { generateCompletion, streamCompletion } from './completion';

// Export prompts
export * from './prompts';

// Re-export necessary types from the ai library
export type { Message, AssistantMessage } from 'ai';
