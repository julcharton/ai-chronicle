import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryEditor } from '@/components/memory-editor';
import '@testing-library/jest-dom';

// Mock the necessary dependencies
jest.mock('@/lib/editor/functions', () => ({
  buildDocumentFromContent: jest.fn(() => ({ content: { size: 0 } })),
  buildContentFromDocument: jest.fn(() => 'mocked content'),
  createDecorations: jest.fn(() => []),
}));

jest.mock('@/lib/editor/suggestions', () => ({
  projectWithPositions: jest.fn(() => []),
  suggestionsPlugin: {},
  suggestionsPluginKey: 'mocked-key',
}));

jest.mock('prosemirror-example-setup', () => ({
  exampleSetup: jest.fn(() => []),
}));

jest.mock('prosemirror-view', () => {
  return {
    EditorView: jest.fn().mockImplementation(() => ({
      state: {
        doc: { content: { size: 0 } },
        tr: {
          replaceWith: jest.fn().returnThis(),
          setMeta: jest.fn().returnThis(),
        },
      },
      dispatch: jest.fn(),
      destroy: jest.fn(),
      setProps: jest.fn(),
    })),
    Decoration: {
      inline: jest.fn(),
      widget: jest.fn(),
    },
    DecorationSet: {
      create: jest.fn(),
    },
  };
});

jest.mock('prosemirror-state', () => ({
  EditorState: {
    create: jest.fn(() => ({
      doc: { content: { size: 0 } },
      tr: {
        replaceWith: jest.fn().returnThis(),
        setMeta: jest.fn().returnThis(),
      },
    })),
  },
}));

describe('MemoryEditor Component', () => {
  const mockProps = {
    content: '# Test Memory\n\nThis is a test memory document.',
    onSaveContent: jest.fn(),
    status: 'idle' as const,
    isCurrentVersion: true,
    currentVersionIndex: 0,
    suggestions: [],
    memoryId: 'test-memory-123',
    onImageUpload: jest
      .fn()
      .mockResolvedValue('https://example.com/test-image.jpg'),
    onAIAssistanceRequest: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the memory editor component', () => {
    render(<MemoryEditor {...mockProps} />);

    // Check for basic UI elements
    expect(screen.getByText('Add Image')).toBeInTheDocument();
    expect(screen.getByText('AI Assistance')).toBeInTheDocument();
  });

  it('handles image upload button click', () => {
    render(<MemoryEditor {...mockProps} />);

    // Mock the file input ref
    const mockClick = jest.fn();
    HTMLInputElement.prototype.click = mockClick;

    // Click the image upload button
    fireEvent.click(screen.getByText('Add Image'));

    // Verify the file input was clicked
    expect(mockClick).toHaveBeenCalled();
  });

  it('calls onAIAssistanceRequest when AI Assistance button is clicked', () => {
    render(<MemoryEditor {...mockProps} />);

    // Click the AI Assistance button
    fireEvent.click(screen.getByText('AI Assistance'));

    // Verify the callback was called
    expect(mockProps.onAIAssistanceRequest).toHaveBeenCalled();
  });
});
