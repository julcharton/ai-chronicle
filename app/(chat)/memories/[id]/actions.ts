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
  console.log(
    `[updateMemoryAction] Starting update for memory ${id.substring(0, 8)}`,
  );
  console.log(`[updateMemoryAction] Content length: ${content?.length || 0}`);
  console.log(`[updateMemoryAction] Has metadata: ${Boolean(metadata)}`);

  const session = await auth();

  if (!session?.user?.id) {
    console.error('[updateMemoryAction] Not authenticated');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    console.log(
      `[updateMemoryAction] User ID: ${session.user.id.substring(0, 8)}`,
    );
    const memoryRepository = getMemoryRepository();

    // Verify the memory belongs to the current user
    const existingMemory = await memoryRepository.findById(id);

    if (!existingMemory) {
      console.error(
        `[updateMemoryAction] Memory ${id.substring(0, 8)} not found`,
      );
      return { success: false, error: 'Memory not found' };
    }

    if (existingMemory.userId !== session.user.id) {
      console.error(
        `[updateMemoryAction] Not authorized - memory belongs to ${existingMemory.userId.substring(0, 8)}`,
      );
      return { success: false, error: 'Not authorized to update this memory' };
    }

    console.log(`[updateMemoryAction] Updating memory ${id.substring(0, 8)}`);

    // Update the memory
    const updatedMemory = await memoryRepository.update(id, {
      title,
      content,
      metadata,
    });

    console.log(
      `[updateMemoryAction] Memory updated successfully. Updated at: ${updatedMemory.updatedAt}`,
    );

    // Revalidate the page to show updated content
    revalidatePath(`/memories/${id}`);
    revalidatePath('/memories');

    return { success: true };
  } catch (error) {
    console.error('[updateMemoryAction] Failed to update memory:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update memory',
    };
  }
}
