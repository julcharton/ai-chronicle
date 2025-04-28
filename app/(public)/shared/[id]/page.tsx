import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowUpIcon as BackIcon } from '@/components/icons';
import { getMemoryRepository } from '@/lib/repositories';
import type { MemoryMetadata } from '@/lib/types';

interface SharedMemoryPageProps {
  params: {
    id: string;
  };
}

export default async function SharedMemoryPage({
  params,
}: SharedMemoryPageProps) {
  const { id } = params;

  try {
    const memoryRepository = getMemoryRepository();
    const memory = await memoryRepository.findById(id);

    // Verify the memory exists and is public
    if (!memory || !(memory.metadata as MemoryMetadata)?.isPublic) {
      notFound();
    }

    const metadata = memory.metadata as MemoryMetadata;
    const tags = metadata?.tags || [];

    return (
      <div className="flex flex-col min-h-screen">
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <BackIcon />
                  Home
                </Link>
              </Button>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                Shared {new Date(memory.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <article className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{memory.title}</h1>

            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              {memory.content ? (
                <div dangerouslySetInnerHTML={{ __html: memory.content }} />
              ) : (
                <p className="text-muted-foreground italic">No content</p>
              )}
            </div>

            {tags.length > 0 && (
              <div className="mt-8 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>
        </main>

        <footer className="border-t py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            Shared with AI Chronicle
          </div>
        </footer>
      </div>
    );
  } catch (error) {
    console.error('Error loading shared memory:', error);
    return notFound();
  }
}
