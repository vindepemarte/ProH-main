// Simple in-memory cache for frequently accessed data
// This will help reduce database calls and improve performance

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a singleton cache instance
export const cache = new SimpleCache();

// Cache key generators for consistent naming
export const CacheKeys = {
  userHomeworks: (userId: string, role: string) => `homeworks:${role}:${userId}`,
  userNotifications: (userId: string) => `notifications:${userId}`,
  pricingConfig: () => 'pricing:config',
  superWorkerFees: () => 'fees:super_workers',
  notificationTemplates: () => 'templates:notifications',
  userProfile: (userId: string) => `user:${userId}`,
  referenceCodes: () => 'reference:codes',
} as const;

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 30 * 1000,          // 30 seconds - for frequently changing data like homeworks
  MEDIUM: 2 * 60 * 1000,     // 2 minutes - for moderately changing data
  LONG: 15 * 60 * 1000,      // 15 minutes - for rarely changing data
  VERY_LONG: 60 * 60 * 1000, // 1 hour - for static configuration data
} as const;

// Utility function to invalidate related cache entries
export function invalidateUserCache(userId: string, role?: string): void {
  if (role) {
    cache.delete(CacheKeys.userHomeworks(userId, role));
  }
  cache.delete(CacheKeys.userNotifications(userId));
  cache.delete(CacheKeys.userProfile(userId));
}

// Utility function to invalidate homework-related cache entries
export function invalidateHomeworkCache(): void {
  const stats = cache.getStats();
  stats.keys.forEach(key => {
    if (key.startsWith('homeworks:')) {
      cache.delete(key);
    }
  });
}

// Utility function to invalidate notification cache entries
export function invalidateNotificationCache(): void {
  const stats = cache.getStats();
  stats.keys.forEach(key => {
    if (key.startsWith('notifications:')) {
      cache.delete(key);
    }
  });
}

// Auto-cleanup expired cache entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 10 * 60 * 1000);
}