/**
 * Base Repository Interface
 * Defines common CRUD operations that all repositories should implement
 */
export interface BaseRepository<T, K> {
  /**
   * Find an entity by its ID
   * @param id The unique identifier of the entity
   * @returns The entity if found, null otherwise
   */
  findById(id: K): Promise<T | null>;

  /**
   * Find all entities
   * @returns Array of entities
   */
  findAll(): Promise<T[]>;

  /**
   * Create a new entity
   * @param entity The entity to create
   * @returns The created entity
   */
  create(entity: Partial<T>): Promise<T>;

  /**
   * Update an existing entity
   * @param id The unique identifier of the entity
   * @param data The data to update
   * @returns The updated entity
   */
  update(id: K, data: Partial<T>): Promise<T>;

  /**
   * Delete an entity by its ID
   * @param id The unique identifier of the entity
   * @returns Boolean indicating success
   */
  delete(id: K): Promise<boolean>;

  /**
   * Find entities by user ID
   * @param userId The user ID to filter by
   * @returns Array of entities belonging to the user
   */
  findByUserId(userId: string): Promise<T[]>;

  /**
   * Run a database transaction
   * @param operation Function containing the operations to execute in a transaction
   * @returns The result of the transaction
   */
  transaction<R>(operation: () => Promise<R>): Promise<R>;
}
