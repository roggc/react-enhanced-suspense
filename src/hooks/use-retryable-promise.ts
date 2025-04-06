import { useEffect, useMemo, useRef, useState } from "react";
import {
  clearCache,
  clearLocalStorageOnly,
  getCache,
  setCache,
  setLocalStorageOnly,
} from "../cache/cache.js";

/**
 * A hook to execute a promise with retry logic and optional caching.
 * @param resource - The promise-returning function to execute.
 * @param retryCount - Number of retries (default: 1).
 * @param retryDelay - Base delay between retries in milliseconds (default: 0).
 * @param backoff - If true, applies exponential backoff (delay = retryDelay * 2^attempts); if false, uses fixed delay (default: false).
 * @param cacheKey - Unique key for caching the result (optional).
 * @param cacheTTL - Time-to-live for the cached result in milliseconds (optional).
 * @param cacheVersion - Version of the cache. The cache is cleared immediately when this value changes compared to the previous version (e.g., 0 to 1, 1 to 0, or any different value).
 * @param cachePersist - If true, persists the cache in localStorage; if false, only uses memory (default: false).
 * @returns A tuple with the promise result (or undefined if retry is false) and the current attempt number.
 */
export function useRetryablePromise<T>(
  resource: () => Promise<T>,
  retryCount: number = 1,
  retryDelay: number = 0,
  backoff: boolean = false,
  cacheKey?: string,
  cacheTTL?: number,
  cacheVersion?: number,
  cachePersist?: boolean
): [Promise<T> | undefined, number] {
  const [promiseCache] = useState(new Map<() => Promise<T>, Promise<T>>());
  const [isCancelled, setIsCancelled] = useState({
    value: false,
  });
  const [timers, setTimers] = useState<{ value: NodeJS.Timeout[] }>({
    value: [],
  });
  const cancelRef = useRef<() => void>(() => {});
  const [attempt, setAttempt] = useState(0);
  const previousCacheVersionRef = useRef(cacheVersion);
  const previousCachePersistRef = useRef(cachePersist);

  useMemo(() => {
    if (cacheKey && previousCacheVersionRef.current !== cacheVersion) {
      clearCache(cacheKey);
    }
  }, [cacheVersion, cacheKey]);

  const cachedResult = cacheKey ? getCache(cacheKey) : undefined;

  useMemo(() => {
    const executeWithRetry = async () => {
      if (cachedResult !== undefined) {
        setAttempt(0);
        return cachedResult;
      }

      let attempts = 0;
      while (attempts <= retryCount) {
        if (isCancelled.value) {
          return;
        }
        try {
          setAttempt(attempts);
          const result = await resource();
          if (isCancelled.value) {
            return;
          }
          if (cacheKey) {
            setCache(cacheKey, result, cacheTTL, cachePersist);
          }
          return result;
        } catch (error) {
          if (attempts < retryCount) {
            const delay = backoff
              ? retryDelay * Math.pow(2, attempts)
              : retryDelay;

            if (delay > 0) {
              await new Promise((resolve) => {
                const timer = setTimeout(resolve, delay);
                timers.value.push(timer);
              });
            }
          } else {
            throw error;
          }
        } finally {
          attempts++;
        }
      }
      throw new Error("This should never happen");
    };

    cancelRef.current = () => {
      isCancelled.value = true;
      timers.value.forEach(clearTimeout);
      timers.value = [];
      promiseCache.clear();
    };

    if (!promiseCache.has(resource)) {
      promiseCache.set(resource, executeWithRetry());
    }
  }, [
    isCancelled,
    timers,
    resource,
    retryCount,
    retryDelay,
    backoff,
    cacheKey,
    cacheTTL,
    cachePersist,
    cachedResult,
  ]);

  useEffect(() => {
    setIsCancelled({ value: false });
    setTimers({ value: [] });

    return () => {
      cancelRef.current();
    };
  }, [
    resource,
    retryCount,
    retryDelay,
    backoff,
    cacheKey,
    cacheTTL,
    cacheVersion,
    cachePersist,
  ]);

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

  const enhancedResource =
    cachedResult !== undefined
      ? Promise.resolve(cachedResult)
      : promiseCache.get(resource);

  return [enhancedResource, attempt];
}
