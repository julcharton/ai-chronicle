'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { MemoryEditorContainer } from '@/components/memory-editor-container';
import { useMemorySync } from './memory-sync-context';
import { debounce } from 'lodash';
import { AIEditorSync, type AISuggestion } from '@/lib/editor/ai-editor-sync';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2 } from 'lucide-react';

interface AISyncedEditorProps {
  memoryId: string;
  chatId: string;
  initialContent: string;
  initialTitle: string;
  isSyncEnabledGlobal?: boolean;
  onAISuggestion?: (suggestion: AISuggestion) => void;
}

/**
 * Wrapper around MemoryEditorContainer that adds AI synchronization
 */
export function AISyncedEditor({
  memoryId,
  chatId,
  initialContent,
  initialTitle,
  isSyncEnabledGlobal,
  onAISuggestion,
}: AISyncedEditorProps) {
  const {
    editorScrollRef,
    registerEditorScroll,
    isSyncEnabled,
    setIsSyncEnabled,
    highlightedEditorPosition,
  } = useMemorySync();

  const [content, setContent] = useState(initialContent);
  const editorSyncRef = useRef<AIEditorSync | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] =
    useState<AISuggestion | null>(null);

  // Initialize AI editor sync
  useEffect(() => {
    if (!editorSyncRef.current && memoryId && chatId) {
      editorSyncRef.current = new AIEditorSync({
        memoryId,
        chatId,
        debug: true,
        onEditorContentChange: async (memoryId, content, changes) => {
          console.log(
            `Editor content changed: ${content.substring(0, 50)}... with ${changes.length} changes`,
          );
          // In a real implementation, we would send these changes to the AI service
        },
        onAISuggestionReceived: async (suggestion) => {
          console.log('AI suggestion received', suggestion);
          if (onAISuggestion) {
            onAISuggestion(suggestion);
          }
          // Add to suggestions list
          setSuggestions((prev) => [...prev, suggestion]);
        },
        onConflictDetected: async (editorContent, aiSuggestion) => {
          // Store the suggestion and open the conflict dialog
          setPendingSuggestion(aiSuggestion);
          setConflictDialogOpen(true);

          // This is a simple promise that will be resolved when the user makes a decision
          return new Promise<boolean>((resolve) => {
            // Set up resolvers that will be called from the UI
            window.resolveSuggestionConflict = (shouldApply: boolean) => {
              setConflictDialogOpen(false);
              setPendingSuggestion(null);
              resolve(shouldApply);
              delete window.resolveSuggestionConflict;
            };
          });
        },
      });

      // Update ability to undo/redo initially
      setCanUndo(false);
      setCanRedo(false);
    }

    return () => {
      // Clean up conflict resolver if it exists
      if (window.resolveSuggestionConflict) {
        delete window.resolveSuggestionConflict;
      }
    };
  }, [memoryId, chatId, onAISuggestion]);

  // Use the global sync toggle if provided
  useEffect(() => {
    if (isSyncEnabledGlobal !== undefined && setIsSyncEnabled) {
      setIsSyncEnabled(isSyncEnabledGlobal);
    }
  }, [isSyncEnabledGlobal, setIsSyncEnabled]);

  // Handle content changes
  const handleContentChange = useCallback((updatedContent: string) => {
    setContent(updatedContent);

    // Notify AI editor sync about the change
    if (editorSyncRef.current) {
      editorSyncRef.current.handleEditorUpdate(updatedContent);

      // Update undo/redo availability
      setCanUndo(editorSyncRef.current.canUndo());
      setCanRedo(editorSyncRef.current.canRedo());
    }
  }, []);

  // Apply AI suggestion
  const applyAISuggestion = useCallback(async (suggestion: AISuggestion) => {
    if (editorSyncRef.current) {
      const result = await editorSyncRef.current.applySuggestion(suggestion);

      // Update undo/redo availability
      setCanUndo(editorSyncRef.current.canUndo());
      setCanRedo(editorSyncRef.current.canRedo());

      return result;
    }
    return false;
  }, []);

  // Handle undo action
  const handleUndo = useCallback(() => {
    if (editorSyncRef.current && editorSyncRef.current.canUndo()) {
      editorSyncRef.current.undo();

      // Update buttons state
      setCanUndo(editorSyncRef.current.canUndo());
      setCanRedo(editorSyncRef.current.canRedo());
    }
  }, []);

  // Handle redo action
  const handleRedo = useCallback(() => {
    if (editorSyncRef.current && editorSyncRef.current.canRedo()) {
      editorSyncRef.current.redo();

      // Update buttons state
      setCanUndo(editorSyncRef.current.canUndo());
      setCanRedo(editorSyncRef.current.canRedo());
    }
  }, []);

  // Resolve conflict
  const resolveConflict = useCallback((shouldApply: boolean) => {
    if (window.resolveSuggestionConflict) {
      window.resolveSuggestionConflict(shouldApply);
    }
  }, []);

  // Create a debounced version of the scroll handler
  const handleScroll = useCallback(
    debounce((e: Event) => {
      const target = e.target as HTMLDivElement;

      if (target) {
        // Calculate scroll position and max scroll
        const scrollPosition = target.scrollTop;
        const maxScroll = target.scrollHeight - target.clientHeight;

        // Register the scroll with the sync context
        registerEditorScroll(scrollPosition, maxScroll);
      }
    }, 50),
    [registerEditorScroll],
  );

  // Set up scroll event listener
  useEffect(() => {
    const scrollElement = editorScrollRef.current;

    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);

      // Initial scroll position
      const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
      registerEditorScroll(scrollElement.scrollTop, maxScroll);

      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        handleScroll.cancel();
      };
    }
  }, [handleScroll, registerEditorScroll]);

  // Effect to scroll to highlighted position
  useEffect(() => {
    if (
      isSyncEnabled &&
      highlightedEditorPosition !== null &&
      editorScrollRef.current
    ) {
      editorScrollRef.current.scrollTop = highlightedEditorPosition;
    }
  }, [highlightedEditorPosition, isSyncEnabled]);

  // Flush changes before unmounting
  useEffect(() => {
    return () => {
      if (editorSyncRef.current) {
        // We can't await this in the cleanup function,
        // but at least we'll trigger the flush
        editorSyncRef.current.flushChanges();
      }
    };
  }, []);

  // AI Suggestion UI
  const SuggestionUI = () => {
    if (suggestions.length === 0) return null;

    return (
      <div className="fixed bottom-4 right-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg shadow-lg max-w-md z-50">
        <h3 className="font-medium mb-2">AI Suggestion</h3>
        <p className="text-sm mb-3">
          {suggestions[suggestions.length - 1].content}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            onClick={async () => {
              await applyAISuggestion(suggestions[suggestions.length - 1]);
              setSuggestions([]);
            }}
          >
            Apply
          </button>
          <button
            type="button"
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={() => setSuggestions([])}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  };

  // Conflict Resolution UI
  const ConflictDialog = () => {
    if (!conflictDialogOpen || !pendingSuggestion) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full">
          <h2 className="text-xl font-bold mb-4">Content Changed</h2>
          <p className="mb-4">
            The editor content has changed since your last interaction. Would
            you still like to apply this AI suggestion?
          </p>
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded mb-4">
            <p className="italic">{pendingSuggestion.content}</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => resolveConflict(false)}>
              Cancel
            </Button>
            <Button onClick={() => resolveConflict(true)}>Apply Anyway</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">
      <div className="flex items-center justify-end gap-2 p-1 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
      <div ref={editorScrollRef} className="flex-1 overflow-auto">
        <MemoryEditorContainer
          memoryId={memoryId}
          initialContent={initialContent}
          initialTitle={initialTitle}
        />
      </div>
      <SuggestionUI />
      <ConflictDialog />
    </div>
  );
}

// Add to global window type
declare global {
  interface Window {
    resolveSuggestionConflict?: (shouldApply: boolean) => void;
  }
}
