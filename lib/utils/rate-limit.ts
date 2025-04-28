/**
 * Rate limiting implementation for API endpoints
 * Uses a token bucket algorithm to limit request rates
 */

interface RateLimitOptions {
  /**
   * Maximum number of tokens (requests) allowed in the bucket
   */
  maxTokens: number;

  /**
   * Time in milliseconds for the bucket to refill completely from empty
   */
  refillTimeMs: number;

  /**
   * Optional TTL for entries in the user tracking map (in milliseconds)
   * This prevents memory leaks from one-time users
   */
  userTtlMs?: number;
}

interface UserBucket {
  /**
   * Current number of tokens in the user's bucket
   */
  tokens: number;

  /**
   * Last time the bucket was refilled
   */
  lastRefill: number;

  /**
   * Last time the user accessed the API
   */
  lastAccess: number;
}

export class RateLimiter {
  private options: RateLimitOptions;
  private userBuckets: Map<string, UserBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Create a new rate limiter
   * @param options Rate limit options
   */
  constructor(options: RateLimitOptions) {
    this.options = {
      ...options,
      userTtlMs: options.userTtlMs || 1000 * 60 * 60, // Default 1 hour TTL
    };

    // Set up cleanup interval if TTL is provided
    if (this.options.userTtlMs) {
      this.cleanupInterval = setInterval(
        () => this.cleanupExpiredUsers(),
        Math.min(this.options.userTtlMs / 2, 1000 * 60 * 15), // Cleanup every 15 minutes or half the TTL, whichever is less
      );
    }
  }

  /**
   * Check if a user can make a request and consume a token if allowed
   * @param userId User or client identifier
   * @returns Object with allowed status and remaining tokens
   */
  public checkAndConsume(userId: string): {
    allowed: boolean;
    remaining: number;
    resetMs: number;
  } {
    const now = Date.now();
    let bucket = this.userBuckets.get(userId);

    // If user doesn't have a bucket yet, create one
    if (!bucket) {
      bucket = {
        tokens: this.options.maxTokens,
        lastRefill: now,
        lastAccess: now,
      };
      this.userBuckets.set(userId, bucket);
    } else {
      // Update last access time
      bucket.lastAccess = now;

      // Calculate tokens to add based on time elapsed since last refill
      const timeElapsed = now - bucket.lastRefill;
      const tokensToAdd = Math.floor(
        (timeElapsed / this.options.refillTimeMs) * this.options.maxTokens,
      );

      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(
          bucket.tokens + tokensToAdd,
          this.options.maxTokens,
        );
        bucket.lastRefill = now;
      }
    }

    // Check if the user has enough tokens
    const allowed = bucket.tokens > 0;

    // Consume a token if allowed
    if (allowed) {
      bucket.tokens--;
    }

    // Calculate time until next token in milliseconds
    const tokenRefillRate = this.options.refillTimeMs / this.options.maxTokens;
    const resetMs =
      bucket.tokens < this.options.maxTokens ? tokenRefillRate : 0;

    return {
      allowed,
      remaining: bucket.tokens,
      resetMs,
    };
  }

  /**
   * Remove expired users from the tracking map
   */
  private cleanupExpiredUsers(): void {
    const now = Date.now();
    const ttl = this.options.userTtlMs || 0;

    for (const [userId, bucket] of this.userBuckets.entries()) {
      if (now - bucket.lastAccess > ttl) {
        this.userBuckets.delete(userId);
      }
    }
  }

  /**
   * Get the current rate limit status for a user
   * @param userId User or client identifier
   * @returns Rate limit status or null if user not tracked
   */
  public getStatus(userId: string): {
    remaining: number;
    total: number;
    resetMs: number;
  } | null {
    const bucket = this.userBuckets.get(userId);
    if (!bucket) return null;

    const tokenRefillRate = this.options.refillTimeMs / this.options.maxTokens;
    const resetMs =
      bucket.tokens < this.options.maxTokens ? tokenRefillRate : 0;

    return {
      remaining: bucket.tokens,
      total: this.options.maxTokens,
      resetMs,
    };
  }

  /**
   * Clean up resources when the rate limiter is no longer needed
   */
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Create a singleton instance for the suggestions endpoint with appropriate limits
// Allow 10 requests per minute per user (600 ms per token refill)
const SUGGESTIONS_RATE_LIMIT_OPTIONS: RateLimitOptions = {
  maxTokens: 10,
  refillTimeMs: 60 * 1000, // 1 minute for full refill
  userTtlMs: 24 * 60 * 60 * 1000, // 24 hours user TTL
};

export const suggestionsRateLimiter = new RateLimiter(
  SUGGESTIONS_RATE_LIMIT_OPTIONS,
);
