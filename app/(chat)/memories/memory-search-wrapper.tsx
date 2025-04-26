'use client';

import { useState } from 'react';
import { MemorySearch } from '@/components/memory-search';
import { MemoryCard } from '@/components/memory-card';
import { MemoryEmptyState } from '@/components/memory-empty-state';
import type { Memory } from '@/lib/types';

export function MemorySearchWrapper({ memories }: { memories: Memory[] }) {
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>(memories);

  return (
    <>
      <MemorySearch memories={memories} onFilter={setFilteredMemories} />

      {filteredMemories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <h3 className="text-lg font-medium mb-2">No matches found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      )}
    </>
  );
}
