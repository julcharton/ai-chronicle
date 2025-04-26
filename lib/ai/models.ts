export const DEFAULT_CHAT_MODEL: string = 'memory-document-model';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'memory-document-model',
    name: 'Memory Documents',
    description: 'Specialized for creating personal memory documents',
  },
  {
    id: 'chat-model',
    name: 'Chat model',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Advanced model for memory interviews with high comprehension',
  },
];

// Model identifiers for AI operations
export const AI_MODELS = {
  chatGPT4Turbo: 'gpt-4-turbo', // For memory interviews
  chatGPT4: 'gpt-4o', // For general chat
  chatGPT35: 'gpt-3.5-turbo', // For simple operations
  whisper: 'whisper-1', // For audio transcription
};
