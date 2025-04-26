import {
  MemoryEditorState,
  validateMemoryContent,
  extractMetadataFromContent,
} from '@/lib/editor/memory-editor-sync';

// Mock the editor view
const mockEditorView = {
  state: {
    apply: jest.fn().mockReturnThis(),
    doc: {
      content: {
        size: 100,
      },
    },
    tr: {
      replaceWith: jest.fn().mockReturnThis(),
      setMeta: jest.fn().mockReturnThis(),
    },
  },
  updateState: jest.fn(),
  dispatch: jest.fn(),
};

// Mock the transaction
const mockTransaction = {
  docChanged: true,
  getMeta: jest.fn((key) => (key === 'no-save' ? false : undefined)),
};

// Mock the buildContentFromDocument function
jest.mock('@/lib/editor/functions', () => ({
  buildContentFromDocument: jest
    .fn()
    .mockImplementation(
      () => '# Mocked Content\n\nThis is some mocked content.',
    ),
  buildDocumentFromContent: jest.fn().mockImplementation(() => ({
    content: {
      size: 100,
    },
  })),
}));

describe('Memory Editor Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MemoryEditorState', () => {
    it('should handle transaction and trigger content update', async () => {
      // Create mock callback
      const onContentChange = jest.fn().mockResolvedValue(undefined);

      // Create memory editor state
      const editorState = new MemoryEditorState({
        memoryId: 'test-memory-id',
        onContentChange,
        debounceDelay: 0, // Set to 0 for immediate execution in tests
      });

      // Handle a transaction
      editorState.handleTransaction({
        transaction: mockTransaction,
        editorView: mockEditorView,
      });

      // Wait for debounced function to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify editor state was updated
      expect(mockEditorView.updateState).toHaveBeenCalled();

      // Verify content change was triggered
      expect(onContentChange).toHaveBeenCalledWith(
        'test-memory-id',
        '# Mocked Content\n\nThis is some mocked content.',
        true,
      );
    });

    it('should not trigger update if transaction has no-save meta', async () => {
      // Create mock callback
      const onContentChange = jest.fn().mockResolvedValue(undefined);

      // Create memory editor state
      const editorState = new MemoryEditorState({
        memoryId: 'test-memory-id',
        onContentChange,
        debounceDelay: 0,
      });

      // Mock transaction with no-save meta
      const noSaveTransaction = {
        ...mockTransaction,
        getMeta: jest.fn((key) => (key === 'no-save' ? true : undefined)),
      };

      // Handle transaction
      editorState.handleTransaction({
        transaction: noSaveTransaction,
        editorView: mockEditorView,
      });

      // Wait for debounced function to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify editor state was not updated
      expect(mockEditorView.updateState).not.toHaveBeenCalled();

      // Verify content change was not triggered
      expect(onContentChange).not.toHaveBeenCalled();
    });
  });

  describe('validateMemoryContent', () => {
    it('should return empty string for null or undefined content', () => {
      expect(validateMemoryContent('')).toBe('');
      expect(validateMemoryContent(null as any)).toBe('');
      expect(validateMemoryContent(undefined as any)).toBe('');
    });

    it('should return validated content', () => {
      const result = validateMemoryContent('# Test Content');
      expect(result).toBe('# Mocked Content\n\nThis is some mocked content.');
    });
  });

  describe('extractMetadataFromContent', () => {
    it('should extract tags from content', () => {
      const content =
        'This is a post about #javascript and #react. #testing is important.';
      const metadata = extractMetadataFromContent(content);

      expect(metadata.tags).toEqual(['javascript', 'react', 'testing']);
    });

    it('should extract summary from first paragraph', () => {
      const content =
        '# My Heading\n\nThis is the first paragraph that should become the summary.\n\nThis is another paragraph.';
      const metadata = extractMetadataFromContent(content);

      expect(metadata.summary).toBe('My Heading');
    });

    it('should remove duplicate tags', () => {
      const content = 'This has #duplicate and #duplicate tags.';
      const metadata = extractMetadataFromContent(content);

      expect(metadata.tags).toEqual(['duplicate']);
    });
  });
});
