'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CrossIcon, PenIcon } from '@/components/icons';
import type { Memory } from '@/lib/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const TIME_PERIODS = [
  { label: 'All time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'This year', value: 'year' },
];

export function MemorySearch({
  memories,
  onFilter,
}: {
  memories: Memory[];
  onFilter: (memories: Memory[]) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialSearchTerm = searchParams.get('q') || '';
  const initialTimeFilter = searchParams.get('time') || 'all';

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [timeFilter, setTimeFilter] = useState(initialTimeFilter);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (searchTerm) {
      params.set('q', searchTerm);
    } else {
      params.delete('q');
    }

    if (timeFilter && timeFilter !== 'all') {
      params.set('time', timeFilter);
    } else {
      params.delete('time');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, timeFilter, pathname, router, searchParams]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter memories whenever filters change
  useEffect(() => {
    const filteredMemories = filterMemories(
      memories,
      debouncedSearchTerm,
      timeFilter,
    );
    onFilter(filteredMemories);
  }, [memories, debouncedSearchTerm, timeFilter, onFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setTimeFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = debouncedSearchTerm !== '' || timeFilter !== 'all';

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-3 text-muted-foreground">
            <PenIcon size={16} />
          </span>
          <Input
            placeholder="Search memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3"
              aria-label="Clear search"
            >
              <CrossIcon size={16} />
            </button>
          )}
        </div>

        {/* Time period filter */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Select
            value={timeFilter}
            onValueChange={(value) => setTimeFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear filters button - only show if filters are active */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex-shrink-0"
          >
            Clear
            <span className="ml-2">
              <CrossIcon size={16} />
            </span>
          </Button>
        )}
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="mr-2">
            <PenIcon size={16} />
          </span>
          <span>
            Filtering by:
            {debouncedSearchTerm && (
              <span className="font-medium"> "{debouncedSearchTerm}"</span>
            )}
            {debouncedSearchTerm && timeFilter !== 'all' && <span> and </span>}
            {timeFilter !== 'all' && (
              <span className="font-medium">
                {' '}
                {TIME_PERIODS.find((p) => p.value === timeFilter)?.label}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// Helper function to filter memories based on search term and time filter
function filterMemories(
  memories: Memory[],
  searchTerm: string,
  timeFilter: string,
): Memory[] {
  return memories.filter((memory) => {
    // Search term filter
    const matchesSearch =
      !searchTerm ||
      memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.content.toLowerCase().includes(searchTerm.toLowerCase());

    // Time filter
    const createdAt = new Date(memory.createdAt);
    const now = new Date();

    let matchesTime = true;
    if (timeFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      matchesTime = createdAt >= today;
    } else if (timeFilter === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      matchesTime = createdAt >= weekStart;
    } else if (timeFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      matchesTime = createdAt >= monthStart;
    } else if (timeFilter === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      matchesTime = createdAt >= yearStart;
    }

    return matchesSearch && matchesTime;
  });
}
