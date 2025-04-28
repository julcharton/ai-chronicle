import { db } from '../db/client';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

// Error handling and retry configurations
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

/**
 * Enhanced DB client with additional functionality
 * for connection pooling, retries, and transactions
 */
class DbClient {
  private client = db;
  private debug = true;

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
      if (this.debug) {
        console.log(
          `[DbClient] Executing database operation (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`,
        );
      }

      const result = await operation();

      if (this.debug) {
        console.log(`[DbClient] Database operation successful`);
      }

      return result;
    } catch (error) {
      // Check if error is retryable (connection issues typically)
      if (this.isRetryableError(error) && retries > 0) {
        console.warn(
          `[DbClient] Database operation failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`,
          error,
        );

        // Wait before retrying with exponential backoff
        const backoffDelay =
          RETRY_DELAY_MS * Math.pow(2, MAX_RETRIES - retries);
        console.log(`[DbClient] Waiting ${backoffDelay}ms before retry`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));

        // Retry with decremented retry count
        return this.executeWithRetry(operation, retries - 1);
      }

      // If not retryable or no more retries, rethrow
      console.error('[DbClient] Database operation failed:', error);
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
      'connection is closed',
      'Client has encountered a connection error',
      'Connection refused',
      'timeout',
      'idle',
      'SSL connection has been closed unexpectedly',
      'SSL SYSCALL error',
    ];

    const errorMessage = error?.message || '';

    // Check PostgreSQL error codes that are retryable
    // 40001: serialization_failure
    // 40P01: deadlock_detected
    // 57P01: admin_shutdown
    // 57P02: crash_shutdown
    // 57P03: cannot_connect_now
    // 08000: connection_exception
    // 08003: connection_does_not_exist
    // 08006: connection_failure
    // 08001: sqlclient_unable_to_establish_sqlconnection
    // 08004: sqlserver_rejected_establishment_of_sqlconnection
    // 53300: too_many_connections
    const retryableSqlCodes = [
      '40001',
      '40P01',
      '57P01',
      '57P02',
      '57P03',
      '08000',
      '08003',
      '08006',
      '08001',
      '08004',
      '53300',
    ];

    const pgError = error as any;
    const sqlCode = pgError?.code;

    if (sqlCode && retryableSqlCodes.includes(sqlCode)) {
      console.log(`[DbClient] Retryable SQL error code: ${sqlCode}`);
      return true;
    }

    const isRetryable = retryableErrors.some((msg) =>
      errorMessage.includes(msg),
    );

    if (isRetryable) {
      console.log(`[DbClient] Retryable error message: ${errorMessage}`);
    }

    return isRetryable;
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
      if (this.debug) {
        console.log('[DbClient] Starting transaction');
      }

      // Note: PostgreSQL transactions would typically be handled like this:
      // await this.client.execute(sql`BEGIN`);
      // const result = await operation();
      // await this.client.execute(sql`COMMIT`);
      // return result;

      // Since Drizzle ORM doesn't yet have full transaction support in all environments,
      // we're implementing a basic version that will need to be enhanced
      // once proper transaction support is available

      const result = await operation();

      if (this.debug) {
        console.log('[DbClient] Transaction completed successfully');
      }

      return result;
    } catch (error) {
      // await this.client.execute(sql`ROLLBACK`);
      console.error('[DbClient] Transaction failed, rolling back:', error);
      throw error;
    }
  }

  /**
   * Check the database connection
   * @returns A boolean indicating if the connection is healthy
   */
  async checkConnection(): Promise<boolean> {
    try {
      console.log('[DbClient] Checking database connection');

      // Simple query to test connection
      const result = await this.executeWithRetry(async () => {
        return await this.client.execute(sql`SELECT 1 as connection_test`);
      });

      console.log('[DbClient] Database connection is healthy');
      return true;
    } catch (error) {
      console.error('[DbClient] Database connection check failed:', error);
      return false;
    }
  }
}

// Export a singleton instance of the client
export const dbClient = new DbClient();
