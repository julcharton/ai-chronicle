'use client';

import { Artifact } from '@/components/create-artifact';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { deserializeMemory, serializeMemory } from '@/types/memory';
import type { Memory, MemoryBlock } from '@/types/memory';

// Import block components
import { TextBlock } from './components/text-block';
import { ImageBlock } from './components/image-block';
import { AudioBlock } from './components/audio-block';
import { EmptyState } from './components/empty-state';
import { StreamingIndicator } from './components/streaming-indicator';

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

  content: ({ content, status, isLoading, metadata, setMetadata }) => {
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

    return (
      <div className="flex flex-col py-8 md:p-20 px-4 max-w-3xl mx-auto">
        {memory.blocks.length > 0 ? (
          <>
            {memory.blocks.map((block) => {
              const isSelected = metadata?.selectedBlockId === block.id;

              return (
                <div key={block.id}>
                  {block.type === 'text' && (
                    <TextBlock
                      block={block}
                      isSelected={isSelected}
                      onSelect={handleBlockSelect}
                    />
                  )}
                  {block.type === 'image' && (
                    <ImageBlock
                      block={block}
                      isSelected={isSelected}
                      onSelect={handleBlockSelect}
                    />
                  )}
                  {block.type === 'audio' && (
                    <AudioBlock
                      block={block}
                      isSelected={isSelected}
                      onSelect={handleBlockSelect}
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
