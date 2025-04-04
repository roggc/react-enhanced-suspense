import { Suspense } from "react";
import type { ReactNode, Usable } from "react";
import ErrorBoundary from "./error-boundary.js";
import Use from "./use.js";
import type { EnhancedSuspenseServerProps } from "./types/types.js";
import { useGetErrorKey } from "./hooks/index.js";

const EnhancedSuspenseWithoutRetry = <T,>(
  props: EnhancedSuspenseServerProps<T>
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

  const wrappedContent = (
    <Suspense fallback={fallback}>{content as ReactNode}</Suspense>
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

export default EnhancedSuspenseWithoutRetry;
