'use client';

import { exampleSetup } from 'prosemirror-example-setup';
import { inputRules } from 'prosemirror-inputrules';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React, { memo, useEffect, useRef, useState } from 'react';

import type { Suggestion } from '@/lib/db/schema';
import {
  documentSchema,
  handleTransaction,
  headingRule,
  boldRule,
  italicRule,
  codeRule,
} from '@/lib/editor/config';
import {
  buildContentFromDocument,
  buildDocumentFromContent,
  createDecorations,
} from '@/lib/editor/functions';
import {
  projectWithPositions,
  suggestionsPlugin,
  suggestionsPluginKey,
} from '@/lib/editor/suggestions';
import { FloatingMenu } from './floating-menu';
import { ImageIcon, PlusIcon } from './icons';
import { Button } from './ui/button';

// Base editor props from the original text-editor component
type EditorProps = {
  content: string;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  suggestions: Array<Suggestion>;
};

// Extended props for memory-specific functionality
interface MemoryEditorProps extends EditorProps {
  memoryId: string;
  onImageUpload: (file: File) => Promise<string>;
  onAIAssistanceRequest?: () => void;
}

function PureMemoryEditor({
  content,
  onSaveContent,
  suggestions,
  status,
  memoryId,
  onImageUpload,
  onAIAssistanceRequest,
}: MemoryEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMarkdownMode, setIsMarkdownMode] = useState<boolean>(true);
  const [showFloatingMenu, setShowFloatingMenu] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selection, setSelection] = useState<{
    range: Range | null;
    isCollapsed: boolean;
  }>({
    range: null,
    isCollapsed: true,
  });

  // Function to handle text formatting actions
  const handleFormatText = (formatType: string) => {
    if (!editorRef.current) return;

    const { state, dispatch } = editorRef.current;
    const { selection: editorSelection } = state;
    let transaction = state.tr;

    // Apply the appropriate formatting based on the format type
    switch (formatType) {
      case 'bold': {
        // Apply bold formatting using the editor's schema
        const boldMark = state.schema.marks.strong;
        if (boldMark) {
          // Toggle the mark - if it exists on the selection, remove it; otherwise add it
          if (editorSelection.empty) {
            // If no text is selected, don't do anything
            return;
          }

          // Check if the mark is active in the selection
          const hasBold = state.doc.rangeHasMark(
            editorSelection.from,
            editorSelection.to,
            boldMark,
          );

          if (hasBold) {
            // Remove the mark if it already exists
            transaction = transaction.removeMark(
              editorSelection.from,
              editorSelection.to,
              boldMark,
            );
          } else {
            // Add the mark if it doesn't exist
            transaction = transaction.addMark(
              editorSelection.from,
              editorSelection.to,
              boldMark.create(),
            );
          }

          dispatch(transaction);
        }
        break;
      }

      case 'italic': {
        // Apply italic formatting
        const italicMark = state.schema.marks.em;
        if (italicMark) {
          if (editorSelection.empty) return;

          // Check if the mark is active in the selection
          const hasItalic = state.doc.rangeHasMark(
            editorSelection.from,
            editorSelection.to,
            italicMark,
          );

          if (hasItalic) {
            transaction = transaction.removeMark(
              editorSelection.from,
              editorSelection.to,
              italicMark,
            );
          } else {
            transaction = transaction.addMark(
              editorSelection.from,
              editorSelection.to,
              italicMark.create(),
            );
          }

          dispatch(transaction);
        }
        break;
      }

      case 'h1':
      case 'h2':
      case 'h3': {
        // Apply heading formatting
        const level = Number.parseInt(formatType.charAt(1), 10);
        if (level >= 1 && level <= 3) {
          // Get the current selection's parent node
          const { $from, $to } = editorSelection;
          const nodeType = state.schema.nodes.heading;

          // Find the range of the block that contains the cursor
          const start = $from.start();
          const end = $from.end();

          if (!nodeType) return;

          const attrs = { level };
          const isActive =
            $from.parent.type === nodeType &&
            $from.parent.attrs.level === level;

          if (isActive) {
            // Convert heading to paragraph if the same heading level is selected
            transaction = transaction.setBlockType(
              start,
              end,
              state.schema.nodes.paragraph,
            );
          } else {
            // Convert to heading of the specified level
            transaction = transaction.setBlockType(start, end, nodeType, attrs);
          }

          dispatch(transaction);
        }
        break;
      }

      case 'bullet-list':
      case 'ordered-list': {
        // Apply list formatting
        const listType =
          formatType === 'bullet-list' ? 'bullet_list' : 'ordered_list';
        const listNodeType = state.schema.nodes[listType];
        const listItemNodeType = state.schema.nodes.list_item;

        if (!listNodeType || !listItemNodeType) return;

        const { $from, $to } = editorSelection;
        const range = $from.blockRange($to);

        if (!range) return;

        // Check if we're already in a list of this type
        const isInList = range.parent.type === listNodeType;

        if (isInList) {
          // Lift the list items out of the list
          const listParent = range.parent;
          const listRange = $from
            .node(range.depth)
            .maybeChild(range.startIndex);

          if (listRange) {
            const tr = state.tr;

            // Use proper lifting for nested structures
            tr.lift(range, 1);
            dispatch(tr);
          }
        } else {
          // Create a new list with the current block as a list item
          const tr = state.tr;
          const paragraphType = state.schema.nodes.paragraph;

          if (range.parent.type === paragraphType) {
            // Create the list structure with the current content
            tr.wrap(range, [
              { type: listNodeType },
              { type: listItemNodeType },
            ]);

            dispatch(tr);
          }
        }
        break;
      }

      case 'paragraph': {
        // Convert the current block to a normal paragraph
        const { $from, $to } = editorSelection;
        const range = $from.blockRange($to);

        if (!range) return;

        // Get the paragraph node type
        const paragraphType = state.schema.nodes.paragraph;

        if (!paragraphType) return;

        // If we're in a list, lift the content out first
        const bulletList = state.schema.nodes.bullet_list;
        const orderedList = state.schema.nodes.ordered_list;
        const heading = state.schema.nodes.heading;

        if (
          range.parent.type === bulletList ||
          range.parent.type === orderedList
        ) {
          // First, lift the list items out of the list
          const tr = state.tr;
          tr.lift(range, 1);
          dispatch(tr);

          // Then, in a second step, convert to paragraphs
          const newRange = $from.blockRange($to);
          if (newRange) {
            const tr2 = state.tr;
            tr2.setBlockType(newRange.start, newRange.end, paragraphType);
            dispatch(tr2);
          }
        } else if (
          range.parent.type === heading ||
          $from.parent.type === heading
        ) {
          // Convert heading to paragraph
          transaction = transaction.setBlockType(
            range.start,
            range.end,
            paragraphType,
          );
          dispatch(transaction);
        } else {
          // Convert any other block to paragraph
          transaction = transaction.setBlockType(
            range.start,
            range.end,
            paragraphType,
          );
          dispatch(transaction);
        }
        break;
      }

      case 'image': {
        // Trigger image upload dialog
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
        break;
      }

      default:
        // For any other formatting options
        console.warn(`Formatting option '${formatType}' not implemented yet`);
    }
  };

  // Handle image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !editorRef.current) return;

    const file = files[0];
    setIsUploading(true);

    try {
      // Upload the image and get the URL
      const imageUrl = await onImageUpload(file);

      // Insert the image at the current cursor position
      const { state, dispatch } = editorRef.current;
      const { schema, selection } = state;
      const imageNode = schema.nodes.image.create({
        src: imageUrl,
        alt: file.name,
      });

      const transaction = state.tr.replaceSelectionWith(imageNode);
      dispatch(transaction);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Monitor text selection to show/hide the floating menu
  useEffect(() => {
    if (!isMarkdownMode) return;

    const handleSelection = () => {
      const selection = document.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const isCollapsed = range.collapsed;

        // Only show menu when there's an actual selection
        if (!isCollapsed) {
          setSelection({ range, isCollapsed });
          setShowFloatingMenu(true);
        } else {
          setShowFloatingMenu(false);
        }
      } else {
        setShowFloatingMenu(false);
      }
    };

    // Attach event listeners for selection changes
    document.addEventListener('selectionchange', handleSelection);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [isMarkdownMode]);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      const state = EditorState.create({
        doc: buildDocumentFromContent(content),
        plugins: [
          ...exampleSetup({ schema: documentSchema, menuBar: false }),
          inputRules({
            rules: [
              // Heading rules
              headingRule(1),
              headingRule(2),
              headingRule(3),
              headingRule(4),
              headingRule(5),
              headingRule(6),
              // Text formatting rules
              boldRule,
              italicRule,
              codeRule,
            ],
          }),
          suggestionsPlugin,
        ],
      });

      editorRef.current = new EditorView(containerRef.current, {
        state,
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // NOTE: we only want to run this effect once
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setProps({
        dispatchTransaction: (transaction) => {
          handleTransaction({
            transaction,
            editorRef,
            onSaveContent,
          });
        },
      });
    }
  }, [onSaveContent]);

  useEffect(() => {
    if (editorRef.current && content) {
      const currentContent = buildContentFromDocument(
        editorRef.current.state.doc,
      );

      if (status === 'streaming') {
        const newDocument = buildDocumentFromContent(content);

        const transaction = editorRef.current.state.tr.replaceWith(
          0,
          editorRef.current.state.doc.content.size,
          newDocument.content,
        );

        transaction.setMeta('no-save', true);
        editorRef.current.dispatch(transaction);
        return;
      }

      if (currentContent !== content) {
        const newDocument = buildDocumentFromContent(content);

        const transaction = editorRef.current.state.tr.replaceWith(
          0,
          editorRef.current.state.doc.content.size,
          newDocument.content,
        );

        transaction.setMeta('no-save', true);
        editorRef.current.dispatch(transaction);
      }
    }
  }, [content, status]);

  useEffect(() => {
    if (editorRef.current?.state.doc && content) {
      const projectedSuggestions = projectWithPositions(
        editorRef.current.state.doc,
        suggestions,
      ).filter(
        (suggestion) => suggestion.selectionStart && suggestion.selectionEnd,
      );

      const decorations = createDecorations(
        projectedSuggestions,
        editorRef.current,
      );

      const transaction = editorRef.current.state.tr;
      transaction.setMeta(suggestionsPluginKey, { decorations });
      editorRef.current.dispatch(transaction);
    }
  }, [suggestions, content]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center justify-between px-2 py-1 border-b">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormatText('image')}
            disabled={isUploading}
          >
            {isUploading ? (
              'Uploading...'
            ) : (
              <>
                <ImageIcon size={16} />
                <span className="ml-1">Add Image</span>
              </>
            )}
          </Button>
          {onAIAssistanceRequest && (
            <Button variant="ghost" size="sm" onClick={onAIAssistanceRequest}>
              <PlusIcon size={16} />
              <span className="ml-1">AI Assistance</span>
            </Button>
          )}
        </div>
      </div>

      <div
        className="relative prose dark:prose-invert flex-1 markdown-editor overflow-auto"
        ref={containerRef}
      >
        {isMarkdownMode && (
          <FloatingMenu
            isVisible={showFloatingMenu}
            selection={selection}
            onFormatText={handleFormatText}
          />
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
      />
    </div>
  );
}

function areEqual(prevProps: MemoryEditorProps, nextProps: MemoryEditorProps) {
  return (
    prevProps.suggestions === nextProps.suggestions &&
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.onSaveContent === nextProps.onSaveContent &&
    prevProps.memoryId === nextProps.memoryId
  );
}

export const MemoryEditor = memo(PureMemoryEditor, areEqual);
