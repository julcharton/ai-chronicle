import { PlusIcon } from '@/components/icons';

interface EmptyStateProps {
  onCreateBlock?: () => void;
}

export function EmptyState({ onCreateBlock }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted-foreground/20 rounded-md text-center">
      <p className="text-muted-foreground mb-4">This memory is empty</p>
      {onCreateBlock && (
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={onCreateBlock}
        >
          <span className="text-sm">➕</span>
          <span>Add a block</span>
        </button>
      )}
    </div>
  );
}
