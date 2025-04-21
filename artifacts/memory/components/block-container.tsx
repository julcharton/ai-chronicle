import { cn } from '@/lib/utils';
import type { MemoryBlock } from '@/types/memory';
import type { ReactNode } from 'react';

interface BlockContainerProps {
  block: MemoryBlock;
  children: ReactNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  className?: string;
  onDoubleClick?: () => void;
}

export function BlockContainer({
  block,
  children,
  isSelected,
  onSelect,
  className,
  onDoubleClick,
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
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
    >
      {children}

      {block.metadata?.caption && !className?.includes('p-3') && (
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
