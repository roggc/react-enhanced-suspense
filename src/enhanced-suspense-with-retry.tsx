"use client";

import { Suspense, useMemo } from "react";
import type { ReactNode, Usable } from "react";
import ErrorBoundary from "./error-boundary.js";
import Use from "./use.js";
import { useGetErrorKey, useRetryablePromise } from "./hooks/index.js";
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
    ...retryProps
  } = props;
  const { retry, retryCount, retryDelay, backoff } = retryProps as RetryProps;
  const normalizedResource = useMemo(
    () =>
      retry ? (resource as () => Promise<T>) : () => resource as Promise<T>,
    [retry, resource]
  );
  const enhancedResource = useRetryablePromise(
    normalizedResource,
    retry,
    retryCount,
    retryDelay,
    backoff
  );

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

  const wrappedContent = <Suspense fallback={fallback}>{content}</Suspense>;

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
