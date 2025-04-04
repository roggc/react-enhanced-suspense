"use client";

import { Suspense, useMemo } from "react";
import type { ReactNode, Usable } from "react";
import ErrorBoundary from "./error-boundary.js";
import Use from "./use.js";
import type { EnhancedSuspenseNoRetryClientProps } from "./types/types.js";
import { useGetErrorKey, useTimeouts, useCache } from "./hooks/index.js";

const EnhancedSuspenseWithoutRetryClient = <T,>(
  props: EnhancedSuspenseNoRetryClientProps<T>
) => {
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
  } = props;

  const currentStage = useTimeouts(timeouts);
  const normalizedResource = useMemo(
    () =>
      cacheKey ? (resource as () => Promise<T>) : () => resource as Promise<T>,
    [cacheKey, resource]
  );
  const enhancedResource = useCache(
    normalizedResource,
    cacheKey,
    cacheTTL,
    cacheVersion,
    cachePersist
  );

  const content = onSuccess ? (
    <Use
      resource={enhancedResource as Usable<T>}
      onSuccess={onSuccess}
      retry={false}
      enhancedResource={undefined}
    />
  ) : (
    enhancedResource
  );

  const loadingContent =
    currentStage >= 0 && currentStage < timeoutFallbacks.length
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

export default EnhancedSuspenseWithoutRetryClient;
