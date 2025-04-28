'use client';

import { useState, useEffect, useCallback } from 'react';
import { TwoColumnLayout } from '@/components/layout/two-column-layout';
import { v4 as uuidv4 } from 'uuid';
import type { UIMessage } from 'ai';
import { MemoryChatHeader } from '@/components/memory/memory-chat-header';
import { Button } from '@/components/ui/button';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

/**
 * Demo page showcasing the Memory Chat functionality
 */
export default function MemoryChatDemo() {
  const [memoryContent, setMemoryContent] = useState<string>(
    '# My Memory\n\nThis is a demo memory that will be updated by the chat interface when you interact with it.',
  );
  const [isGuidanceMode, setIsGuidanceMode] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: uuidv4(),
      content:
        "I'm here to help you capture your memories. What would you like to remember today?",
      role: 'assistant',
      createdAt: new Date(),
      parts: [
        {
          type: 'text',
          text: "I'm here to help you capture your memories. What would you like to remember today?",
        },
      ],
    },
  ]);

  // Toggle guidance mode
  const handleToggleGuidanceMode = () => {
    setIsGuidanceMode(!isGuidanceMode);
  };

  // Handle chat input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: UIMessage = {
      id: uuidv4(),
      content: inputValue,
      role: 'user',
      createdAt: new Date(),
      parts: [{ type: 'text', text: inputValue }],
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      const assistantMessage: UIMessage = {
        id: uuidv4(),
        content: aiResponse,
        role: 'assistant',
        createdAt: new Date(),
        parts: [{ type: 'text', text: aiResponse }],
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      // Update memory content if guidance mode is on
      if (isGuidanceMode) {
        setMemoryContent((prevContent) => {
          return `${prevContent}\n\n${aiResponse}`;
        });
      }
    }, 1000);
  };

  // Simple function to generate demo AI responses
  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('childhood') || lowerInput.includes('kid')) {
      return "## Childhood Memories\n\nChildhood memories are particularly important to document. Let's expand on this period of your life. Could you tell me about a favorite toy or game from when you were young?";
    }

    if (
      lowerInput.includes('school') ||
      lowerInput.includes('college') ||
      lowerInput.includes('university')
    ) {
      return '## Academic Journey\n\nYour educational experiences help shape who you become. What was a pivotal moment or influential teacher during your academic years?';
    }

    if (
      lowerInput.includes('travel') ||
      lowerInput.includes('trip') ||
      lowerInput.includes('vacation')
    ) {
      return '## Travel Experiences\n\nTravel memories can be especially vivid. Could you describe the sights, sounds, and smells of your most memorable destination?';
    }

    if (
      lowerInput.includes('family') ||
      lowerInput.includes('parent') ||
      lowerInput.includes('grandparent')
    ) {
      return "## Family Connections\n\nFamily stories are treasures to preserve. What's a family tradition or gathering that holds special meaning for you?";
    }

    return "That's an interesting memory to explore. Could you provide more details about when this happened and how it made you feel?";
  };

  return (
    <div className="container mx-auto p-4 h-full">
      <h1 className="text-2xl font-bold mb-4">Memory Chat Demo</h1>
      <p className="mb-6 text-muted-foreground">
        This demo showcases the Memory Chat component with guidance mode that
        automatically updates the memory content.
      </p>

      <div className="border rounded-lg h-[80vh]">
        <TwoColumnLayout
          leftColumnTitle="Memory Content"
          rightColumnTitle="Memory Chat"
          leftContent={
            <div className="p-4 prose dark:prose-invert h-full overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: memoryContent }} />
            </div>
          }
          rightContent={
            <div className="h-full w-full flex flex-col overflow-hidden">
              <MemoryChatHeader
                title="Memory Guidance Chat"
                chatId="demo-chat"
                selectedModelId={DEFAULT_CHAT_MODEL}
                selectedVisibilityType="private"
                isGuidanceMode={isGuidanceMode}
                onToggleGuidanceMode={handleToggleGuidanceMode}
              />

              <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'p-3 rounded-lg max-w-[80%]',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted',
                    )}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="border-t p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border rounded-md bg-background"
                  />
                  <Button type="submit">Send</Button>
                </div>
              </form>
            </div>
          }
        />
      </div>

      <div className="mt-4 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How to Use This Demo</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Type messages in the chat to interact with the AI memory guide
          </li>
          <li>
            Toggle the "Guidance Mode" button to enable/disable automatic
            content updates
          </li>
          <li>
            Watch as the memory content on the left is updated based on your
            conversation
          </li>
          <li>
            Try asking about: childhood, school, travel, or family memories
          </li>
        </ul>
      </div>
    </div>
  );
}
