interface MemoryTopicResult {
  isMemoryTopic: boolean;
  topic?: string;
  confidence: number;
}

// Simple keyword-based memory topic detection
export function detectMemoryTopic(message: string): MemoryTopicResult {
  // Lowercase for case-insensitive matching
  const lowerMessage = message.toLowerCase();

  // Memory creation phrases
  const creationPhrases = [
    'create a memory',
    'make a memory',
    'save the memory',
    'capture this memory',
    'remember this',
    'document this',
  ];

  // Check if the message contains memory creation phrases
  const hasCreationPhrase = creationPhrases.some((phrase) =>
    lowerMessage.includes(phrase),
  );

  if (!hasCreationPhrase) {
    return { isMemoryTopic: false, confidence: 0 };
  }

  // Try to extract the topic
  const aboutPatterns = [
    /about (my|our|the) ([^.!?]+)/i,
    /memory (of|about|for) ([^.!?]+)/i,
    /remember (my|our|the) ([^.!?]+)/i,
  ];

  for (const pattern of aboutPatterns) {
    const match = lowerMessage.match(pattern);
    if (match && match[2]) {
      return {
        isMemoryTopic: true,
        topic: match[2].trim(),
        confidence: 0.9,
      };
    }
  }

  // Detected a memory request but couldn't extract the topic
  return {
    isMemoryTopic: true,
    confidence: 0.7,
  };
}
