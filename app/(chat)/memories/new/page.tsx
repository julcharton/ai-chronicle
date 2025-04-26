import { createMemory } from '../actions';
import { Suspense } from 'react';
import { MemoryRedirector } from './memory-redirector';

export default function NewMemoryPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Suspense fallback={<LoadingState />}>
        <NewMemoryCreator />
      </Suspense>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold mb-2">Creating your memory...</h1>
      <p className="text-muted-foreground">
        Just a moment while we set things up
      </p>
      <div className="animate-pulse mt-4 flex justify-center">
        <div className="h-2 w-24 bg-muted rounded" />
      </div>
    </div>
  );
}

async function NewMemoryCreator() {
  // Create a new memory
  const result = await createMemory();

  if ('error' in result) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2 text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{result.error}</p>
        <p className="text-sm">
          Please try again or contact support if the issue persists.
        </p>
      </div>
    );
  }

  // Use the client component for redirection
  return <MemoryRedirector id={result.id} />;
}
