/**
 * Simple LRU Cache implementation for caching API responses
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private keyTimestamps: Map<K, number>;
  private ttl: number; // Time to live in milliseconds

  /**
   * Create a new LRU Cache
   * @param capacity Maximum number of items to keep in cache
   * @param ttl Time to live in milliseconds (0 for no expiration)
   */
  constructor(capacity: number, ttl = 0) {
    this.capacity = capacity;
    this.cache = new Map();
    this.keyTimestamps = new Map();
    this.ttl = ttl;
  }

  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns Cache value or undefined if not found
   */
  get(key: K): V | undefined {
    // Check if the key exists
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Check if the item has expired
    if (this.ttl > 0) {
      const timestamp = this.keyTimestamps.get(key) || 0;
      const now = Date.now();
      if (now - timestamp > this.ttl) {
        // Item has expired
        this.cache.delete(key);
        this.keyTimestamps.delete(key);
        return undefined;
      }
    }

    // Move the accessed key to the end to mark it as most recently used
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value as V);
    this.keyTimestamps.set(key, Date.now());

    return value;
  }

  /**
   * Add or update an item in the cache
   * @param key Cache key
   * @param value Cache value
   */
  set(key: K, value: V): void {
    // If key already exists, remove it first
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // If the cache is at capacity, remove the oldest item
    else if (this.cache.size >= this.capacity) {
      const iterator = this.cache.keys();
      const result = iterator.next();
      if (!result.done) {
        const oldestKey = result.value;
        this.cache.delete(oldestKey);
        this.keyTimestamps.delete(oldestKey);
      }
    }

    // Add the new item
    this.cache.set(key, value);
    this.keyTimestamps.set(key, Date.now());
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   * @returns True if the item was in the cache, false otherwise
   */
  delete(key: K): boolean {
    const hadKey = this.cache.delete(key);
    this.keyTimestamps.delete(key);
    return hadKey;
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.keyTimestamps.clear();
  }

  /**
   * Get the current size of the cache
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Generate a cache key for the suggestions endpoint
 * @param memoryId Memory ID
 * @param content Memory content
 * @param prompt Prompt used for generating suggestions
 * @param maxSuggestions Maximum number of suggestions to generate
 * @returns Cache key
 */
export function generateSuggestionCacheKey(
  memoryId: string,
  content: string,
  prompt: string,
  maxSuggestions: number,
): string {
  // Use a hash of content for efficiency
  const contentHash = hashString(content);
  return `suggestions:${memoryId}:${contentHash}:${prompt}:${maxSuggestions}`;
}

/**
 * Create a simple hash of a string
 * @param str String to hash
 * @returns Hash string
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36); // Convert to base36 for shorter string
}
