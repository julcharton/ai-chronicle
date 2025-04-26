/**
 * Memory interface representing a user's stored memory document
 */
export interface Memory {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  isPublic?: boolean;
}
