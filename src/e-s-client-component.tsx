"use client";

import { Suspense, useMemo } from "react";
import type { ReactNode } from "react";
import ErrorBoundary from "./error-boundary.js";
import Use from "./use.js";
import { useGetErrorKey, usePromise, useTimeouts } from "./hooks/index.js";
import type { ESClientComponentProps } from "./types/types.js";

const ESClientComponent = <T,>(props: ESClientComponentProps<T>) => {
  const {
    fallback,
    children,
    resource,
    resourceId,
    onSuccess,
    onError,
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
    onRetryFallback,
  } = props;

  const normalizedResource = useMemo(
    () => (cache || retry ? resource : () => children),
    [cache, retry, resource, children]
  );

  const [promise, attempt] = usePromise(
    normalizedResource as () => Promise<T>,
    retry,
    retryCount,
    retryDelay,
    retryBackoff,
    cache,
    cacheTTL,
    cacheVersion,
    cachePersist,
    resourceId
  );

  const currentStage = useTimeouts(timeouts);

  const content = onSuccess ? (
    <Use onSuccess={onSuccess} resource={promise} />
  ) : (
    promise
  );

  const loadingContent =
    onRetryFallback && attempt > 0
      ? onRetryFallback(attempt)
      : currentStage >= 0 && currentStage < timeoutFallbacks.length
      ? timeoutFallbacks[currentStage]
      : fallback;

  const wrappedContent = (
    <Suspense fallback={loadingContent}>{content as ReactNode}</Suspense>
  );

  const errorKey = useGetErrorKey<T>(props);

  return onError ? (
    <ErrorBoundary key={errorKey} onError={onError}>
      {wrappedContent}
    </ErrorBoundary>
  ) : (
    wrappedContent
  );
};

export default ESClientComponent;
