'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { Chat } from '@/components/chat';
import type { VisibilityType } from '@/components/visibility-selector';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import type { AISuggestion, ContentChange } from '@/lib/editor/ai-editor-sync';

/**
 * Interface for AI-Enhanced Memory Chat component props
 */
interface AIEnhancedMemoryChatProps {
  chatId: string;
  memoryId: string;
  visibility: VisibilityType;
  isReadonly?: boolean;
  onContentUpdate?: (newContent: string) => void;
  onAISuggestionGenerated?: (suggestion: AISuggestion) => Promise<void>;
  initialMessages?: any[];
  title?: string;
  editorContent?: string;
}

/**
 * AI-Enhanced memory chat that integrates with the memory synchronization system
 * and provides guidance for memory capture
 */
export function AIEnhancedMemoryChat({
  chatId,
  memoryId,
  visibility,
  isReadonly = false,
  onContentUpdate,
  onAISuggestionGenerated,
  initialMessages = [],
  title = 'Memory Chat',
  editorContent,
}: AIEnhancedMemoryChatProps) {
  const [selectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [contentUpdatePending, setContentUpdatePending] = useState(false);
  const [localEditorContent, setLocalEditorContent] = useState(
    editorContent || '',
  );

  // Track the last AI suggestion sent to avoid duplicates
  const lastSuggestionRef = useRef<string>('');
  const lastContentUpdateTimeRef = useRef<number>(0);

  // Update local content when editorContent prop changes
  useEffect(() => {
    if (editorContent && editorContent !== localEditorContent) {
      setLocalEditorContent(editorContent);
    }
  }, [editorContent, localEditorContent]);

  // Debounced function to update memory content based on chat messages
  const updateMemoryContent = useCallback(
    debounce((content: string) => {
      if (onContentUpdate && content) {
        lastContentUpdateTimeRef.current = Date.now();
        onContentUpdate(content);
        setContentUpdatePending(false);
      }
    }, 500),
    [onContentUpdate],
  );

  // Process editor content changes to inform AI context
  const processEditorChanges = useCallback(
    (content: string, changes: ContentChange[]) => {
      // We'd send these changes to the AI to maintain context
      // This is a placeholder for where we'd update the AI's context
      setLocalEditorContent(content);

      // If significant changes, we might want to generate a new AI message
      const hasSignificantChanges = changes.some(
        (change) => change.length > 20 || change.type === 'addition',
      );

      if (hasSignificantChanges) {
        // Potentially trigger AI to generate a new suggestion
        console.log(
          'Significant editor changes detected, AI could generate new suggestions',
        );
      }
    },
    [],
  );

  // Generate an AI suggestion based on current editor content
  const generateAISuggestion = useCallback(
    async (prompt: string, targetContent: string) => {
      // In a real implementation, this would call the API endpoint
      try {
        // We would call our /api/memories/:id/suggestions endpoint here
        const response = await fetch(`/api/memories/${memoryId}/suggestions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: targetContent || localEditorContent,
            prompt: prompt,
            maxSuggestions: 1,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Error generating suggestions: ${response.statusText}`,
          );
        }

        const data = await response.json();

        if (data.suggestions && data.suggestions.length > 0) {
          const suggestion = data.suggestions[0];

          // Check if this is a duplicate suggestion
          if (lastSuggestionRef.current === suggestion.content) {
            console.log('Duplicate suggestion, ignoring');
            return;
          }

          lastSuggestionRef.current = suggestion.content;

          // Create a proper AISuggestion object
          const aiSuggestion: AISuggestion = {
            id: suggestion.id || uuidv4(),
            content: suggestion.content,
            description: suggestion.description || 'AI-generated suggestion',
          };

          // Call the handler if provided
          if (onAISuggestionGenerated) {
            await onAISuggestionGenerated(aiSuggestion);
          }

          // Add the suggestion as a new message
          const aiMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: aiSuggestion.content,
          };

          setMessages((prev) => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error('Error generating AI suggestion:', error);

        // Add a fallback message
        const aiMessage = {
          id: uuidv4(),
          role: 'assistant',
          content:
            "I'd like to help you enhance your memory with more details. What else do you remember about this experience?",
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
    },
    [memoryId, localEditorContent, onAISuggestionGenerated],
  );

  // Watch for changes in messages to update the editor content
  const handleMessagesChange = useCallback(
    (newMessages: any[]) => {
      setMessages(newMessages);

      if (newMessages.length > 0) {
        const lastMessage = newMessages[newMessages.length - 1];

        // Only update if it's a user message (AI messages come through the suggestion system)
        if (lastMessage.role === 'user' && lastMessage.content) {
          // User is asking something - potentially generate a suggestion
          generateAISuggestion(lastMessage.content, localEditorContent);
        }
      }
    },
    [localEditorContent, generateAISuggestion],
  );

  // Initialize with editor content when it changes
  useEffect(() => {
    if (localEditorContent && !contentUpdatePending) {
      // Maybe trigger AI to analyze content
      console.log(
        `Editor content updated in chat component: ${localEditorContent.substring(0, 50)}...`,
      );
    }
  }, [localEditorContent, contentUpdatePending]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <Chat
          key={chatId}
          id={chatId}
          initialMessages={messages}
          selectedChatModel={selectedModel}
          selectedVisibilityType={visibility}
          isReadonly={isReadonly}
          onMessagesChange={handleMessagesChange}
        />
        <DataStreamHandler id={chatId} />
      </div>
    </div>
  );
}
