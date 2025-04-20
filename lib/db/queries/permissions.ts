import 'server-only';

import { and, eq, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { memory, memoryPermission, user, familyLink } from '../schema';
import { areUsersRelated } from './family';

// Database client setup
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Checks if a user can view a memory
 * @param userId - ID of the user attempting to view
 * @param memoryId - ID of the memory to check
 * @returns Whether the user has permission to view the memory
 */
export async function canViewMemory(
  userId: string,
  memoryId: string,
): Promise<boolean> {
  try {
    // Get the memory
    const [memoryRecord] = await db
      .select()
      .from(memory)
      .where(eq(memory.id, memoryId))
      .limit(1);

    if (!memoryRecord) {
      return false;
    }

    // Check if the user is an admin
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord) {
      return false;
    }

    // Admins can view any memory
    if (userRecord.isAdmin) {
      return true;
    }

    // Memory owners can always view their own memories
    if (memoryRecord.userId === userId) {
      return true;
    }

    // Public memories can be viewed by anyone
    if (memoryRecord.visibility === 'public') {
      return true;
    }

    // Check for explicit view permission
    const [permission] = await db
      .select()
      .from(memoryPermission)
      .where(
        and(
          eq(memoryPermission.memoryId, memoryId),
          eq(memoryPermission.userId, userId),
          or(
            eq(memoryPermission.permissionType, 'view'),
            eq(memoryPermission.permissionType, 'edit'),
            eq(memoryPermission.permissionType, 'manage'),
          ),
        ),
      )
      .limit(1);

    if (permission) {
      return true;
    }

    // For family-visible memories, check family relationship
    if (memoryRecord.visibility === 'family') {
      return await areUsersRelated(userId, memoryRecord.userId);
    }

    return false;
  } catch (error) {
    console.error('Failed to check view permission', error);
    return false;
  }
}

/**
 * Checks if a user can edit a memory
 * @param userId - ID of the user attempting to edit
 * @param memoryId - ID of the memory to check
 * @returns Whether the user has permission to edit the memory
 */
export async function canEditMemory(
  userId: string,
  memoryId: string,
): Promise<boolean> {
  try {
    // Get the memory
    const [memoryRecord] = await db
      .select()
      .from(memory)
      .where(eq(memory.id, memoryId))
      .limit(1);

    if (!memoryRecord) {
      return false;
    }

    // Check if the user is an admin
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord) {
      return false;
    }

    // Admins can edit any memory
    if (userRecord.isAdmin) {
      return true;
    }

    // Memory owners can always edit their own memories
    if (memoryRecord.userId === userId) {
      return true;
    }

    // Check for explicit edit or manage permission
    const [permission] = await db
      .select()
      .from(memoryPermission)
      .where(
        and(
          eq(memoryPermission.memoryId, memoryId),
          eq(memoryPermission.userId, userId),
          or(
            eq(memoryPermission.permissionType, 'edit'),
            eq(memoryPermission.permissionType, 'manage'),
          ),
        ),
      )
      .limit(1);

    return !!permission;
  } catch (error) {
    console.error('Failed to check edit permission', error);
    return false;
  }
}

/**
 * Checks if a user can delete a memory
 * @param userId - ID of the user attempting to delete
 * @param memoryId - ID of the memory to check
 * @returns Whether the user has permission to delete the memory
 */
export async function canDeleteMemory(
  userId: string,
  memoryId: string,
): Promise<boolean> {
  try {
    // Get the memory
    const [memoryRecord] = await db
      .select()
      .from(memory)
      .where(eq(memory.id, memoryId))
      .limit(1);

    if (!memoryRecord) {
      return false;
    }

    // Check if the user is an admin
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord) {
      return false;
    }

    // Admins can delete any memory
    if (userRecord.isAdmin) {
      return true;
    }

    // Memory owners can always delete their own memories
    if (memoryRecord.userId === userId) {
      return true;
    }

    // Check for explicit manage permission
    const [permission] = await db
      .select()
      .from(memoryPermission)
      .where(
        and(
          eq(memoryPermission.memoryId, memoryId),
          eq(memoryPermission.userId, userId),
          eq(memoryPermission.permissionType, 'manage'),
        ),
      )
      .limit(1);

    return !!permission;
  } catch (error) {
    console.error('Failed to check delete permission', error);
    return false;
  }
}

/**
 * Grants a permission to a user for a specific memory
 * @param memoryId - ID of the memory
 * @param userId - ID of the user to grant permission to
 * @param permissionType - Type of permission to grant
 * @returns The created permission record
 */
export async function grantPermission(
  memoryId: string,
  userId: string,
  permissionType: 'view' | 'edit' | 'delete' | 'manage',
) {
  try {
    // Check if memory exists
    const [memoryRecord] = await db
      .select()
      .from(memory)
      .where(eq(memory.id, memoryId))
      .limit(1);

    if (!memoryRecord) {
      throw new Error(`Memory with id ${memoryId} not found`);
    }

    // Check if user exists
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Check if permission already exists
    const existingPermission = await db
      .select()
      .from(memoryPermission)
      .where(
        and(
          eq(memoryPermission.memoryId, memoryId),
          eq(memoryPermission.userId, userId),
          eq(memoryPermission.permissionType, permissionType),
        ),
      )
      .limit(1);

    if (existingPermission.length > 0) {
      throw new Error(`Permission already exists`);
    }

    // Create the permission
    const result = await db
      .insert(memoryPermission)
      .values({
        memoryId,
        userId,
        permissionType,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to grant permission', error);
    throw error;
  }
}

/**
 * Revokes a permission from a user for a specific memory
 * @param memoryId - ID of the memory
 * @param userId - ID of the user to revoke permission from
 * @param permissionType - Type of permission to revoke
 * @returns The deletion result
 */
export async function revokePermission(
  memoryId: string,
  userId: string,
  permissionType: 'view' | 'edit' | 'delete' | 'manage',
) {
  try {
    return await db
      .delete(memoryPermission)
      .where(
        and(
          eq(memoryPermission.memoryId, memoryId),
          eq(memoryPermission.userId, userId),
          eq(memoryPermission.permissionType, permissionType),
        ),
      )
      .returning();
  } catch (error) {
    console.error('Failed to revoke permission', error);
    throw error;
  }
}
