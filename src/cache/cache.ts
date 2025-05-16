import sizeof from "object-sizeof";

export type CacheEntry = {
  value: any;
  expiry?: number | undefined;
};
/**
 * Interface for custom storage implementations to be used with the caching system.
 * Implement this interface to define how cache entries are stored, retrieved, and managed
 * when using `setCustomStorage`. All methods are required unless marked as optional.
 *
 * @method get - Retrieves a value from the custom storage by its key.
 * @param get.key - The unique string identifier for the cached entry.
 * @returns get - The cached value if found and not expired, or `undefined` if not found or expired.
 *                The system does not enforce expiration here; use `ttl` in `set` for that purpose.
 *
 * @method set - Stores a value in the custom storage with an optional time-to-live (TTL) and persistence flag.
 * @param set.key - The unique string identifier for the cached entry.
 * @param set.value - The value to store (can be any type).
 * @param set.ttl - Optional time-to-live in milliseconds. If provided, the entry should expire
 *                  after this duration unless refreshed. The system tracks this via `expirationMap`
 *                  if `cleanup` is not implemented.
 * @param set.persist - Optional flag indicating if the entry should be persisted (e.g., to disk or
 *                      a database) rather than kept only in memory. Defaults to `false`.
 *
 * @method delete - Deletes a specific entry from the custom storage.
 * @param delete.key - The unique string identifier of the entry to remove.
 *
 * @method cleanup - Optional method to perform periodic cleanup of expired entries.
 *                   If implemented, this is called by `startCacheCleanup` at the specified interval.
 *                   Use this to remove entries whose TTL has expired, based on your storage's logic.
 *                   If not provided, the system uses an internal `expirationMap` to track and delete expired entries.
 *
 * @method clear - Optional method to reset the entire custom storage.
 *                 If implemented, this is called by `resetCache` to clear all entries.
 *                 Use this to wipe the storage completely (e.g., clear a database or memory store).
 *                 If not provided, `resetCache` will log a warning and do nothing for custom storage.
 *
 * @method status - Optional method to return the current status of the custom storage.
 *                  If implemented, this is called by `getCacheStatus` to provide details about the cache.
 *                  Should return an object with optional properties: `entryCount` (total entries),
 *                  `persistentCount` (persistent entries), and `expirationCount` (entries with TTL),
 *                  or `undefined` if not available.
 */
export type CustomCacheStorage = {
  get(key: string): CacheEntry | null;
  set(key: string, value: any, ttl?: number, persist?: boolean): void;
  delete(key: string): void;
  cleanup?(): void;
  clear?(): void;
  status?():
    | {
        entryCount?: number;
        persistentCount?: number;
        expirationCount?: number;
      }
    | undefined;
};

type CustomStorage = CustomCacheStorage | null;
const SUCCESS = 1;
const DEFAULT_CLEANUP_INTERVAL_MS = 60000;
const CACHE_KEY_PREFIX = "enhanced_suspense_cache_";
const customStorageExpirationMap = new Map<string, number>();
const memoryExpirationMap = new Map<string, number>();
const memoryCache = new Map<string, CacheEntry>();
const accessOrder = new Map<string, number>();
const isLocalStorageAvailable =
  typeof window !== "undefined" && typeof localStorage !== "undefined";
const cache = {
  cleanupInterval: null as NodeJS.Timeout | null,
  MAX_CACHE_ENTRIES: null as number | null,
  MAX_CACHE_BYTES: null as number | null,
  currentCacheBytes: 0,
  customStorage: null as CustomStorage,
  getPersistentAndExpirationCount() {
    let persistentCount = 0;
    let expirationCount = 0;
    const now = Date.now();
    if (isLocalStorageAvailable) {
      for (const localStorageKey of Object.keys(localStorage)) {
        if (!localStorageKey.startsWith(CACHE_KEY_PREFIX)) continue;
        const cacheKey = localStorageKey.slice(CACHE_KEY_PREFIX.length);
        const cacheEntry = operateOnLocalStorage(cacheKey, "getParsed");
        if (
          isValidCacheEntry(cacheEntry) &&
          (!cacheEntry.expiry || now <= cacheEntry.expiry)
        ) {
          persistentCount++;
          if (cacheEntry.expiry !== undefined) expirationCount++;
        }
      }
    }
    for (const [cacheKey, cacheEntry] of memoryCache) {
      if (
        operateOnLocalStorage(cacheKey, "get") === undefined &&
        cacheEntry.expiry !== undefined &&
        now <= cacheEntry.expiry
      ) {
        expirationCount++;
      }
    }
    return { persistentCount, expirationCount };
  },
  setMemoryStorage(
    cacheKey: string,
    cacheEntry: CacheEntry,
    cacheEntrySize: number,
    ttl?: number,
    persist: boolean = false
  ) {
    if (!isValidCacheKey(cacheKey)) return;
    memoryCache.set(cacheKey, cacheEntry);
    accessOrder.set(cacheKey, Date.now());
    this.currentCacheBytes += cacheEntrySize;
    if (isValidTTL(ttl)) {
      memoryExpirationMap.set(cacheKey, Date.now() + ttl!);
    }
    persist && operateOnLocalStorage(cacheKey, "setStringified", cacheEntry);
    if (this.MAX_CACHE_ENTRIES !== null) {
      while (memoryCache.size > this.MAX_CACHE_ENTRIES) {
        const oldestCacheKey = this.getOldestCacheKey();
        if (!oldestCacheKey) break;
        const oldCacheEntry = memoryCache.get(oldestCacheKey);
        this.currentCacheBytes -= oldCacheEntry
          ? estimateCacheEntrySize(oldCacheEntry, oldestCacheKey)
          : 0;
        memoryCache.delete(oldestCacheKey);
        accessOrder.delete(oldestCacheKey);
        operateOnLocalStorage(oldestCacheKey, "remove");
        memoryExpirationMap.delete(oldestCacheKey);
      }
    }
  },
  setCustomStorage(
    cacheKey: string,
    value: any,
    ttl?: number,
    persist: boolean = false
  ) {
    if (!this.customStorage) return;
    try {
      this.customStorage.set(cacheKey, value, ttl, persist);
      if (isValidTTL(ttl) && !this.customStorage.cleanup) {
        customStorageExpirationMap.set(cacheKey, Date.now() + ttl!);
      }
    } catch (error) {
      console.warn(`Custom storage set failed for key "${cacheKey}": ${error}`);
    }
  },
  getOldestCacheKey() {
    if (accessOrder.size === 0) return undefined;
    const oldest = [...accessOrder.entries()].reduce(
      (min, [k, t]) => (t < min[1] ? [k, t] : min),
      ["", Infinity]
    )[0];
    return oldest || undefined;
  },
  deleteFromCustomStorage(cacheKey: string) {
    if (!this.customStorage) return;
    try {
      this.customStorage.delete(cacheKey);
      customStorageExpirationMap.delete(cacheKey);
    } catch (error) {
      console.warn(
        `Custom storage delete failed for key "${cacheKey}": ${error}`
      );
    }
  },
  cleanupFromCustomStorage() {
    if (!this.customStorage) return;
    if (this.customStorage.cleanup) {
      try {
        this.customStorage.cleanup();
      } catch (error) {
        console.warn(`Custom storage cleanup failed: ${error}`);
      }
    } else {
      const now = Date.now();
      for (const [cacheKey, expiry] of customStorageExpirationMap) {
        if (now > expiry) {
          this.deleteFromCustomStorage(cacheKey);
        }
      }
    }
  },
  cleanupFromMemoryStorage() {
    const now = Date.now();
    if (isLocalStorageAvailable) {
      for (const [cacheKey, expiry] of memoryExpirationMap) {
        if (now > expiry) {
          const cacheEntry = memoryCache.get(cacheKey);
          this.currentCacheBytes -= cacheEntry
            ? estimateCacheEntrySize(cacheEntry, cacheKey)
            : 0;
          memoryCache.delete(cacheKey);
          accessOrder.delete(cacheKey);
          operateOnLocalStorage(cacheKey, "remove");
          memoryExpirationMap.delete(cacheKey);
        }
      }
      for (const localStorageKey of Object.keys(localStorage)) {
        if (!localStorageKey.startsWith(CACHE_KEY_PREFIX)) continue;
        const cacheKey = localStorageKey.slice(CACHE_KEY_PREFIX.length);
        const cacheEntry = operateOnLocalStorage(cacheKey, "getParsed");
        if (cacheEntry === undefined) {
          console.warn(
            `Removed corrupt localStorage entry for key "${cacheKey}"`
          );
          operateOnLocalStorage(cacheKey, "remove");
          continue;
        }
        if (
          isValidCacheEntry(cacheEntry) &&
          cacheEntry.expiry &&
          now > cacheEntry.expiry
        ) {
          operateOnLocalStorage(cacheKey, "remove");
          memoryExpirationMap.delete(cacheKey);
        }
      }
    } else {
      for (const [cacheKey, expiry] of memoryExpirationMap) {
        if (now > expiry) {
          const cacheEntry = memoryCache.get(cacheKey);
          this.currentCacheBytes -= cacheEntry
            ? estimateCacheEntrySize(cacheEntry, cacheKey)
            : 0;
          memoryCache.delete(cacheKey);
          accessOrder.delete(cacheKey);
          memoryExpirationMap.delete(cacheKey);
        }
      }
    }
  },
  freeMemory(cacheKey: string, cacheEntrySize: number) {
    if (this.MAX_CACHE_BYTES !== null) {
      const existingCacheEntry = memoryCache.get(cacheKey);
      if (existingCacheEntry) {
        this.currentCacheBytes -= estimateCacheEntrySize(
          existingCacheEntry,
          cacheKey
        );
      }
      while (
        this.currentCacheBytes + cacheEntrySize > this.MAX_CACHE_BYTES &&
        memoryCache.size > 0
      ) {
        const oldestCacheKey = this.getOldestCacheKey();
        if (!oldestCacheKey) break;
        const oldCacheEntry = memoryCache.get(oldestCacheKey);
        this.currentCacheBytes -= oldCacheEntry
          ? estimateCacheEntrySize(oldCacheEntry, oldestCacheKey)
          : 0;
        memoryCache.delete(oldestCacheKey);
        accessOrder.delete(oldestCacheKey);
        operateOnLocalStorage(oldestCacheKey, "remove");
        memoryExpirationMap.delete(oldestCacheKey);
      }
    }
  },
  clearFromCustomStorage() {
    if (!this.customStorage) return;
    if (this.customStorage.clear) {
      try {
        this.customStorage.clear();
        customStorageExpirationMap.clear();
      } catch (error) {
        console.warn(`Custom storage clear failed: ${error}`);
      }
    } else {
      console.warn(
        "Clear custom storage is not supported; implement clear() in your CustomCacheStorage."
      );
    }
  },
  getFromCustomStorage(cacheKey: string) {
    if (!this.customStorage) return null;
    const expiry = customStorageExpirationMap.get(cacheKey);
    if (expiry && Date.now() > expiry) {
      try {
        const value = this.customStorage.get(cacheKey);
        if (value !== undefined) {
          this.deleteFromCustomStorage(cacheKey);
        } else {
          customStorageExpirationMap.delete(cacheKey);
        }
      } catch (getError) {
        console.warn(
          `Custom storage get failed for key "${cacheKey}": ${getError}`
        );
      } finally {
        return null;
      }
    }
    try {
      return this.customStorage.get(cacheKey);
    } catch (error) {
      console.warn(`Custom storage get failed for key "${cacheKey}": ${error}`);
      return null;
    }
  },
  getFromMemoryStorage(cacheKey: string) {
    const memoryCacheEntry = memoryCache.get(cacheKey);
    if (memoryCacheEntry !== undefined) {
      if (memoryCacheEntry.expiry && Date.now() > memoryCacheEntry.expiry) {
        this.currentCacheBytes -= estimateCacheEntrySize(
          memoryCacheEntry,
          cacheKey
        );
        memoryCache.delete(cacheKey);
        accessOrder.delete(cacheKey);
        memoryExpirationMap.delete(cacheKey);
        operateOnLocalStorage(cacheKey, "remove");
        return null;
      }
      accessOrder.set(cacheKey, Date.now());
      return memoryCacheEntry;
    }
    const cacheEntry = operateOnLocalStorage(cacheKey, "getParsed");
    if (isValidCacheEntry(cacheEntry)) {
      if (cacheEntry.expiry && Date.now() > cacheEntry.expiry) {
        operateOnLocalStorage(cacheKey, "remove");
        memoryExpirationMap.delete(cacheKey);
        return null;
      }
      const cacheEntrySize = estimateCacheEntrySize(cacheEntry, cacheKey);
      this.freeMemory(cacheKey, cacheEntrySize);
      memoryCache.set(cacheKey, cacheEntry);
      accessOrder.set(cacheKey, Date.now());
      this.currentCacheBytes += cacheEntrySize;
      return cacheEntry;
    }
    return null;
  },
};

export function isNotExpired(expiry?: number) {
  return expiry === undefined || Date.now() <= expiry;
}

function isValidCacheKey(cacheKey: string) {
  return cacheKey && cacheKey.trim() !== "";
}

/**
 * Validates if an entry is a valid cache entry with a value and optional expiry.
 * @param cacheEntry - The entry to validate.
 * @returns True if the entry is valid, false otherwise.
 */
function isValidCacheEntry(cacheEntry: any): cacheEntry is CacheEntry {
  return (
    cacheEntry !== null &&
    typeof cacheEntry === "object" &&
    "value" in cacheEntry &&
    (cacheEntry.expiry === undefined || typeof cacheEntry.expiry === "number")
  );
}

function operateOnLocalStorage(
  cacheKey: string,
  operation: "get" | "remove" | "getParsed" | "setStringified",
  value?: any
): string | CacheEntry | undefined | 1 {
  if (!isValidCacheKey(cacheKey) || !isLocalStorageAvailable) return undefined;
  const prefixedKey = `${CACHE_KEY_PREFIX}${cacheKey}`;
  try {
    switch (operation) {
      case "get":
        return localStorage.getItem(prefixedKey) ?? undefined;
      case "remove":
        localStorage.removeItem(prefixedKey);
        return SUCCESS;
      case "setStringified":
        localStorage.setItem(prefixedKey, JSON.stringify(value));
        return SUCCESS;
      case "getParsed":
        const stored = localStorage.getItem(prefixedKey);
        return stored !== null ? JSON.parse(stored) : undefined;
    }
  } catch (error) {
    console.warn(
      `LocalStorage operation "${operation}" failed for key "${prefixedKey}": ${error}`
    );
    return undefined;
  }
}

function isValidTTL(ttl: number | undefined): ttl is number {
  return typeof ttl === "number" && Number.isFinite(ttl) && ttl > 0;
}

/**
 * Estimates the entry size in bytes
 * @param value
 * @returns
 */
function estimateCacheEntrySize(
  cacheEntry: CacheEntry,
  cacheKey: string
): number {
  const bytes = sizeof(cacheEntry);
  if (bytes < 0) {
    console.warn(`Failed to estimate size for cache entry "${cacheKey}"`);
    return 0;
  }
  return bytes;
}

/**
 * Sets the maximum size limit for the in-memory cache in bytes, evicting the least recently used entries when exceeded.
 * @param bytes - Maximum size in bytes (null or <= 0 disables the limit).
 * @param entries - Maximum number of entries (null or <= 0 disables the limit, optional).
 */
function setCacheSizeLimit(
  bytes: number | null,
  entries: number | null = null
) {
  cache.MAX_CACHE_BYTES = bytes !== null && bytes > 0 ? bytes : null;
  cache.MAX_CACHE_ENTRIES = entries !== null && entries > 0 ? entries : null;
}

/**
 * Sets a custom storage implementation or reverts to default memory and localStorage.
 * @param storage - A `CustomCacheStorage` object or `null` to revert to default.
 */
function setCustomStorage(storage: CustomCacheStorage | null) {
  cache.customStorage = storage;
}

/**
 * Manually triggers cleanup of expired cache entries from both custom and memory storage.
 */
function cleanupCache() {
  cache.cleanupFromCustomStorage();
  cache.cleanupFromMemoryStorage();
}

/**
 * Starts periodic cleanup of expired cache entries at the specified interval.
 * @param intervalMs - Interval in milliseconds between cleanups (default: 60000).
 */
function startAutomaticCacheCleanup(
  intervalMs: number = DEFAULT_CLEANUP_INTERVAL_MS
) {
  if (intervalMs <= 0 || isNaN(intervalMs)) return;
  if (cache.cleanupInterval) return;
  cache.cleanupInterval = setInterval(cleanupCache, intervalMs);
}

/**
 * Stops periodic cache cleanup, if active.
 */
function stopAutomaticCacheCleanup() {
  if (cache.cleanupInterval) {
    clearInterval(cache.cleanupInterval);
    cache.cleanupInterval = null;
  }
}

/**
 * Retrieves the current status of the cache system, including entry counts and cleanup state.
 * @returns An object with cache status details, including whether custom storage is used, total entries, persistent entries, expiring entries, and cleanup activity.
 */
function getCacheStatus() {
  const isCleanupActive = cache.cleanupInterval !== null;
  if (cache.customStorage) {
    try {
      const status = cache.customStorage.status?.();
      return {
        isCustomStorage: true,
        entryCount: status?.entryCount,
        persistentCount: status?.persistentCount,
        expirationCount: status?.expirationCount,
        isCleanupActive,
      };
    } catch (error) {
      console.warn(`Failed to retrieve custom storage status: ${error}`);
      return {
        isCustomStorage: true,
        entryCount: undefined,
        persistentCount: undefined,
        expirationCount: undefined,
        isCleanupActive,
      };
    }
  }
  const { persistentCount, expirationCount } =
    cache.getPersistentAndExpirationCount();
  return {
    isCustomStorage: false,
    entryCount: memoryCache.size,
    persistentCount,
    expirationCount,
    isCleanupActive,
  };
}

/**
 * Clears all cache entries, optionally including localStorage.
 * @param options - Configuration options (optional).
 * @param options.clearLocalStorage - If true, clears localStorage entries (default: true).
 */
function clearCache(
  options: { clearLocalStorage?: boolean } = { clearLocalStorage: true }
) {
  cache.clearFromCustomStorage();
  if (!cache.customStorage) {
    if (options.clearLocalStorage && isLocalStorageAvailable) {
      for (const [key] of memoryCache) {
        operateOnLocalStorage(key, "remove");
      }
    }
    memoryCache.clear();
    accessOrder.clear();
    memoryExpirationMap.clear();
    cache.currentCacheBytes = 0;
  }
}

/**
 * Deletes a cache entry based on its key.
 * @internal - Intended for internal use within the EnhancedSuspense package.
 * @param cacheKey - The unique string identifier for the cache entry.
 */
export function deleteCache(cacheKey: string) {
  if (!isValidCacheKey(cacheKey)) return;
  cache.deleteFromCustomStorage(cacheKey);
  if (!cache.customStorage) {
    const cacheEntry = memoryCache.get(cacheKey);
    cache.currentCacheBytes -= cacheEntry
      ? estimateCacheEntrySize(cacheEntry, cacheKey)
      : 0;
    memoryCache.delete(cacheKey);
    accessOrder.delete(cacheKey);
    operateOnLocalStorage(cacheKey, "remove");
    memoryExpirationMap.delete(cacheKey);
  }
}

/**
 * Stores a value in the cache with a key and an optional TTL.
 * @internal - Intended for internal use within the EnhancedSuspense package.
 * @param cacheKey - The unique string identifier for the cache entry.
 * @param value - The value to store (any type).
 * @param ttl - Optional time-to-live in milliseconds.
 * @param persist - If true, stores in localStorage in addition to memory; if false, only in memory (default: false).
 */
export function setCache(
  cacheKey: string,
  value: any,
  ttl?: number,
  persist: boolean = false
) {
  if (!isValidCacheKey(cacheKey)) return;
  cache.setCustomStorage(cacheKey, value, ttl, persist);
  if (!cache.customStorage) {
    const cacheEntry: CacheEntry = {
      value,
      expiry: isValidTTL(ttl) ? Date.now() + ttl! : undefined,
    };
    const cacheEntrySize = estimateCacheEntrySize(cacheEntry, cacheKey);
    cache.freeMemory(cacheKey, cacheEntrySize);
    cache.setMemoryStorage(cacheKey, cacheEntry, cacheEntrySize, ttl, persist);
  }
}

/**
 * Retrieves a value from the cache if it exists and has not expired, prioritizing memory.
 * @internal - Intended for internal use within the EnhancedSuspense package.
 * @param cacheKey - The unique string identifier for the cache entry.
 * @returns The stored value or undefined if not found or expired.
 */
export function getCache(cacheKey: string) {
  if (!isValidCacheKey(cacheKey)) return null;
  return cache.customStorage
    ? cache.getFromCustomStorage(cacheKey)
    : cache.getFromMemoryStorage(cacheKey);
}

type Cache = Readonly<{
  setCacheSizeLimit(bytes: number | null, entries?: number | null): void;
  setCustomStorage(storage: CustomCacheStorage | null): void;
  cleanupCache(): void;
  startAutomaticCacheCleanup(intervalMs?: number): void;
  stopAutomaticCacheCleanup(): void;
  getCacheStatus(): {
    isCustomStorage: boolean;
    entryCount: number | undefined;
    persistentCount: number | undefined;
    expirationCount: number | undefined;
    isCleanupActive: boolean;
  };
  clearCache(options?: { clearLocalStorage?: boolean }): void;
}>;

const cacheAPI: Cache = {
  setCacheSizeLimit,
  setCustomStorage,
  cleanupCache,
  startAutomaticCacheCleanup,
  stopAutomaticCacheCleanup,
  getCacheStatus,
  clearCache,
} as const;

export default cacheAPI;
