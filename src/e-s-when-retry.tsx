"use client";

import { Suspense } from "react";
import type { ReactNode } from "react";
import ErrorBoundary from "./error-boundary.js";
import Use from "./use.js";
import {
  useGetErrorKey,
  useRetryablePromise,
  useTimeouts,
} from "./hooks/index.js";
import type { ESWhenRetryProps } from "./types/types.js";

const EnhancedSuspenseWhenRetry = <T,>(props: ESWhenRetryProps<T>) => {
  const {
    fallback,
    children: resource,
    onSuccess,
    onError,
    timeouts = [],
    timeoutFallbacks = [],
    cacheKey,
    cacheTTL,
    cacheVersion,
    cachePersist,
    ...rest
  } = props;
  const { retryCount, retryDelay, backoff, onRetryFallback } = rest;

  const [enhancedResource, attempt] = useRetryablePromise(
    resource,
    retryCount,
    retryDelay,
    backoff,
    cacheKey,
    cacheTTL,
    cacheVersion,
    cachePersist
  );

  const currentStage = useTimeouts(timeouts);

  const content = onSuccess ? (
    <Use
      resource={resource}
      onSuccess={onSuccess}
      retry
      enhancedResource={enhancedResource as Promise<T>}
    />
  ) : (
    (enhancedResource as ReactNode)
  );

  const loadingContent =
    onRetryFallback && attempt > 0
      ? onRetryFallback(attempt)
      : currentStage >= 0 && currentStage < timeoutFallbacks.length
      ? timeoutFallbacks[currentStage]
      : fallback;

  const wrappedContent = (
    <Suspense fallback={loadingContent}>{content}</Suspense>
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

export default EnhancedSuspenseWhenRetry;
