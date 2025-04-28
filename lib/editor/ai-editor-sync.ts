import { debounce } from 'lodash';
import {
  buildContentFromDocument,
  buildDocumentFromContent,
} from './functions';
import type { EditorView } from 'prosemirror-view';
import type { Suggestion } from '@/lib/db/schema';
import { projectWithPositions } from './suggestions';
import * as diff from 'diff';

/**
 * Options for AI-Editor synchronization
 */
export interface AIEditorSyncOptions {
  /**
   * Memory ID to identify which memory is being edited
   */
  memoryId: string;

  /**
   * Chat ID for associated chat
   */
  chatId: string;

  /**
   * Time in milliseconds to wait before sending editor updates to AI
   */
  throttleDelay?: number;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Callback to update AI context with new editor content
   */
  onEditorContentChange?: (
    memoryId: string,
    content: string,
    changes: ContentChange[],
  ) => Promise<void>;

  /**
   * Callback to insert AI suggestion into the editor
   */
  onAISuggestionReceived?: (suggestion: AISuggestion) => Promise<void>;

  /**
   * Callback when conflicts are detected
   */
  onConflictDetected?: (
    editorContent: string,
    aiSuggestion: AISuggestion,
  ) => Promise<boolean>;
}

/**
 * Represents a change in the editor content
 */
export interface ContentChange {
  type: 'addition' | 'deletion' | 'modification';
  position: number;
  content: string;
  length: number;
  timestamp?: number;
}

/**
 * Represents an AI suggestion to be inserted into the editor
 */
export interface AISuggestion {
  id: string;
  content: string;
  position?: number;
  originalText?: string;
  description?: string;
  timestamp?: number;
}

/**
 * History entry for undo/redo functionality
 */
interface HistoryEntry {
  type: 'suggestion' | 'userEdit';
  content: string;
  changes?: ContentChange[];
  suggestion?: AISuggestion;
  timestamp: number;
}

/**
 * Manages bidirectional synchronization between AI and editor
 */
export class AIEditorSync {
  private memoryId: string;
  private chatId: string;
  private debug: boolean;
  private lastContent = '';
  private editorView: EditorView | null = null;
  private throttledUpdateAI: ReturnType<typeof debounce>;
  private onEditorContentChange?: (
    memoryId: string,
    content: string,
    changes: ContentChange[],
  ) => Promise<void>;
  private onAISuggestionReceived?: (suggestion: AISuggestion) => Promise<void>;
  private onConflictDetected?: (
    editorContent: string,
    aiSuggestion: AISuggestion,
  ) => Promise<boolean>;
  private contentUpdateInProgress = false;
  private history: HistoryEntry[] = [];
  private historyPosition = -1;
  private maxHistorySize = 50;
  private pendingChanges: ContentChange[] = [];
  private lastUpdateTimestamp = 0;

  constructor({
    memoryId,
    chatId,
    throttleDelay = 500,
    debug = false,
    onEditorContentChange,
    onAISuggestionReceived,
    onConflictDetected,
  }: AIEditorSyncOptions) {
    this.memoryId = memoryId;
    this.chatId = chatId;
    this.debug = debug;
    this.onEditorContentChange = onEditorContentChange;
    this.onAISuggestionReceived = onAISuggestionReceived;
    this.onConflictDetected = onConflictDetected;

    // Create a throttled version of updateAI
    this.throttledUpdateAI = debounce(
      this.updateAIWithChanges.bind(this),
      throttleDelay,
    );
  }

  /**
   * Set the editor view reference
   */
  public setEditorView(view: EditorView): void {
    this.editorView = view;
    if (view.state.doc) {
      this.lastContent = buildContentFromDocument(view.state.doc);

      // Initialize history with current content
      this.addToHistory({
        type: 'userEdit',
        content: this.lastContent,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Handle content changes from the editor and notify AI
   */
  public handleEditorUpdate(newContent: string): void {
    if (!this.lastContent || this.lastContent === newContent) {
      this.lastContent = newContent;
      return;
    }

    // Don't process if we're currently applying changes from the AI
    if (this.contentUpdateInProgress) {
      this.debugLog(
        'Skipping editor update handling due to AI update in progress',
      );
      return;
    }

    // Calculate differences between old and new content
    const changes = this.calculateContentChanges(this.lastContent, newContent);

    // Add timestamp to changes
    const timestamp = Date.now();
    const changesWithTimestamp = changes.map((change) => ({
      ...change,
      timestamp,
    }));

    if (changes.length > 0) {
      this.debugLog('Editor content changed', changes);

      // Add to history
      this.addToHistory({
        type: 'userEdit',
        content: newContent,
        changes: changesWithTimestamp,
        timestamp,
      });

      // Update pending changes
      this.pendingChanges = [...this.pendingChanges, ...changesWithTimestamp];

      // Send to AI (throttled)
      this.throttledUpdateAI();
    }

    this.lastContent = newContent;
  }

  /**
   * Calculate content changes between old and new content
   */
  private calculateContentChanges(
    oldContent: string,
    newContent: string,
  ): ContentChange[] {
    const changes: ContentChange[] = [];
    const diffResult = diff.diffChars(oldContent, newContent);

    let position = 0;

    for (const part of diffResult) {
      if (part.added) {
        changes.push({
          type: 'addition',
          position,
          content: part.value,
          length: part.value.length,
        });
      } else if (part.removed) {
        changes.push({
          type: 'deletion',
          position,
          content: part.value,
          length: part.value.length,
        });
        // For removed parts, don't advance position in the new content
        continue;
      }

      // Only advance position for unchanged or added parts
      position += part.value.length;
    }

    return changes;
  }

  /**
   * Update AI with content changes from the editor
   */
  private async updateAIWithChanges(): Promise<void> {
    try {
      // Check if we have changes to send
      if (this.pendingChanges.length === 0) {
        this.debugLog('No pending changes to send to AI');
        return;
      }

      this.lastUpdateTimestamp = Date.now();

      if (this.onEditorContentChange) {
        const changesToSend = [...this.pendingChanges]; // Create a copy
        this.pendingChanges = []; // Clear pending changes

        await this.onEditorContentChange(
          this.memoryId,
          this.lastContent,
          changesToSend,
        );
        this.debugLog('Sent changes to AI', changesToSend);
      }
    } catch (error) {
      console.error('Failed to update AI with content changes:', error);
      // Re-add the changes to pending changes for retry
      // This would need a more sophisticated retry mechanism in production
    }
  }

  /**
   * Apply an AI suggestion to the editor
   */
  public async applySuggestion(suggestion: AISuggestion): Promise<boolean> {
    if (!this.editorView) {
      console.error('Editor view not available');
      return false;
    }

    try {
      // Check for conflicts if the content has changed since last AI update
      if (Date.now() - this.lastUpdateTimestamp > 2000) {
        // Over 2 seconds since last update
        // Get current content
        const currentContent = buildContentFromDocument(
          this.editorView.state.doc,
        );

        // If we have a conflict detection callback and content is significantly different,
        // ask the caller for conflict resolution
        if (this.onConflictDetected && this.lastContent !== currentContent) {
          const shouldApply = await this.onConflictDetected(
            currentContent,
            suggestion,
          );
          if (!shouldApply) {
            this.debugLog('Suggestion application cancelled due to conflict');
            return false;
          }
        }
      }

      // Mark that we're applying an AI update
      this.contentUpdateInProgress = true;

      // Add timestamp to suggestion
      suggestion.timestamp = Date.now();

      const { state, dispatch } = this.editorView;
      let transaction = state.tr;

      if (suggestion.position !== undefined) {
        // If position is specified, insert at that position
        transaction = transaction.insertText(
          suggestion.content,
          suggestion.position,
        );
      } else if (suggestion.originalText) {
        // Otherwise, try to find the original text and replace it
        const positions = this.findTextInDocument(
          state.doc,
          suggestion.originalText,
        );

        if (positions) {
          transaction = transaction.replaceWith(
            positions.start,
            positions.end,
            state.schema.text(suggestion.content),
          );
        } else {
          // If original text not found, append to end
          transaction = transaction.insertText(
            suggestion.content,
            state.doc.content.size,
          );
        }
      } else {
        // If neither position nor original text specified, append to end
        transaction = transaction.insertText(
          suggestion.content,
          state.doc.content.size,
        );
      }

      // Apply the transaction
      transaction.setMeta('no-debounce', true);
      dispatch(transaction);

      // Update last content to avoid triggering change detection
      this.lastContent = buildContentFromDocument(this.editorView.state.doc);

      // Add to history
      this.addToHistory({
        type: 'suggestion',
        content: this.lastContent,
        suggestion,
        timestamp: suggestion.timestamp || Date.now(),
      });

      this.contentUpdateInProgress = false;
      return true;
    } catch (error) {
      console.error('Failed to apply AI suggestion:', error);
      this.contentUpdateInProgress = false;
      return false;
    }
  }

  /**
   * Add AI suggestion as a UI suggestion
   */
  public addSuggestionUI(
    suggestion: AISuggestion,
    suggestions: Suggestion[],
  ): Suggestion[] {
    if (!this.editorView) {
      console.error('Editor view not available');
      return suggestions;
    }

    // Create a new suggestion object
    const newSuggestion: Suggestion = {
      id: suggestion.id,
      documentId: this.memoryId,
      originalText: suggestion.originalText || '',
      suggestedText: suggestion.content,
      description: suggestion.description || 'AI suggestion',
      isResolved: false,
      userId: '', // This would be set properly in a real implementation
      createdAt: new Date(),
    };

    // Add the new suggestion
    return [...suggestions, newSuggestion];
  }

  /**
   * Find text in the document and return its position
   */
  private findTextInDocument(
    doc: any,
    text: string,
  ): { start: number; end: number } | null {
    let result: { start: number; end: number } | null = null;

    doc.nodesBetween(0, doc.content.size, (node: any, pos: number) => {
      if (node.isText && node.text) {
        const index = node.text.indexOf(text);
        if (index >= 0) {
          result = {
            start: pos + index,
            end: pos + index + text.length,
          };
          return false; // Stop the iteration
        }
      }
      return true; // Continue the iteration
    });

    return result;
  }

  /**
   * Receive AI suggestion and apply or show it
   */
  public async receiveAISuggestion(suggestion: AISuggestion): Promise<void> {
    this.debugLog('Received AI suggestion', suggestion);

    try {
      if (this.onAISuggestionReceived) {
        await this.onAISuggestionReceived(suggestion);
      } else {
        // Default behavior is to apply the suggestion directly
        await this.applySuggestion(suggestion);
      }
    } catch (error) {
      console.error('Failed to process AI suggestion:', error);
    }
  }

  /**
   * Undo the last change (either user edit or suggestion)
   */
  public undo(): boolean {
    if (!this.canUndo() || !this.editorView) {
      return false;
    }

    // Move history position back
    this.historyPosition--;

    // Get the history entry to restore
    const historyEntry = this.history[this.historyPosition];

    if (historyEntry) {
      this.contentUpdateInProgress = true;

      // Update the editor with the content from this history entry
      const doc = buildDocumentFromContent(
        historyEntry.content,
        this.editorView.state.schema,
      );

      if (doc) {
        const tr = this.editorView.state.tr.replaceWith(
          0,
          this.editorView.state.doc.content.size,
          doc,
        );
        this.editorView.dispatch(tr);

        // Update internal state
        this.lastContent = historyEntry.content;
      }

      this.contentUpdateInProgress = false;
      return true;
    }

    return false;
  }

  /**
   * Redo the last undone change
   */
  public redo(): boolean {
    if (!this.canRedo() || !this.editorView) {
      return false;
    }

    // Move history position forward
    this.historyPosition++;

    // Get the history entry to restore
    const historyEntry = this.history[this.historyPosition];

    if (historyEntry) {
      this.contentUpdateInProgress = true;

      // Update the editor with the content from this history entry
      const doc = buildDocumentFromContent(
        historyEntry.content,
        this.editorView.state.schema,
      );

      if (doc) {
        const tr = this.editorView.state.tr.replaceWith(
          0,
          this.editorView.state.doc.content.size,
          doc,
        );
        this.editorView.dispatch(tr);

        // Update internal state
        this.lastContent = historyEntry.content;
      }

      this.contentUpdateInProgress = false;
      return true;
    }

    return false;
  }

  /**
   * Check if undo is available
   */
  public canUndo(): boolean {
    return this.historyPosition > 0;
  }

  /**
   * Check if redo is available
   */
  public canRedo(): boolean {
    return this.historyPosition < this.history.length - 1;
  }

  /**
   * Add an entry to the history stack
   */
  private addToHistory(entry: HistoryEntry): void {
    // If we're not at the end of the history stack (due to undo operations),
    // remove all entries after the current position
    if (this.historyPosition < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyPosition + 1);
    }

    // Add the new entry
    this.history.push(entry);
    this.historyPosition = this.history.length - 1;

    // Trim history if it exceeds maximum size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(
        this.history.length - this.maxHistorySize,
      );
      this.historyPosition = this.history.length - 1;
    }
  }

  /**
   * Force flush any pending changes to AI
   */
  public async flushChanges(): Promise<void> {
    if (this.pendingChanges.length > 0 && this.editorView) {
      const currentContent = buildContentFromDocument(
        this.editorView.state.doc,
      );
      this.throttledUpdateAI.cancel(); // Cancel any pending throttled update
      await this.updateAIWithChanges();
    }
  }

  /**
   * Log debug messages if debug is enabled
   */
  private debugLog(...args: any[]): void {
    if (this.debug) {
      console.log(`[AIEditorSync:${this.memoryId.substring(0, 8)}]`, ...args);
    }
  }
}

/**
 * Create a content diff between two versions of memory content
 */
export function createContentDiff(
  oldContent: string,
  newContent: string,
): ContentChange[] {
  const changes: ContentChange[] = [];
  const diffResult = diff.diffChars(oldContent, newContent);

  let position = 0;

  for (const part of diffResult) {
    if (part.added) {
      changes.push({
        type: 'addition',
        position,
        content: part.value,
        length: part.value.length,
      });
    } else if (part.removed) {
      changes.push({
        type: 'deletion',
        position,
        content: part.value,
        length: part.value.length,
      });
      // For removed parts, don't advance position in the new content
      continue;
    }

    // Only advance position for unchanged or added parts
    position += part.value.length;
  }

  return changes;
}

/**
 * Find the best position to insert new AI content
 * based on user's cursor position or end of document
 */
export function findInsertPosition(editorView: EditorView | null): number {
  if (!editorView) return 0;

  const { selection } = editorView.state;

  // If there's a text selection, return the end of selection
  if (!selection.empty) {
    return selection.to;
  }

  // Otherwise return the cursor position
  return selection.from;
}
