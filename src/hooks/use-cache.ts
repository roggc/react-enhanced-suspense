import { useEffect, useMemo, useRef } from "react";
import {
  clearCache,
  getCache,
  setCache,
  clearLocalStorageOnly,
  setLocalStorageOnly,
} from "../cache/cache.js";

/**
 * A hook to cache the result of a promise.
 * @param resource - The promise-returning function to execute.
 * @param cacheKey - Unique key for caching the result (optional).
 * @param cacheTTL - Time-to-live for the cached result in milliseconds (optional).
 * @param cacheVersion - Version of the cache. The cache is cleared immediately when this value changes compared to the previous version (e.g., 0 to 1, 1 to 0, or any different value).
 * @param cachePersist - If true, persists the cache in localStorage; if false, only uses memory (default: false).
 * @returns The cached or fresh promise result.
 */
export function useCache<T>(
  resource: () => Promise<T>,
  cacheKey?: string,
  cacheTTL?: number,
  cacheVersion?: number,
  cachePersist?: boolean
): Promise<T> {
  const previousCacheVersionRef = useRef(cacheVersion);
  const previousCachePersistRef = useRef(cachePersist);

  useMemo(() => {
    if (cacheKey && previousCacheVersionRef.current !== cacheVersion) {
      clearCache(cacheKey);
    }
  }, [cacheVersion, cacheKey]);

  const promiseWithCache = useMemo(() => {
    if (cacheKey) {
      const cachedResult = getCache(cacheKey);
      if (cachedResult !== undefined) {
        return Promise.resolve(cachedResult);
      }
      return resource().then((result) => {
        setCache(cacheKey, result, cacheTTL, cachePersist);
        return result;
      });
    }
  }, [cacheKey, cacheTTL, cachePersist, resource]);

  useEffect(() => {
    previousCacheVersionRef.current = cacheVersion;
  }, [cacheVersion]);

  useEffect(() => {
    if (cacheKey && cachePersist !== previousCachePersistRef.current) {
      cachePersist
        ? setLocalStorageOnly(cacheKey)
        : clearLocalStorageOnly(cacheKey);
    }
    previousCachePersistRef.current = cachePersist;
  }, [cacheKey, cachePersist]);

  return promiseWithCache ?? resource();
}
