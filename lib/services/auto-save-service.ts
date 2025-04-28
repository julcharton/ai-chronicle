import { updateMemoryAction } from '@/app/(chat)/memories/[id]/actions';
import {
  extractMetadataFromContent,
  validateMemoryContent,
} from '../editor/memory-editor-sync';

export type AutoSaveResult = {
  success: boolean;
  error?: string;
  timestamp?: Date;
};

export type AutoSaveConfig = {
  saveDelay: number;
  maxRetries: number;
  retryDelay: number;
  onStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
};

const DEFAULT_CONFIG: AutoSaveConfig = {
  saveDelay: 1000,
  maxRetries: 3,
  retryDelay: 2000,
};

/**
 * Auto-save service for memory content
 * Provides a centralized way to handle auto-saving memory content
 */
export class AutoSaveService {
  private config: AutoSaveConfig;
  private saveQueue: Map<string, { content: string; retryCount: number }> =
    new Map();
  private saveTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private isProcessing = false;
  private debug = true; // Enable debug logging

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update configuration settings
   * @param config Partial configuration to update
   */
  public updateConfig(config: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Queue content for saving
   * @param memoryId ID of the memory to save
   * @param content Content to save
   * @returns Promise that resolves when the save is complete
   */
  public queueSave(memoryId: string, content: string): Promise<AutoSaveResult> {
    // Debug log
    if (this.debug) {
      console.log(
        `[AutoSave] Queueing save for memory ${memoryId.substring(0, 8)}...`,
      );
    }

    // Validate the content
    const validContent = validateMemoryContent(content);
    if (!validContent) {
      console.error('[AutoSave] Invalid content, not saving');
      return Promise.resolve({ success: false, error: 'Invalid content' });
    }

    // Update status to indicate saving
    if (this.config.onStatusChange) {
      this.config.onStatusChange('saving');
    }

    // Add to save queue
    this.saveQueue.set(memoryId, {
      content: validContent,
      retryCount: 0,
    });

    // Clear any existing timeout for this memory
    if (this.saveTimeouts.has(memoryId)) {
      clearTimeout(this.saveTimeouts.get(memoryId));
    }

    // Create a promise that will resolve when the save is complete
    return new Promise((resolve) => {
      // Set a timeout to save after the delay
      const timeout = setTimeout(() => {
        this.processSaveQueue(memoryId).then(resolve);
      }, this.config.saveDelay);

      this.saveTimeouts.set(memoryId, timeout);
    });
  }

  /**
   * Process the save queue
   * @param memoryId ID of the memory to save
   * @returns Promise that resolves with the save result
   */
  private async processSaveQueue(memoryId: string): Promise<AutoSaveResult> {
    if (this.debug) {
      console.log(
        `[AutoSave] Processing save queue for memory ${memoryId.substring(0, 8)}`,
      );
    }

    if (this.isProcessing) {
      // Another save is in progress, wait and then check again
      if (this.debug) {
        console.log('[AutoSave] Another save in progress, waiting...');
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.processSaveQueue(memoryId);
    }

    const queueItem = this.saveQueue.get(memoryId);
    if (!queueItem) {
      console.warn('[AutoSave] No content to save in queue');
      return { success: false, error: 'No content to save' };
    }

    // Remove from queue
    this.saveQueue.delete(memoryId);
    this.saveTimeouts.delete(memoryId);

    this.isProcessing = true;

    try {
      // Extract metadata from content
      const metadata = extractMetadataFromContent(queueItem.content);

      if (this.debug) {
        console.log('[AutoSave] Extracted metadata:', metadata);
        console.log('[AutoSave] Calling updateMemoryAction...');
      }

      // Update memory on the server
      const result = await updateMemoryAction({
        id: memoryId,
        content: queueItem.content,
        metadata,
      });

      if (this.debug) {
        console.log('[AutoSave] updateMemoryAction result:', result);
      }

      if (result.success) {
        // Save successful
        const timestamp = new Date();

        if (this.debug) {
          console.log(
            `[AutoSave] Save successful at ${timestamp.toISOString()}`,
          );
        }

        // Update status to indicate saved
        if (this.config.onStatusChange) {
          this.config.onStatusChange('saved');
        }

        this.isProcessing = false;
        return { success: true, timestamp };
      } else {
        // Handle retry logic for failed saves
        console.error('[AutoSave] Save failed:', result.error);

        if (queueItem.retryCount < this.config.maxRetries) {
          // Re-queue with incremented retry count
          if (this.debug) {
            console.log(
              `[AutoSave] Retrying (${queueItem.retryCount + 1}/${this.config.maxRetries})`,
            );
          }

          this.saveQueue.set(memoryId, {
            content: queueItem.content,
            retryCount: queueItem.retryCount + 1,
          });

          // Set timeout for retry
          const timeout = setTimeout(() => {
            this.processSaveQueue(memoryId);
          }, this.config.retryDelay);

          this.saveTimeouts.set(memoryId, timeout);

          this.isProcessing = false;
          return {
            success: false,
            error: `Save failed, retrying (${queueItem.retryCount + 1}/${this.config.maxRetries})`,
          };
        } else {
          // Update status to indicate error
          console.error('[AutoSave] Failed after max retries');

          if (this.config.onStatusChange) {
            this.config.onStatusChange('error');
          }

          this.isProcessing = false;
          return {
            success: false,
            error: result.error || 'Failed to save after multiple attempts',
          };
        }
      }
    } catch (error) {
      // Handle unexpected errors
      console.error('[AutoSave] Error in auto-save service:', error);

      // Update status to indicate error
      if (this.config.onStatusChange) {
        this.config.onStatusChange('error');
      }

      this.isProcessing = false;
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected error during save',
      };
    }
  }

  /**
   * Force immediate save of any pending content
   * @param memoryId ID of the memory to save
   * @returns Promise that resolves with the save result
   */
  public forceSave(memoryId: string): Promise<AutoSaveResult> {
    if (this.debug) {
      console.log(`[AutoSave] Force saving memory ${memoryId.substring(0, 8)}`);
    }

    // Clear any existing timeout
    if (this.saveTimeouts.has(memoryId)) {
      clearTimeout(this.saveTimeouts.get(memoryId));
      this.saveTimeouts.delete(memoryId);
    }

    // If there's content in the queue, process it immediately
    if (this.saveQueue.has(memoryId)) {
      return this.processSaveQueue(memoryId);
    }

    // Nothing to save
    if (this.debug) {
      console.log('[AutoSave] Nothing to force save');
    }
    return Promise.resolve({ success: true });
  }

  /**
   * Cancel any pending saves
   * @param memoryId ID of the memory to cancel saves for
   */
  public cancelSave(memoryId: string): void {
    if (this.debug) {
      console.log(
        `[AutoSave] Cancelling save for memory ${memoryId.substring(0, 8)}`,
      );
    }

    // Clear any existing timeout
    if (this.saveTimeouts.has(memoryId)) {
      clearTimeout(this.saveTimeouts.get(memoryId));
      this.saveTimeouts.delete(memoryId);
    }

    // Remove from queue
    this.saveQueue.delete(memoryId);
  }

  /**
   * Check if there are pending saves
   * @param memoryId ID of the memory to check
   * @returns True if there are pending saves, false otherwise
   */
  public hasPendingSaves(memoryId: string): boolean {
    const hasPending =
      this.saveQueue.has(memoryId) || this.saveTimeouts.has(memoryId);
    if (this.debug) {
      console.log(
        `[AutoSave] Has pending saves for ${memoryId.substring(0, 8)}: ${hasPending}`,
      );
    }
    return hasPending;
  }

  /**
   * Directly save content without using the queue system
   * Use this as a fallback when the queue system isn't working
   * @param params Parameters for saving memory
   * @returns Promise that resolves with the save result
   */
  public async save(params: {
    memoryId: string;
    content: string;
  }): Promise<AutoSaveResult> {
    if (this.debug) {
      console.log(
        `[AutoSave] Direct save for memory ${params.memoryId.substring(0, 8)}`,
      );
    }

    try {
      const metadata = extractMetadataFromContent(params.content);

      // Call the server action directly
      const result = await updateMemoryAction({
        id: params.memoryId,
        content: params.content,
        metadata,
      });

      if (this.debug) {
        console.log('[AutoSave] Direct save result:', result);
      }

      if (result.success) {
        if (this.config.onStatusChange) {
          this.config.onStatusChange('saved');
        }
        return { success: true, timestamp: new Date() };
      } else {
        if (this.config.onStatusChange) {
          this.config.onStatusChange('error');
        }
        return {
          success: false,
          error: result.error || 'Unknown error during direct save',
        };
      }
    } catch (error) {
      console.error('[AutoSave] Error during direct save:', error);

      if (this.config.onStatusChange) {
        this.config.onStatusChange('error');
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected error during direct save',
      };
    }
  }
}

// Export a singleton instance of the service
export const autoSaveService = new AutoSaveService();
