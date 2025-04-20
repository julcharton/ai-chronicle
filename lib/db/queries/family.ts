import 'server-only';

import { and, eq, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { familyLink, user, type FamilyLink } from '../schema';

// Database client setup
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Creates a family relationship between two users
 * @param fromUserId - ID of the first user in the relationship
 * @param toUserId - ID of the second user in the relationship
 * @param relationshipType - Type of relationship ('parent', 'child', etc.)
 * @returns The created family link record
 */
export async function createFamilyLink(
  fromUserId: string,
  toUserId: string,
  relationshipType: FamilyLink['relationshipType'],
) {
  try {
    // Ensure both users exist
    const users = await db
      .select()
      .from(user)
      .where(or(eq(user.id, fromUserId), eq(user.id, toUserId)));

    const userIds = users.map((u) => u.id);

    if (!userIds.includes(fromUserId)) {
      throw new Error(`User with id ${fromUserId} not found`);
    }

    if (!userIds.includes(toUserId)) {
      throw new Error(`User with id ${toUserId} not found`);
    }

    // Check if relationship already exists
    const existingLink = await db
      .select()
      .from(familyLink)
      .where(
        and(
          eq(familyLink.fromUserId, fromUserId),
          eq(familyLink.toUserId, toUserId),
        ),
      )
      .limit(1);

    if (existingLink.length > 0) {
      throw new Error('Family relationship already exists');
    }

    // Create the relationship
    const result = await db
      .insert(familyLink)
      .values({
        fromUserId,
        toUserId,
        relationshipType,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to create family link', error);
    throw error;
  }
}

/**
 * Gets all family members for a user
 * @param userId - ID of the user to get family members for
 * @returns Array of family relationships with user details
 */
export async function getFamilyMembers(userId: string) {
  try {
    // Get all family links where the user is either the from or to user
    const links = await db
      .select()
      .from(familyLink)
      .where(
        or(eq(familyLink.fromUserId, userId), eq(familyLink.toUserId, userId)),
      );

    if (links.length === 0) {
      return [];
    }

    // Get all user IDs from the links
    const userIds = new Set<string>();
    links.forEach((link) => {
      userIds.add(link.fromUserId);
      userIds.add(link.toUserId);
    });

    // Remove the current user
    userIds.delete(userId);

    // Get all related users
    const familyUsers = await db
      .select()
      .from(user)
      .where(or(...Array.from(userIds).map((id) => eq(user.id, id))));

    // Create a map of user IDs to user objects
    const userMap = new Map(familyUsers.map((u) => [u.id, u]));

    // Transform links to include user details
    return links.map((link) => {
      const isFromUser = link.fromUserId === userId;
      const relatedUserId = isFromUser ? link.toUserId : link.fromUserId;
      const relatedUser = userMap.get(relatedUserId);

      return {
        id: link.id,
        relationship: link.relationshipType,
        direction: isFromUser ? 'outgoing' : 'incoming',
        user: relatedUser,
      };
    });
  } catch (error) {
    console.error('Failed to get family members', error);
    throw error;
  }
}

/**
 * Updates a family relationship
 * @param id - ID of the family link to update
 * @param data - New relationship data
 * @returns The updated family link record
 */
export async function updateFamilyLink(
  id: string,
  data: Partial<Pick<FamilyLink, 'relationshipType'>>,
) {
  try {
    // Check if the link exists
    const [existingLink] = await db
      .select()
      .from(familyLink)
      .where(eq(familyLink.id, id))
      .limit(1);

    if (!existingLink) {
      throw new Error(`Family link with id ${id} not found`);
    }

    // Update the link
    const result = await db
      .update(familyLink)
      .set(data)
      .where(eq(familyLink.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to update family link', error);
    throw error;
  }
}

/**
 * Deletes a family relationship
 * @param id - ID of the family link to delete
 * @returns The deletion result
 */
export async function deleteFamilyLink(id: string) {
  try {
    return await db.delete(familyLink).where(eq(familyLink.id, id)).returning();
  } catch (error) {
    console.error('Failed to delete family link', error);
    throw error;
  }
}

/**
 * Checks if two users are related
 * @param userId1 - ID of the first user
 * @param userId2 - ID of the second user
 * @returns True if the users are related, false otherwise
 */
export async function areUsersRelated(userId1: string, userId2: string) {
  try {
    const links = await db
      .select()
      .from(familyLink)
      .where(
        or(
          and(
            eq(familyLink.fromUserId, userId1),
            eq(familyLink.toUserId, userId2),
          ),
          and(
            eq(familyLink.fromUserId, userId2),
            eq(familyLink.toUserId, userId1),
          ),
        ),
      )
      .limit(1);

    return links.length > 0;
  } catch (error) {
    console.error('Failed to check if users are related', error);
    throw error;
  }
}
