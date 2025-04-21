import type { MemoryBlock } from '@/types/memory';
import { BlockContainer } from './block-container';

interface AudioBlockProps {
  block: MemoryBlock;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function AudioBlock({ block, isSelected, onSelect }: AudioBlockProps) {
  return (
    <BlockContainer
      block={block}
      isSelected={isSelected}
      onSelect={onSelect}
      className="p-3 bg-background"
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
    </BlockContainer>
  );
}
