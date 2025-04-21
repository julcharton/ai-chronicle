import { useState } from 'react';
import type { MemoryBlock, MemoryBlockType } from '@/types/memory';
import { BlockContainer } from './block-container';
import { CaptionEditor } from './caption-editor';
import { BlockToolbar } from './block-toolbar';
import { DeleteBlockDialog } from './delete-block-dialog';

interface ImageBlockProps {
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

export function ImageBlock({
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
}: ImageBlockProps) {
  const [isCaptionEditing, setIsCaptionEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleEditClick = () => {
    if (!onUpdate) return;
    // Handle image upload or edit
    setIsUploadDialogOpen(true);
  };

  const handleEditCaptionClick = (e: React.MouseEvent) => {
    if (!onUpdate) return;
    e.stopPropagation();
    setIsCaptionEditing(true);
  };

  const handleDoubleClick = () => {
    if (onUpdate) {
      if (!block.content) {
        setIsUploadDialogOpen(true);
      } else {
        // For existing images, edit caption
        setIsCaptionEditing(true);
      }
    }
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
        onDoubleClick={handleDoubleClick}
      >
        <div className="w-full aspect-video bg-muted/30 flex items-center justify-center rounded-md overflow-hidden">
          {block.content ? (
            <img
              src={block.content}
              alt={block.metadata?.alt || 'Memory image'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <span className="text-3xl mb-2">📷</span>
              <span>{block.metadata?.alt || 'Image placeholder'}</span>
              <span className="text-xs mt-2">Click to add an image</span>
            </div>
          )}
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

        {/* Caption section */}
        {isCaptionEditing ? (
          <CaptionEditor
            initialCaption={block.metadata?.caption}
            onSave={handleSaveCaption}
            onCancel={() => setIsCaptionEditing(false)}
          />
        ) : (
          block.metadata?.caption && (
            <div
              className="mt-2 text-sm text-muted-foreground px-3 cursor-pointer"
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
        blockType="image"
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* TODO: Image upload dialog will be implemented in a future subtask */}
    </>
  );
}
