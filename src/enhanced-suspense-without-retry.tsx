import { Suspense } from "react";
import type { Usable } from "react";
import ErrorBoundary from "./error-boundary.js";
import Use from "./use.js";
import type { EnhancedSuspenseWithoutRetryProps } from "./types/types.js";
import { useGetErrorKey } from "./hooks/index.js";

const EnhancedSuspenseWithoutRetry = <T,>(
  props: EnhancedSuspenseWithoutRetryProps<T>
) => {
  const { fallback, children: resource, onSuccess, onError } = props;

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

export default EnhancedSuspenseWithoutRetry;
