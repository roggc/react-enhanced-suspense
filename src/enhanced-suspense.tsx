import { JSX, ReactNode, Suspense, use } from "react";
import ErrorBoundary from "./error-boundary.js";

type EnhancedSuspenseProps<T> = {
  fallback?: ReactNode;
  children?: Promise<T> | JSX.Element | undefined | string;
  onSuccess?: ((data: T) => ReactNode) | undefined;
  onError?: (error: Error) => ReactNode;
};

const Use = <T,>({
  promise,
  onSuccess,
}: {
  promise?: Promise<T> | JSX.Element | string;
  onSuccess?: ((data: T) => ReactNode) | undefined;
}) => {
  if (!promise) return null;
  if (
    typeof promise === "string" ||
    ("props" in promise && "type" in promise)
  ) {
    return promise;
  }
  const data = use(promise);
  return onSuccess ? onSuccess(data) : (data as ReactNode);
};

const EnhancedSuspense = <T,>({
  fallback = "Loading...",
  children: promise,
  onSuccess,
  onError,
}: EnhancedSuspenseProps<T>) => {
  return (
    <ErrorBoundary onError={onError}>
      <Suspense fallback={fallback}>
        <Use promise={promise} onSuccess={onSuccess} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default EnhancedSuspense;
