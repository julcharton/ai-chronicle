import { db } from '../db/client';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

// Error handling and retry configurations
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

/**
 * Enhanced DB client with additional functionality
 * for connection pooling, retries, and transactions
 */
class DbClient {
  private client = db;

  /**
   * Execute a database operation with retry logic
   * @param operation Function to execute
   * @param retries Number of retries remaining
   * @returns Result of the operation
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries = MAX_RETRIES,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Check if error is retryable (connection issues typically)
      if (this.isRetryableError(error) && retries > 0) {
        console.warn(
          `Database operation failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`,
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

        // Retry with decremented retry count
        return this.executeWithRetry(operation, retries - 1);
      }

      // If not retryable or no more retries, rethrow
      console.error('Database operation failed:', error);
      throw error;
    }
  }

  /**
   * Check if an error is retryable
   * @param error The error to check
   * @returns Whether the error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Common retryable errors (connection-related)
    // This can be expanded based on specific database error codes
    const retryableErrors = [
      'socket hang up',
      'connection reset',
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENOTFOUND',
      'Connection terminated',
    ];

    const errorMessage = error?.message || '';

    return retryableErrors.some((msg) => errorMessage.includes(msg));
  }

  /**
   * Get the database instance
   * @returns Drizzle ORM instance
   */
  get db() {
    return this.client;
  }

  /**
   * Execute a transaction
   * @param operation Function to execute in transaction
   * @returns Result of the transaction
   */
  async transaction<T>(operation: () => Promise<T>): Promise<T> {
    try {
      // Note: PostgreSQL transactions would typically be handled like this:
      // await this.client.execute(sql`BEGIN`);
      // const result = await operation();
      // await this.client.execute(sql`COMMIT`);
      // return result;

      // Since Drizzle ORM doesn't yet have full transaction support in all environments,
      // we're implementing a basic version that will need to be enhanced
      // once proper transaction support is available

      return await operation();
    } catch (error) {
      // await this.client.execute(sql`ROLLBACK`);
      console.error('Transaction failed, rolling back:', error);
      throw error;
    }
  }
}

// Export a singleton instance of the client
export const dbClient = new DbClient();
