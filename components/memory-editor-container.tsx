'use client';

import { useState, useEffect, useCallback } from 'react';
import { MemoryEditor } from '@/components/memory-editor';
import {
  AutoSaveStatus,
  type AutoSaveStatus as AutoSaveStatusType,
} from './auto-save-status';
import { autoSaveService } from '@/lib/services/auto-save-service';

export type MemoryEditorContainerProps = {
  memoryId: string;
  initialContent: string;
  initialTitle: string;
  isReadonly?: boolean;
};

/**
 * Container component for the memory editor with auto-save functionality
 */
export function MemoryEditorContainer({
  memoryId,
  initialContent,
  initialTitle,
  isReadonly = false,
}: MemoryEditorContainerProps) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatusType>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds between retries

  // Function to handle content changes with auto-save
  const handleContentChange = async (
    memoryId: string,
    newContent: string,
    debounce = true,
  ) => {
    setContent(newContent);
    setHasPendingChanges(true);

    // Start saving immediately or with debounce
    if (!debounce) {
      await autoSaveContent(memoryId, newContent);
    }
  };

  // Auto-save function
  const autoSaveContent = async (memoryId: string, content: string) => {
    try {
      setSaveStatus('saving');
      setSaveError(undefined);

      // Validate content
      const validContent = content.trim();

      // Skip saving if content is empty or unchanged
      if (!validContent) {
        console.log('Content is empty, skipping save');
        setSaveStatus('idle');
        return;
      }

      // Update local state
      setContent(validContent);

      // Save to server
      const result = await autoSaveService.save({
        memoryId,
        content: validContent,
      });

      if (result.success) {
        // Update status on success
        console.log('Save successful', result);
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        setHasPendingChanges(false);
        setRetryCount(0); // Reset retry count on success
      } else {
        // Handle error
        console.error('Save failed', result.error);
        setSaveStatus('error');
        setSaveError(result.error || 'Unknown error occurred');

        // Implement retry logic
        if (retryCount < MAX_RETRIES) {
          console.log(
            `Retry ${retryCount + 1}/${MAX_RETRIES} after ${RETRY_DELAY}ms`,
          );
          setTimeout(() => {
            setRetryCount((prevCount) => prevCount + 1);
            autoSaveContent(memoryId, content);
          }, RETRY_DELAY);
        }
      }
    } catch (error) {
      console.error('Failed to auto-save memory:', error);
      setSaveStatus('error');
      setSaveError('Failed to save changes');

      // Implement retry logic for exceptions too
      if (retryCount < MAX_RETRIES) {
        console.log(
          `Retry ${retryCount + 1}/${MAX_RETRIES} after error, waiting ${RETRY_DELAY}ms`,
        );
        setTimeout(() => {
          setRetryCount((prevCount) => prevCount + 1);
          autoSaveContent(memoryId, content);
        }, RETRY_DELAY);
      }
    }
  };

  // Manual save handler when auto-save fails
  const handleManualSave = useCallback(async () => {
    if (!hasPendingChanges) return;

    console.log('Attempting manual save...');
    await autoSaveContent(memoryId, content);
  }, [content, hasPendingChanges, memoryId]);

  // Handle image uploads
  // We're using a workaround for the type mismatch by returning a string URL
  // In a real implementation, this would be synchronized with the actual MemoryEditor component
  const handleImageUpload = async (file: File): Promise<string> => {
    // Placeholder for image upload
    console.log('Image upload requested:', file.name);
    return URL.createObjectURL(file);
  };

  // Handle AI assistance requests
  // Adjusting the function signature to match what the MemoryEditor expects
  const handleAIAssistance = () => {
    // In a real implementation, this would handle AI assistance requests
    console.log('AI assistance requested');
  };

  // Set up auto-save interval
  useEffect(() => {
    if (!hasPendingChanges) return;

    const autoSaveInterval = setInterval(async () => {
      if (hasPendingChanges) {
        await autoSaveContent(memoryId, content);
      }
    }, 3000); // Auto-save every 3 seconds if there are changes

    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [hasPendingChanges, memoryId, content]);

  // Add a key press handler for ctrl+s/cmd+s manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleManualSave]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 py-2 border-b shrink-0">
        <h1 className="text-xl font-semibold truncate">{initialTitle}</h1>
        <div className="flex items-center space-x-3">
          <AutoSaveStatus
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            error={saveError}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
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
