import type { MemoryBlock } from '@/types/memory';
import { Markdown } from '@/components/markdown';
import { BlockContainer } from './block-container';

interface TextBlockProps {
  block: MemoryBlock;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function TextBlock({ block, isSelected, onSelect }: TextBlockProps) {
  return (
    <BlockContainer
      block={block}
      isSelected={isSelected}
      onSelect={onSelect}
      className="p-3 bg-background"
    >
      <div className="prose dark:prose-invert prose-sm max-w-none">
        <Markdown>{block.content}</Markdown>
      </div>
    </BlockContainer>
  );
}
