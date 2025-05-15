import { useEffect, useState } from "react";
import { ESClientComponentProps } from "../types/types.js";

export function useGetErrorKey<T>({
  onSuccess,
  onError,
  fallback,
  timeouts = [],
  timeoutFallbacks = [],
  cache,
  cacheTTL,
  cacheVersion,
  cachePersist,
  retry,
  retryCount,
  retryDelay,
  retryBackoff,
  children,
  resource,
  resourceId,
  onRetryFallback,
}: ESClientComponentProps<T>) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [
    cache,
    cacheTTL,
    cacheVersion,
    cachePersist,
    retry,
    retryCount,
    retryDelay,
    // retryBackoff,
    resourceId,
    // resource,
    // timeouts,
    // timeoutFallbacks,
    // fallback,
    // onSuccess,
    // onError,
    // onRetryFallback,
  ]);

  return key;
}
