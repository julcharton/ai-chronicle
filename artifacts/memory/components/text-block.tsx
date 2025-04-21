import { useState } from 'react';
import type { MemoryBlock, MemoryBlockType } from '@/types/memory';
import { Markdown } from '@/components/markdown';
import { BlockContainer } from './block-container';
import { TextBlockEditor } from './text-block-editor';
import { CaptionEditor } from './caption-editor';
import { BlockToolbar } from './block-toolbar';
import { DeleteBlockDialog } from './delete-block-dialog';

interface TextBlockProps {
  block: MemoryBlock;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate?: (
    id: string,
    content: string,
    metadata?: Record<string, any>,
  ) => void;
  onDelete?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onTypeChange?: (id: string, type: MemoryBlockType) => void;
  isFirstBlock?: boolean;
  isLastBlock?: boolean;
}

export function TextBlock({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onTypeChange,
  isFirstBlock = false,
  isLastBlock = false,
}: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCaptionEditing, setIsCaptionEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEditClick = () => {
    if (!onUpdate) return;
    setIsEditing(true);
  };

  const handleEditCaptionClick = (e: React.MouseEvent) => {
    if (!onUpdate) return;
    e.stopPropagation();
    setIsCaptionEditing(true);
  };

  const handleSaveContent = (content: string) => {
    if (onUpdate) {
      onUpdate(block.id, content);
    }
    setIsEditing(false);
  };

  const handleSaveCaption = (caption: string) => {
    if (onUpdate) {
      onUpdate(block.id, block.content, {
        ...block.metadata,
        caption,
      });
    }
    setIsCaptionEditing(false);
  };

  const handleDoubleClick = () => {
    if (onUpdate) {
      setIsEditing(true);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(block.id);
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <BlockContainer
        block={block}
        isSelected={isSelected}
        onSelect={onSelect}
        className="p-3 bg-background relative group"
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <TextBlockEditor
            initialContent={block.content}
            onSave={handleSaveContent}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <Markdown>{block.content}</Markdown>
            </div>

            {isSelected && onUpdate && (
              <BlockToolbar
                block={block}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onMoveUp={() => onMoveUp?.(block.id)}
                onMoveDown={() => onMoveDown?.(block.id)}
                onTypeChange={(type) => onTypeChange?.(block.id, type)}
                isFirstBlock={isFirstBlock}
                isLastBlock={isLastBlock}
              />
            )}
          </>
        )}

        {/* Caption section */}
        {!isEditing && isCaptionEditing ? (
          <CaptionEditor
            initialCaption={block.metadata?.caption}
            onSave={handleSaveCaption}
            onCancel={() => setIsCaptionEditing(false)}
          />
        ) : (
          block.metadata?.caption &&
          !isEditing && (
            <div
              className="mt-2 text-sm text-muted-foreground cursor-pointer"
              onClick={
                isSelected && onUpdate ? handleEditCaptionClick : undefined
              }
            >
              {block.metadata.caption}
            </div>
          )
        )}
      </BlockContainer>

      <DeleteBlockDialog
        isOpen={isDeleteDialogOpen}
        blockType="text"
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
