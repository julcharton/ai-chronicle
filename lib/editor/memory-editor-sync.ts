import {
  buildContentFromDocument,
  buildDocumentFromContent,
} from './functions';
import debounce from 'lodash/debounce';
import type { MemoryMetadata } from '@/lib/types';
import type { Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

/**
 * Options for memory editor state management
 */
export interface MemoryEditorStateOptions {
  /**
   * Memory ID to identify which memory is being edited
   */
  memoryId: string;

  /**
   * Callback for auto-saving content changes
   */
  onContentChange: (
    memoryId: string,
    content: string,
    debounced: boolean,
  ) => Promise<void>;

  /**
   * Delay in milliseconds for debounced updates
   */
  debounceDelay?: number;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Memory editor state management with automatic content synchronization
 */
export class MemoryEditorState {
  private memoryId: string;
  private onContentChange: (
    memoryId: string,
    content: string,
    debounced: boolean,
  ) => Promise<void>;
  private debug: boolean;
  private debouncedUpdate: ReturnType<typeof debounce>;
  private lastContent = '';
  private pendingUpdate = false;

  constructor({
    memoryId,
    onContentChange,
    debounceDelay = 1000,
    debug = false,
  }: MemoryEditorStateOptions) {
    this.memoryId = memoryId;
    this.onContentChange = onContentChange;
    this.debug = debug;

    // Create a debounced version of the update function
    this.debouncedUpdate = debounce(
      this.updateContent.bind(this),
      debounceDelay,
    );
  }

  /**
   * Handle ProseMirror transaction and trigger content updates
   */
  handleTransaction = ({
    transaction,
    editorView,
  }: {
    transaction: Transaction;
    editorView: EditorView;
  }): void => {
    // Skip if the transaction is marked to be ignored for saving
    if (transaction.getMeta('no-save')) {
      this.debugLog('Skipping save due to no-save meta');
      return;
    }

    // Update the editor state with the transaction
    const newState = editorView.state.apply(transaction);
    editorView.updateState(newState);

    // If the document changed, update the content
    if (transaction.docChanged) {
      const content = buildContentFromDocument(newState.doc);

      // Prevent duplicate updates with the same content
      if (this.lastContent === content) {
        this.debugLog('Skipping update - content unchanged');
        return;
      }

      this.lastContent = content;

      // Check if this should be a debounced update
      const shouldDebounce = !transaction.getMeta('no-debounce');

      if (shouldDebounce) {
        this.debugLog('Scheduling debounced update');
        this.pendingUpdate = true;
        this.debouncedUpdate(content);
      } else {
        this.debugLog('Immediate update');
        this.updateContent(content);
      }
    }
  };

  /**
   * Update content on the server
   */
  private async updateContent(content: string): Promise<void> {
    this.pendingUpdate = false;
    this.debugLog('Saving content', `${content.substring(0, 50)}...`);

    try {
      await this.onContentChange(this.memoryId, content, true);
      this.debugLog('Content saved successfully');
    } catch (error) {
      console.error('Failed to update memory content:', error);
    }
  }

  /**
   * Log debug messages if debug is enabled
   */
  private debugLog(...args: any[]): void {
    if (this.debug) {
      console.log(`[MemoryEditor:${this.memoryId.substring(0, 8)}]`, ...args);
    }
  }

  /**
   * Force an immediate update, canceling any pending debounced updates
   * Returns true if an update was triggered, false otherwise
   */
  public flushUpdates(): boolean {
    if (this.pendingUpdate) {
      this.debouncedUpdate.flush();
      return true;
    }
    return false;
  }

  /**
   * Cancel any pending updates
   */
  public cancelUpdates(): void {
    this.debouncedUpdate.cancel();
    this.pendingUpdate = false;
  }
}

/**
 * React hook for handling memory editor state
 * Use this in a client component that contains the memory editor
 */
export function createMemoryEditorHandler(options: MemoryEditorStateOptions) {
  const stateManager = new MemoryEditorState(options);

  return {
    /**
     * Handle ProseMirror transactions
     */
    handleTransaction: ({
      transaction,
      editorView,
    }: { transaction: Transaction; editorView: EditorView }) => {
      stateManager.handleTransaction({ transaction, editorView });
    },

    /**
     * Force an immediate update
     */
    flushUpdates: () => stateManager.flushUpdates(),

    /**
     * Cancel pending updates
     */
    cancelUpdates: () => stateManager.cancelUpdates(),
  };
}

/**
 * Synchronize ProseMirror document with memory content
 * Updates the editor state with new content without triggering save callbacks
 */
export function syncEditorWithMemory(
  editorView: EditorView,
  content: string,
): void {
  if (!editorView) return;

  const newDocument = buildDocumentFromContent(content);

  const transaction = editorView.state.tr.replaceWith(
    0,
    editorView.state.doc.content.size,
    newDocument.content,
  );

  // Mark as no-save to prevent infinite loops
  transaction.setMeta('no-save', true);
  editorView.dispatch(transaction);
}

/**
 * Validate memory content to ensure it's properly formatted
 * Returns sanitized content that's safe to use
 */
export function validateMemoryContent(content: string): string {
  if (!content) return '';

  try {
    // Try to parse and re-serialize to ensure valid markdown
    const doc = buildDocumentFromContent(content);
    return buildContentFromDocument(doc);
  } catch (error) {
    console.error('Invalid memory content:', error);
    return content; // Return original content in case of parsing errors
  }
}

/**
 * Extract metadata from memory content like tags and summary
 */
export function extractMetadataFromContent(
  content: string,
): Partial<MemoryMetadata> {
  const metadata: Partial<MemoryMetadata> = {};

  // Extract tags from content using #tag format
  const tagRegex = /#([a-zA-Z0-9_-]+)/g;
  const tagMatches = content.match(tagRegex);

  if (tagMatches) {
    metadata.tags = tagMatches
      .map((tag) => tag.substring(1))
      .filter(
        (tag, index, self) =>
          // Remove duplicates
          self.indexOf(tag) === index,
      );
  }

  // Try to extract a summary from the first paragraph
  const paragraphs = content.split('\n\n');
  if (paragraphs.length > 0) {
    const firstParagraph = paragraphs[0]
      .replace(/^#+ /, '') // Remove heading markers
      .trim();

    if (firstParagraph.length > 0 && firstParagraph.length <= 150) {
      metadata.summary = firstParagraph;
    }
  }

  return metadata;
}
