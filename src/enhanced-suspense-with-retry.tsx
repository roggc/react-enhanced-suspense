"use client";

import { Suspense, useMemo } from "react";
import type { ReactNode, Usable } from "react";
import ErrorBoundary from "./error-boundary.js";
import Use from "./use.js";
import {
  useGetErrorKey,
  useRetryablePromise,
  useTimeouts,
} from "./hooks/index.js";
import type {
  EnhancedSuspenseWithRetryProps,
  RetryProps,
} from "./types/types.js";

const EnhancedSuspenseWithRetry = <T,>(
  props: EnhancedSuspenseWithRetryProps<T>
) => {
  const {
    fallback,
    children: resource,
    onSuccess,
    onError,
    timeouts = [],
    timeoutFallbacks = [],
    ...retryProps
  } = props;
  const { retry, retryCount, retryDelay, backoff, onRetryFallback } =
    retryProps as RetryProps;

  const normalizedResource = useMemo(
    () =>
      retry ? (resource as () => Promise<T>) : () => resource as Promise<T>,
    [retry, resource]
  );

  const [enhancedResource, attempt] = useRetryablePromise(
    normalizedResource,
    retry,
    retryCount,
    retryDelay,
    backoff
  );

  const currentStage = useTimeouts(timeouts, enhancedResource ?? resource);

  const content = onSuccess ? (
    retry ? (
      <Use
        resource={resource as () => Promise<T>}
        onSuccess={onSuccess}
        retry={true}
        enhancedResource={enhancedResource as Promise<T>}
      />
    ) : (
      <Use
        resource={resource as unknown as Usable<T>}
        onSuccess={onSuccess}
        retry={false}
        enhancedResource={undefined}
      />
    )
  ) : retry ? (
    (enhancedResource as ReactNode)
  ) : (
    (resource as ReactNode)
  );

  const loadingContent =
    retry && onRetryFallback && attempt > 0
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

export default EnhancedSuspenseWithRetry;
