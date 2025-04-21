'use client';

import { useRef, useEffect } from 'react';
import { Artifact } from '@/components/create-artifact';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { deserializeMemory, serializeMemory } from '@/types/memory';
import type { Memory, MemoryBlock, MemoryBlockType } from '@/types/memory';

// Import block components
import { TextBlock } from './components/text-block';
import { ImageBlock } from './components/image-block';
import { AudioBlock } from './components/audio-block';
import { EmptyState } from './components/empty-state';
import { StreamingIndicator } from './components/streaming-indicator';

// Import block conversion utils
import { convertBlockType } from './utils/block-conversion';

// Define metadata interface for memory artifact
interface MemoryArtifactMetadata {
  selectedBlockId?: string;
}

export const memoryArtifact = new Artifact<'memory', MemoryArtifactMetadata>({
  kind: 'memory',
  description: 'Create immersive memories combining text, images, and audio.',

  initialize: async ({ documentId, setMetadata }) => {
    // Initialize could fetch any additional data needed for the memory
    setMetadata({
      selectedBlockId: undefined,
    });
  },

  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'memory-block') {
      // Handle new memory block
      try {
        const newBlock: MemoryBlock = JSON.parse(streamPart.content as string);

        setArtifact((draftArtifact) => {
          // Parse existing content or initialize empty memory
          let memory: Memory;
          try {
            memory = draftArtifact.content
              ? deserializeMemory(draftArtifact.content)
              : {
                  blocks: [],
                  title: draftArtifact.title,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
          } catch {
            memory = {
              blocks: [],
              title: draftArtifact.title,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }

          // Add the new block
          memory.blocks.push(newBlock);

          // Set the block as selected if it's the first one
          if (memory.blocks.length === 1) {
            setMetadata({ selectedBlockId: newBlock.id });
          }

          return {
            ...draftArtifact,
            content: serializeMemory(memory),
            isVisible: true,
            status: 'streaming',
          };
        });
      } catch (error) {
        console.error('Error adding memory block:', error);
      }
    }

    if (streamPart.type === 'memory-block-update') {
      // Handle updates to existing blocks with improved error handling
      try {
        const update = JSON.parse(streamPart.content as string);

        setArtifact((draftArtifact) => {
          try {
            const memory: Memory = deserializeMemory(draftArtifact.content);
            const blockIndex = memory.blocks.findIndex(
              (block) => block.id === update.id,
            );

            if (blockIndex !== -1) {
              // Track if this is a substantial update
              const isSubstantialUpdate =
                update.content && update.content.length > 20;

              // Append content for text, replace for other types
              if (memory.blocks[blockIndex].type === 'text') {
                memory.blocks[blockIndex].content += update.content || '';
              } else if (update.content) {
                memory.blocks[blockIndex].content = update.content;
              }

              // Update metadata if provided
              if (update.metadata) {
                memory.blocks[blockIndex].metadata = {
                  ...memory.blocks[blockIndex].metadata,
                  ...update.metadata,
                };
              }

              memory.blocks[blockIndex].updatedAt = new Date();

              // Auto-select the block if it's a substantial update
              if (isSubstantialUpdate) {
                setMetadata({ selectedBlockId: update.id });
              }
            }

            return {
              ...draftArtifact,
              content: serializeMemory(memory),
              isVisible: true,
              status: 'streaming',
            };
          } catch (error) {
            console.error('Error updating memory block:', error);
            return draftArtifact;
          }
        });
      } catch (error) {
        console.error('Error parsing memory block update:', error);
      }
    }

    if (streamPart.type === 'finish') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        status: 'idle',
      }));
    }
  },

  content: ({
    content,
    status,
    isLoading,
    metadata,
    setMetadata,
    onSaveContent,
  }) => {
    if (isLoading) {
      return <DocumentSkeleton artifactKind="memory" />;
    }

    let memory: Memory;
    try {
      memory = content
        ? deserializeMemory(content)
        : {
            blocks: [],
            title: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
    } catch {
      memory = {
        blocks: [],
        title: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const handleBlockSelect = (blockId: string) => {
      setMetadata({ ...metadata, selectedBlockId: blockId });
    };

    // Handle block updates (content and metadata)
    const handleBlockUpdate = (
      blockId: string,
      newContent: string,
      newMetadata?: Record<string, any>,
    ) => {
      // Find and update the memory block
      const memoryObject = deserializeMemory(content);
      const blockIndex = memoryObject.blocks.findIndex(
        (block) => block.id === blockId,
      );

      if (blockIndex !== -1) {
        // Update content if provided
        if (newContent !== undefined) {
          memoryObject.blocks[blockIndex].content = newContent;
        }

        // Update metadata if provided
        if (newMetadata !== undefined) {
          memoryObject.blocks[blockIndex].metadata = {
            ...memoryObject.blocks[blockIndex].metadata,
            ...newMetadata,
          };
        }

        memoryObject.blocks[blockIndex].updatedAt = new Date();

        // Save the updated content
        onSaveContent(serializeMemory(memoryObject), true);
      }
    };

    // Handle block deletion
    const handleDeleteBlock = (blockId: string) => {
      const memoryObject = deserializeMemory(content);

      // Filter out the block to be deleted
      memoryObject.blocks = memoryObject.blocks.filter(
        (block) => block.id !== blockId,
      );

      // If the deleted block was selected, clear selection
      if (metadata?.selectedBlockId === blockId) {
        setMetadata({ selectedBlockId: undefined });
      }

      // Save the updated content
      onSaveContent(serializeMemory(memoryObject), true);
    };

    // Handle block type conversion
    const handleBlockTypeChange = (
      blockId: string,
      newType: MemoryBlockType,
    ) => {
      const memoryObject = deserializeMemory(content);
      const blockIndex = memoryObject.blocks.findIndex(
        (block) => block.id === blockId,
      );

      if (blockIndex !== -1) {
        const originalBlock = memoryObject.blocks[blockIndex];
        const convertedBlock = convertBlockType(originalBlock, newType);
        memoryObject.blocks[blockIndex] = convertedBlock;

        // Save the updated content
        onSaveContent(serializeMemory(memoryObject), true);
      }
    };

    // Handle moving a block up in the order
    const handleMoveBlockUp = (blockId: string) => {
      const memoryObject = deserializeMemory(content);
      const blockIndex = memoryObject.blocks.findIndex(
        (block) => block.id === blockId,
      );

      if (blockIndex > 0) {
        // Swap with previous block
        const temp = memoryObject.blocks[blockIndex];
        memoryObject.blocks[blockIndex] = memoryObject.blocks[blockIndex - 1];
        memoryObject.blocks[blockIndex - 1] = temp;

        // Save the updated content
        onSaveContent(serializeMemory(memoryObject), true);
      }
    };

    // Handle moving a block down in the order
    const handleMoveBlockDown = (blockId: string) => {
      const memoryObject = deserializeMemory(content);
      const blockIndex = memoryObject.blocks.findIndex(
        (block) => block.id === blockId,
      );

      if (blockIndex < memoryObject.blocks.length - 1) {
        // Swap with next block
        const temp = memoryObject.blocks[blockIndex];
        memoryObject.blocks[blockIndex] = memoryObject.blocks[blockIndex + 1];
        memoryObject.blocks[blockIndex + 1] = temp;

        // Save the updated content
        onSaveContent(serializeMemory(memoryObject), true);
      }
    };

    // Set up keyboard handling for the memory container
    const memoryContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Only process if memory container is focused
        if (!document.activeElement?.contains(memoryContainerRef.current)) {
          return;
        }

        if (!metadata?.selectedBlockId || memory.blocks.length === 0) {
          return;
        }

        const currentIndex = memory.blocks.findIndex(
          (block) => block.id === metadata.selectedBlockId,
        );
        if (currentIndex === -1) return;

        switch (e.key) {
          case 'ArrowUp':
            if (currentIndex > 0) {
              setMetadata({
                selectedBlockId: memory.blocks[currentIndex - 1].id,
              });
              e.preventDefault();
            }
            break;

          case 'ArrowDown':
            if (currentIndex < memory.blocks.length - 1) {
              setMetadata({
                selectedBlockId: memory.blocks[currentIndex + 1].id,
              });
              e.preventDefault();
            }
            break;

          case 'Delete':
          case 'Backspace':
            if (e.metaKey || e.ctrlKey) {
              handleDeleteBlock(metadata.selectedBlockId);
              e.preventDefault();
            }
            break;

          default:
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [memory.blocks, metadata?.selectedBlockId]);

    return (
      <div
        ref={memoryContainerRef}
        className="flex flex-col py-8 md:p-20 px-4 max-w-3xl mx-auto"
        role="region"
        aria-label="Memory editor"
      >
        {memory.blocks.length > 0 ? (
          <>
            {memory.blocks.map((block, index) => {
              const isSelected = metadata?.selectedBlockId === block.id;

              return (
                <div key={block.id}>
                  {block.type === 'text' && (
                    <TextBlock
                      block={block}
                      isSelected={isSelected}
                      onSelect={handleBlockSelect}
                      onUpdate={handleBlockUpdate}
                      onDelete={handleDeleteBlock}
                      onMoveUp={handleMoveBlockUp}
                      onMoveDown={handleMoveBlockDown}
                      onTypeChange={handleBlockTypeChange}
                      isFirstBlock={index === 0}
                      isLastBlock={index === memory.blocks.length - 1}
                    />
                  )}
                  {block.type === 'image' && (
                    <ImageBlock
                      block={block}
                      isSelected={isSelected}
                      onSelect={handleBlockSelect}
                      onUpdate={handleBlockUpdate}
                      onDelete={handleDeleteBlock}
                      onMoveUp={handleMoveBlockUp}
                      onMoveDown={handleMoveBlockDown}
                      onTypeChange={handleBlockTypeChange}
                      isFirstBlock={index === 0}
                      isLastBlock={index === memory.blocks.length - 1}
                    />
                  )}
                  {block.type === 'audio' && (
                    <AudioBlock
                      block={block}
                      isSelected={isSelected}
                      onSelect={handleBlockSelect}
                      onUpdate={handleBlockUpdate}
                      onDelete={handleDeleteBlock}
                      onMoveUp={handleMoveBlockUp}
                      onMoveDown={handleMoveBlockDown}
                      onTypeChange={handleBlockTypeChange}
                      isFirstBlock={index === 0}
                      isLastBlock={index === memory.blocks.length - 1}
                    />
                  )}
                </div>
              );
            })}

            {status === 'streaming' && <StreamingIndicator />}
          </>
        ) : status === 'streaming' ? (
          <StreamingIndicator />
        ) : (
          <EmptyState />
        )}
      </div>
    );
  },

  actions: [
    // Action buttons will be implemented in later subtasks
  ],

  toolbar: [],
});
