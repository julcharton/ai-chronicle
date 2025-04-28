'use client';

import { TwoColumnLayout } from '@/components/layout/two-column-layout';
import { MemorySyncProvider } from './memory-sync-context';
import { AISyncedEditor } from './ai-synced-editor';
import { AIEnhancedMemoryChat } from './ai-enhanced-memory-chat';
import type { VisibilityType } from '@/components/visibility-selector';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { AISuggestion, ContentChange } from '@/lib/editor/ai-editor-sync';
import { toast } from '@/components/ui/toast';

interface AISyncedMemoryContainerProps {
  memoryId: string;
  chatId: string;
  initialContent: string;
  initialTitle: string;
  visibility: VisibilityType;
  isReadonly?: boolean;
}

/**
 * Container component that integrates AI-enhanced synced MemoryEditor and MemoryChat
 * with bidirectional synchronization
 */
export function AISyncedMemoryContainer({
  memoryId,
  chatId,
  initialContent,
  initialTitle,
  visibility,
  isReadonly = false,
}: AISyncedMemoryContainerProps) {
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [currentAISuggestion, setCurrentAISuggestion] =
    useState<AISuggestion | null>(null);
  const [editorContent, setEditorContent] = useState(initialContent);

  // Reference to the editor component
  const editorRef = useRef<any>(null);

  // References to track last update times to avoid circular updates
  const lastEditorUpdateTime = useRef<number>(0);
  const lastChatUpdateTime = useRef<number>(0);

  // Handle content updates from the editor to chat
  const handleEditorContentUpdate = useCallback(
    (content: string, changes: ContentChange[]) => {
      const now = Date.now();
      lastEditorUpdateTime.current = now;

      // Set editor content
      setEditorContent(content);

      // If a significant change occurred, we might want to generate new AI suggestions
      const hasSignificantChanges = changes.some(
        (change) => change.length > 20 || change.type === 'addition',
      );

      if (hasSignificantChanges && isSyncEnabled) {
        console.log(
          'Significant content changes detected, updating chat context',
        );
      }
    },
    [isSyncEnabled],
  );

  // Handle AI suggestions generated from the chat
  const handleAISuggestion = useCallback(async (suggestion: AISuggestion) => {
    console.log('Received AI suggestion from chat:', suggestion);
    setCurrentAISuggestion(suggestion);

    // Show toast notification
    toast({
      title: 'New AI Suggestion',
      description: 'The AI has a suggestion for improving your memory.',
      action: (
        <button
          type="button"
          onClick={() => setCurrentAISuggestion(null)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          View
        </button>
      ),
    });
  }, []);

  // Handle chat requests to update content - this is key to updating the memory instead of creating a new document
  const handleChatContentUpdate = useCallback((newContent: string) => {
    const now = Date.now();

    // Check if this update is coming too soon after an editor update
    // This helps prevent circular updates
    if (now - lastEditorUpdateTime.current < 500) {
      console.log(
        'Ignoring chat content update - too soon after editor update',
      );
      return;
    }

    lastChatUpdateTime.current = now;
    console.log('Applying chat content update to memory editor');

    // Update the editor content state
    setEditorContent(newContent);

    // If we have access to the editor component via ref, update its content directly
    if (editorRef.current?.updateContent) {
      editorRef.current.updateContent(newContent);
    }
  }, []);

  // Share editor content with the chat component
  useEffect(() => {
    if (!isSyncEnabled) return;

    // Set a small delay to avoid immediate circular updates
    const now = Date.now();
    const delay = now - lastChatUpdateTime.current < 500 ? 600 : 0;

    const timer = setTimeout(() => {
      console.log('Synchronizing editor content with chat component');
    }, delay);

    return () => clearTimeout(timer);
  }, [editorContent, isSyncEnabled]);

  // Register the editor component
  const registerEditor = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  return (
    <div className="h-full w-full overflow-hidden">
      <MemorySyncProvider>
        <div className="flex justify-between items-center p-2 bg-accent/10">
          <h2 className="text-lg font-medium">Memory with AI Guidance</h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm" htmlFor="sync-toggle">
              Sync Editor & Chat
            </label>
            <input
              id="sync-toggle"
              type="checkbox"
              checked={isSyncEnabled}
              onChange={(e) => setIsSyncEnabled(e.target.checked)}
              className="rounded"
            />
          </div>
        </div>
        <TwoColumnLayout
          leftContent={
            <AISyncedEditor
              memoryId={memoryId}
              chatId={chatId}
              initialContent={initialContent}
              initialTitle={initialTitle}
              isSyncEnabledGlobal={isSyncEnabled}
              onContentChange={handleEditorContentUpdate}
              onAISuggestion={async (suggestion) => {
                console.log('Editor AI suggestion:', suggestion);

                // Pass to chat if needed
                if (isSyncEnabled) {
                  await handleAISuggestion(suggestion);
                }
              }}
              editorRef={registerEditor}
            />
          }
          rightContent={
            <AIEnhancedMemoryChat
              chatId={chatId}
              memoryId={memoryId}
              visibility={visibility}
              isReadonly={isReadonly}
              editorContent={editorContent}
              onContentUpdate={handleChatContentUpdate}
              onAISuggestionGenerated={handleAISuggestion}
              syncEnabled={isSyncEnabled}
            />
          }
        />
      </MemorySyncProvider>
    </div>
  );
}
