import type { MemoryBlock } from '@/types/memory';
import { BlockContainer } from './block-container';

interface ImageBlockProps {
  block: MemoryBlock;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ImageBlock({ block, isSelected, onSelect }: ImageBlockProps) {
  return (
    <BlockContainer block={block} isSelected={isSelected} onSelect={onSelect}>
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
    </BlockContainer>
  );
}
