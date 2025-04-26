'use server';

import { auth } from '@/app/(auth)/auth';
import { getMemoryRepository } from '@/lib/repositories';
import type { MemoryMetadata } from '@/lib/types';
import { revalidatePath } from 'next/cache';

/**
 * Update a memory with new content and metadata
 */
export async function updateMemoryAction({
  id,
  title,
  content,
  metadata,
}: {
  id: string;
  title?: string;
  content?: string;
  metadata?: MemoryMetadata;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const memoryRepository = getMemoryRepository();

    // Verify the memory belongs to the current user
    const existingMemory = await memoryRepository.findById(id);

    if (!existingMemory) {
      return { success: false, error: 'Memory not found' };
    }

    if (existingMemory.userId !== session.user.id) {
      return { success: false, error: 'Not authorized to update this memory' };
    }

    // Update the memory
    await memoryRepository.update(id, {
      title,
      content,
      metadata,
    });

    // Revalidate the page to show updated content
    revalidatePath(`/memories/${id}`);
    revalidatePath('/memories');

    return { success: true };
  } catch (error) {
    console.error('Failed to update memory:', error);
    return { success: false, error: 'Failed to update memory' };
  }
}
