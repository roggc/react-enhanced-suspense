"use client";

import { Suspense } from "react";
import type { Usable } from "react";
import ErrorBoundary from "./error-boundary.js";
import Use from "./use.js";
import type { EnhancedSuspenseWithoutRetryProps } from "./types/types.js";
import { useGetErrorKey, useTimeouts } from "./hooks/index.js";

const EnhancedSuspenseWithoutRetryWithTimeouts = <T,>(
  props: EnhancedSuspenseWithoutRetryProps<T>
) => {
  const {
    fallback,
    children: resource,
    onSuccess,
    onError,
    timeouts = [],
    timeoutFallbacks = [],
  } = props;

  const currentStage = useTimeouts(timeouts, resource);

  const content = onSuccess ? (
    <Use
      resource={resource as Usable<T>}
      onSuccess={onSuccess}
      retry={false}
      enhancedResource={undefined}
    />
  ) : (
    resource
  );

  const loadingContent =
    currentStage >= 0 && currentStage < timeoutFallbacks.length
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

export default EnhancedSuspenseWithoutRetryWithTimeouts;
