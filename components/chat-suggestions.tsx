import { Button } from './ui/button';
import type { UseChatHelpers } from '@ai-sdk/react';

interface ChatSuggestionsProps {
  append: UseChatHelpers['append'];
  isMemoryFocused?: boolean;
}

export function ChatSuggestions({
  append,
  isMemoryFocused,
}: ChatSuggestionsProps) {
  const handleSuggestionClick = (suggestion: string) => {
    append({
      role: 'user',
      content: suggestion,
    });
  };

  // Memory-specific suggestions
  const memorySuggestions = [
    'Tell me about my childhood trip to the beach',
    'Create a memory about my graduation day',
    'I want to save the story about my first job',
    'Help me document my wedding memories',
  ];

  // General suggestions
  const generalSuggestions = [
    'What can you help me with?',
    'Write a short story',
    'Help me draft an email',
  ];

  const suggestions = isMemoryFocused ? memorySuggestions : generalSuggestions;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion}
          variant="outline"
          className="text-sm"
          onClick={() => handleSuggestionClick(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
