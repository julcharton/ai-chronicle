import { cn } from '@/lib/utils';
import type { MemoryBlock } from '@/types/memory';
import type { ReactNode } from 'react';

interface BlockContainerProps {
  block: MemoryBlock;
  children: ReactNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  className?: string;
}

export function BlockContainer({
  block,
  children,
  isSelected,
  onSelect,
  className,
}: BlockContainerProps) {
  return (
    <div
      className={cn(
        'mb-4 relative transition-all rounded-md hover:ring-1 hover:ring-primary/50',
        {
          'ring-2 ring-primary': isSelected,
        },
        className,
      )}
      onClick={() => onSelect(block.id)}
    >
      {children}

      {block.metadata?.caption && (
        <p className="mt-2 text-sm text-muted-foreground px-3">
          {block.metadata.caption}
        </p>
      )}

      <div className="text-xs text-muted-foreground mt-1 px-3">
        {new Date(block.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
