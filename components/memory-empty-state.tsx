import { Button } from '@/components/ui/button';
import { PlusIcon, ImageIcon } from '@/components/icons';
import Link from 'next/link';

export function MemoryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-muted">
        <ImageIcon size={36} />
      </div>
      <h2 className="text-xl font-semibold mb-2">No memories yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start capturing your important moments with AI-guided memory creation.
      </p>
      <Button asChild>
        <Link href="/memories/new">
          <PlusIcon />
          Create Your First Memory
        </Link>
      </Button>
    </div>
  );
}
