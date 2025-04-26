import { auth } from '@/app/(auth)/auth';
import { getMemoryRepository } from '@/lib/repositories';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowUpIcon as BackIcon } from '@/components/icons';
import { Suspense } from 'react';
import { MemoryEditorContainer } from '@/components/memory-editor-container';

interface MemoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MemoryPage({ params }: MemoryPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/memories">
            <BackIcon />
            Back to Memories
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Suspense fallback={<MemoryLoading />}>
          <MemoryContent id={id} />
        </Suspense>
      </div>
    </div>
  );
}

function MemoryLoading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 w-1/2 bg-muted rounded mb-6" />
      <div className="h-4 w-32 bg-muted rounded mb-8" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
      </div>
    </div>
  );
}

async function MemoryContent({ id }: { id: string }) {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-center mb-4">Please sign in to view this memory</p>
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  try {
    const memoryRepository = getMemoryRepository();
    const memory = await memoryRepository.findById(id);

    if (!memory || memory.userId !== session.user.id) {
      notFound();
    }

    return (
      <div className="h-full">
        <MemoryEditorContainer
          memoryId={id}
          initialContent={memory.content || ''}
          initialTitle={memory.title}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading memory:', error);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-destructive mb-4">Failed to load memory</p>
        <Button asChild variant="outline">
          <Link href={`/memories/${id}`}>Try Again</Link>
        </Button>
      </div>
    );
  }
}
