import { AutoSaveService } from '../auto-save-service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the updateMemoryAction
vi.mock('@/app/(chat)/memories/[id]/actions', () => ({
  updateMemoryAction: vi.fn(),
}));

// Mock the validateMemoryContent and extractMetadataFromContent functions
vi.mock('@/lib/editor/memory-editor-sync', () => ({
  validateMemoryContent: vi.fn((content) => content), // Return the input content
  extractMetadataFromContent: vi.fn(() => ({})), // Return empty metadata object
}));

// Import after mocking
import { updateMemoryAction } from '@/app/(chat)/memories/[id]/actions';

describe('AutoSaveService', () => {
  let autoSaveService: AutoSaveService;
  const mockMemoryId = 'test-memory-id';
  const mockContent = 'Test content';

  beforeEach(() => {
    vi.useFakeTimers();
    autoSaveService = new AutoSaveService({
      saveDelay: 100,
      maxRetries: 2,
      retryDelay: 200,
    });

    // Reset mocks
    vi.mocked(updateMemoryAction).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should queue content for saving and process after delay', async () => {
    // Mock successful save
    vi.mocked(updateMemoryAction).mockResolvedValueOnce({ success: true });

    // Set up status change tracking
    let statusChangeCount = 0;
    let lastStatus: string | null = null;

    autoSaveService.updateConfig({
      onStatusChange: (status) => {
        statusChangeCount++;
        lastStatus = status;
      },
    });

    // Queue save
    const savePromise = autoSaveService.queueSave(mockMemoryId, mockContent);

    // Status should be set to saving
    expect(statusChangeCount).toBe(1);
    expect(lastStatus).toBe('saving');

    // Advance timers to trigger save
    await vi.advanceTimersByTimeAsync(100);

    // Wait for save to complete
    const result = await savePromise;

    // Verify save was successful
    expect(result.success).toBe(true);
    expect(result.timestamp).toBeInstanceOf(Date);

    // Status should be set to saved
    expect(statusChangeCount).toBe(2);
    expect(lastStatus).toBe('saved');

    // Verify updateMemoryAction was called with correct arguments
    expect(updateMemoryAction).toHaveBeenCalledTimes(1);
    expect(updateMemoryAction).toHaveBeenCalledWith({
      id: mockMemoryId,
      content: mockContent,
      metadata: {},
    });
  });

  it('should retry failed saves up to maxRetries times', async () => {
    // Mock failed save followed by successful save
    vi.mocked(updateMemoryAction)
      .mockResolvedValueOnce({ success: false, error: 'Failed to save' })
      .mockResolvedValueOnce({ success: true });

    // Queue save
    const savePromise = autoSaveService.queueSave(mockMemoryId, mockContent);

    // Advance timers to trigger initial save
    await vi.advanceTimersByTimeAsync(100);

    // Advance timers to trigger retry
    await vi.advanceTimersByTimeAsync(200);

    // Wait for save to complete
    const result = await savePromise;

    // Verify retry was successful
    expect(result.success).toBe(false);
    expect(result.error).toContain('retrying (1/2)');

    // Verify updateMemoryAction was called twice
    expect(updateMemoryAction).toHaveBeenCalledTimes(2);
  });

  it('should handle force save of pending content', async () => {
    // Mock successful save
    vi.mocked(updateMemoryAction).mockResolvedValueOnce({ success: true });

    // Queue save but don't advance timers
    autoSaveService.queueSave(mockMemoryId, mockContent);

    // Force save
    const result = await autoSaveService.forceSave(mockMemoryId);

    // Verify force save was successful
    expect(result.success).toBe(true);

    // Verify updateMemoryAction was called
    expect(updateMemoryAction).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending saves', async () => {
    // Queue save but don't advance timers
    autoSaveService.queueSave(mockMemoryId, mockContent);

    // Verify pending save is tracked
    expect(autoSaveService.hasPendingSaves(mockMemoryId)).toBe(true);

    // Cancel save
    autoSaveService.cancelSave(mockMemoryId);

    // Verify pending save is no longer tracked
    expect(autoSaveService.hasPendingSaves(mockMemoryId)).toBe(false);

    // Advance timers - no save should occur
    await vi.advanceTimersByTimeAsync(100);

    // Verify updateMemoryAction was not called
    expect(updateMemoryAction).not.toHaveBeenCalled();
  });
});
