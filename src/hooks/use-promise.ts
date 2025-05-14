import { useEffect, useMemo, useRef, useState } from "react";
import { setCache, getCache, deleteCache } from "../cache/cache.js";
import type { BackoffStrategy } from "../types/types.js";
import type { CacheEntry } from "../cache/cache.js";

export function usePromise<T>(
  resource: () => Promise<T>,
  retry: boolean = false,
  retryCount: number = 1,
  retryDelay: number = 0,
  retryBackoff?: BackoffStrategy,
  cache: boolean = false,
  cacheTTL?: number,
  cacheVersion?: number,
  cachePersist?: boolean,
  resourceId?: string
): [Promise<T>, number] {
  const cacheKey = cache ? resourceId : undefined;
  const previousCacheVersionRef = useRef(cacheVersion);
  const previousCachePersistRef = useRef(cachePersist);
  const previousCacheTTLRef = useRef(cacheTTL);
  const [isCancelled, setIsCancelled] = useState({
    value: false,
    key: 0,
  });
  const cacheEntryRef = useRef<CacheEntry | null>(
    cacheKey ? getCache(cacheKey) : null
  );
  const [attempt, setAttempt] = useState(0);
  const [currentPromise, setCurrentPromise] = useState<
    Promise<T | undefined> | undefined
  >(undefined);

  useMemo(() => {
    if (cacheKey && previousCacheVersionRef.current !== cacheVersion) {
      deleteCache(cacheKey);
      cacheEntryRef.current = null;
    }
  }, [cacheVersion, cacheKey]);

  useEffect(() => {
    if (!cacheKey) return;
    if (
      cachePersist !== previousCachePersistRef.current ||
      cacheTTL !== previousCacheTTLRef.current
    ) {
      const cacheEntry = getCache(cacheKey);
      if (cacheEntry?.value !== undefined) {
        deleteCache(cacheKey);
        setCache(cacheKey, cacheEntry.value, cacheTTL, cachePersist);
        cacheEntryRef.current = getCache(cacheKey);
      }
    }
    previousCachePersistRef.current = cachePersist;
    previousCacheTTLRef.current = cacheTTL;
    previousCacheVersionRef.current = cacheVersion;
  }, [cachePersist, cacheTTL, cacheVersion, cacheKey]);

  const getPromiseWithRetry = async () => {
    let attempts = 0;
    while (attempts <= retryCount) {
      try {
        if (!isCancelled.value) {
          setAttempt(attempts);
        }
        const result = await resource();
        if (isCancelled.value) {
          return result;
        }
        if (cacheKey) {
          setCache(cacheKey, result, cacheTTL, cachePersist);
          if (!isCancelled.value) {
            cacheEntryRef.current = getCache(cacheKey);
          }
        }
        return result;
      } catch (error) {
        if (isCancelled.value) {
          return;
        }
        if (attempts < retryCount) {
          const delay =
            retryBackoff === "exponential"
              ? retryDelay * Math.pow(2, attempts)
              : retryBackoff === "linear"
              ? retryDelay * (attempts + 1)
              : typeof retryBackoff === "function"
              ? retryBackoff(attempts, retryDelay)
              : retryDelay;

          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
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

  const getPromise = () => {
    if (cacheKey && cacheEntryRef.current) {
      if (
        cacheEntryRef.current.isValid
          ? cacheEntryRef.current.isValid()
          : cacheEntryRef.current.expiry === undefined ||
            Date.now() <= cacheEntryRef.current.expiry
      ) {
        if (currentPromise) {
          return currentPromise;
        }
        const promise = Promise.resolve(cacheEntryRef.current.value);
        setCurrentPromise(promise);
        return promise;
      } else {
        setCurrentPromise(undefined);
        cacheEntryRef.current = null;
      }
    }

    if (currentPromise) {
      return currentPromise;
    }

    const promise = retry
      ? getPromiseWithRetry()
      : cacheKey
      ? resource().then(
          (result) => {
            setCache(cacheKey, result, cacheTTL, cachePersist);
            cacheEntryRef.current = getCache(cacheKey);
            return result;
          },
          (error) => {
            throw error;
          }
        )
      : resource();

    setCurrentPromise(promise);
    return promise;
  };

  const [isMounted, setIsMounted] = useState(false);
  const isCancellAllowedRef = useRef(false);
  const [isSetCancellAllowedAllowed, setIsSetCancellAllowedAllowed] =
    useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsSetCancellAllowedAllowed(true);
    return () => {
      if (isSetCancellAllowedAllowed) isCancellAllowedRef.current = true;
    };
  }, [isSetCancellAllowedAllowed]);

  useEffect(() => {
    if (!isMounted) return;
    isCancellAllowedRef.current = true;
    setCurrentPromise(undefined);
    setAttempt(0);
  }, [
    cacheKey,
    cacheVersion,
    cacheTTL,
    cachePersist,
    retry,
    retryCount,
    retryDelay,
    retryBackoff,
    resourceId,
  ]);

  useEffect(() => {
    setIsCancelled((cV) => ({ value: false, key: cV.key + 1 }));

    return () => {
      if (isCancellAllowedRef.current) isCancelled.value = true;
    };
  }, [currentPromise]);

  return [getPromise(), attempt];
}
