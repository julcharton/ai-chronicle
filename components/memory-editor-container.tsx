'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { MemoryEditor } from './memory-editor';
import {
  createMemoryEditorHandler,
  validateMemoryContent,
} from '@/lib/editor/memory-editor-sync';
import { usePathname } from 'next/navigation';
import type { Suggestion } from '@/lib/db/schema';
import {
  AutoSaveStatus,
  type AutoSaveStatus as AutoSaveStatusType,
} from './auto-save-status';
import { autoSaveService } from '@/lib/services/auto-save-service';

export type MemoryEditorContainerProps = {
  memoryId: string;
  initialContent: string;
  initialTitle: string;
};

export function MemoryEditorContainer({
  memoryId,
  initialContent,
  initialTitle,
}: MemoryEditorContainerProps) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatusType>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const pathname = usePathname();

  // Track pending updates to handle navigation and window close events
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Reference to track if we're currently updating from remote source
  const isUpdatingRef = useRef(false);

  // Save timeout for delayed "saved" status transitions
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configure auto-save status change handler
  useEffect(() => {
    const handleStatusChange = (
      status: 'idle' | 'saving' | 'saved' | 'error',
    ) => {
      setSaveStatus(status);

      // For saved status, set a timeout to change back to idle after 3 seconds
      if (status === 'saved') {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      }
    };

    autoSaveService.updateConfig({
      onStatusChange: handleStatusChange,
    });

    return () => {
      // Clean up
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save handler for memory content
  const handleContentChange = useCallback(
    async (id: string, updatedContent: string, debounced: boolean) => {
      // Prevent saving if we're updating from a remote source
      if (isUpdatingRef.current) return;

      const validContent = validateMemoryContent(updatedContent);

      // Skip saving if content is empty or unchanged
      if (!validContent || validContent === content) return;

      // Update local state
      setContent(validContent);
      setHasPendingChanges(true);

      if (debounced) {
        // Clear any existing timeout for status transitions
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        try {
          // Use auto-save service to save the content
          const result = await autoSaveService.queueSave(id, validContent);

          if (result.success && result.timestamp) {
            setLastSavedAt(result.timestamp);
            setHasPendingChanges(false);
          } else if (result.error) {
            setSaveError(result.error);
          }
        } catch (error) {
          console.error('Error in auto-save:', error);
          setSaveError('Unexpected error during save');
        }
      }
    },
    [content],
  );

  // For image upload - would connect to a real image upload service
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    // This would be replaced with actual image upload functionality
    // For now, return a data URL as placeholder
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // In a real implementation, this would return the URL from the server
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Get the memory editor handler with the content change callback
  const { handleTransaction } = createMemoryEditorHandler({
    memoryId,
    onContentChange: handleContentChange,
    debounceDelay: 1000,
    debug: false,
  });

  // Function to handle AI assistance request
  const handleAIAssistance = useCallback(() => {
    console.log(
      'AI Assistance requested - will be implemented in a future update.',
    );
  }, []);

  // Force save any pending changes when user tries to navigate away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges) {
        // Save pending changes
        autoSaveService.forceSave(memoryId);

        // Standard approach to show browser dialog when there are unsaved changes
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // Handle navigation events
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // If component unmounts with pending changes, try to save them
      if (hasPendingChanges) {
        autoSaveService.forceSave(memoryId);
      }
    };
  }, [hasPendingChanges, memoryId]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <h1 className="text-xl font-semibold truncate">{initialTitle}</h1>
        <AutoSaveStatus
          status={saveStatus}
          lastSavedAt={lastSavedAt}
          error={saveError}
        />
      </div>

      <div className="flex-1">
        <MemoryEditor
          memoryId={memoryId}
          content={content}
          onSaveContent={(updatedContent, debounce) => {
            handleContentChange(memoryId, updatedContent, debounce);
          }}
          onImageUpload={handleImageUpload}
          onAIAssistanceRequest={handleAIAssistance}
          status="idle"
          isCurrentVersion={true}
          currentVersionIndex={0}
          suggestions={[]}
        />
      </div>
    </div>
  );
}
