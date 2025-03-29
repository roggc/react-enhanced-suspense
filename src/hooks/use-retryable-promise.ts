import { useEffect, useMemo, useRef, useState } from "react";

/**
 * A hook to execute a promise with retry logic.
 * @param resource - The promise-returning function to execute.
 * @param retry - Whether to enable retries (default: false).
 * @param retryCount - Number of retries (default: 1).
 * @param retryDelay - Base delay between retries in milliseconds (default: 0).
 * @param backoff - If true, applies exponential backoff (delay = retryDelay * 2^attempts); if false, uses fixed delay (default: false).
 * @returns The promise result or undefined if retry is false.
 */
export function useRetryablePromise<T>(
  resource: () => Promise<T>,
  retry: boolean = false,
  retryCount: number = 1,
  retryDelay: number = 0,
  backoff: boolean = false
): Promise<T> | undefined {
  const [promiseCache] = useState(new Map<() => Promise<T>, Promise<T>>());
  const [isCancelled, setIsCancelled] = useState({
    value: false,
  });
  const [timers, setTimers] = useState<{ value: NodeJS.Timeout[] }>({
    value: [],
  });
  const cancelRef = useRef<() => void>(() => {});

  useMemo(() => {
    const executeWithRetry = async () => {
      let attempts = 0;
      while (attempts <= retryCount) {
        if (isCancelled.value) {
          throw new Error("Cancelled");
        }
        try {
          console.log("Attempt", attempts);
          return await resource();
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

    if (retry && !promiseCache.has(resource)) {
      promiseCache.set(resource, executeWithRetry());
    }
  }, [isCancelled, timers, retry, resource, retryCount, retryDelay, backoff]);

  useEffect(() => {
    setIsCancelled({ value: false });
    setTimers({ value: [] });

    return () => {
      cancelRef.current();
    };
  }, [resource, retryCount, retryDelay, retry, backoff]);

  return retry ? promiseCache.get(resource) : undefined;
}
