'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function MemoryRedirector({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    // Navigate to the new memory on component mount
    router.push(`/memories/${id}`);
  }, [id, router]);

  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold mb-2">Memory created!</h1>
      <p className="text-muted-foreground">Redirecting you now...</p>
    </div>
  );
}
