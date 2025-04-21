import { useState } from 'react';
import type { MemoryBlock, MemoryBlockType } from '@/types/memory';
import { BlockContainer } from './block-container';
import { CaptionEditor } from './caption-editor';
import { BlockToolbar } from './block-toolbar';
import { DeleteBlockDialog } from './delete-block-dialog';

interface AudioBlockProps {
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

export function AudioBlock({
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
}: AudioBlockProps) {
  const [isCaptionEditing, setIsCaptionEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleEditClick = () => {
    if (!onUpdate) return;
    // Handle audio upload or edit
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
        // For existing audio, edit caption
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
        className="p-3 bg-background relative"
        onDoubleClick={handleDoubleClick}
      >
        {block.content ? (
          <div>
            <audio controls className="w-full">
              <source src={block.content} />
              Your browser does not support the audio element.
            </audio>
            <div className="text-xs text-muted-foreground mt-1">
              {block.metadata?.duration
                ? `Duration: ${Math.floor(block.metadata.duration / 60)}:${(block.metadata.duration % 60).toString().padStart(2, '0')}`
                : ''}
            </div>
          </div>
        ) : (
          <div className="w-full h-20 bg-muted/30 flex items-center justify-center rounded-md">
            <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
              <span className="text-xl mb-2">🔊</span>
              <span>{block.metadata?.alt || 'Audio placeholder'}</span>
              <span className="text-xs mt-1">Click to add audio</span>
            </div>
          </div>
        )}

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
        blockType="audio"
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* TODO: Audio upload dialog will be implemented in a future subtask */}
    </>
  );
}
