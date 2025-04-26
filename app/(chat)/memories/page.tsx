import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/icons';
import Link from 'next/link';
import { MemoryCard } from '@/components/memory-card';
import { MemoryEmptyState } from '@/components/memory-empty-state';
import { getMemories } from './actions';
import { Suspense } from 'react';
import { MemorySearch } from '@/components/memory-search';
import { MemorySearchWrapper } from './memory-search-wrapper';

export default function MemoriesPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <h1 className="text-2xl font-bold">Your Memories</h1>
        <Button asChild>
          <Link href="/memories/new">
            <PlusIcon />
            Create Memory
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Suspense fallback={<MemoriesLoading />}>
          <MemoriesList />
        </Suspense>
      </div>
    </div>
  );
}

function MemoriesLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-24 w-24 rounded-full bg-muted mb-4" />
        <div className="h-4 w-48 bg-muted rounded mb-2" />
        <div className="h-3 w-36 bg-muted rounded" />
      </div>
    </div>
  );
}

async function MemoriesList() {
  try {
    const memories = await getMemories();

    if (memories.length === 0) {
      return <MemoryEmptyState />;
    }

    return (
      <>
        <MemorySearchWrapper memories={memories} />
      </>
    );
  } catch (error) {
    console.error('Error loading memories:', error);
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-destructive mb-4">Failed to load memories</p>
        <Button asChild variant="outline">
          <Link href="/memories">Try Again</Link>
        </Button>
      </div>
    );
  }
}
