import { ReactNode, Suspense, use, Context } from "react";
import ErrorBoundary from "./error-boundary.js";

interface EnhancedSuspenseBaseProps {
  fallback?: ReactNode;
  onError?: (error: any) => ReactNode;
}

interface EnhancedSuspenseWithPromiseProps<T>
  extends EnhancedSuspenseBaseProps {
  children: Promise<T> | Context<T>;
  onSuccess: (data: T) => ReactNode;
}

interface EnhancedSuspenseWithoutPromiseProps
  extends EnhancedSuspenseBaseProps {
  children: ReactNode;
  onSuccess?: undefined;
}

type EnhancedSuspenseProps<T> =
  | EnhancedSuspenseWithPromiseProps<T>
  | EnhancedSuspenseWithoutPromiseProps;

const Use = <T,>({
  resource,
  onSuccess,
}: {
  resource: Promise<T> | React.Context<T>;
  onSuccess: (data: T) => ReactNode;
}) => {
  const data = use(resource);
  return onSuccess(data);
};

const EnhancedSuspense = <T,>({
  fallback,
  children: resource,
  onSuccess,
  onError,
}: EnhancedSuspenseProps<T>) => {
  const content = onSuccess ? (
    <Use resource={resource} onSuccess={onSuccess} />
  ) : (
    resource
  );

  return onError ? (
    <ErrorBoundary onError={onError}>
      <Suspense fallback={fallback}>{content}</Suspense>
    </ErrorBoundary>
  ) : (
    <Suspense fallback={fallback}>{content}</Suspense>
  );
};

export default EnhancedSuspense;
