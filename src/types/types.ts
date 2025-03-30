import type { Usable, ReactNode } from "react";

type EnhancedSuspenseBaseProps = {
  fallback?: ReactNode;
  onError?: (error: any) => ReactNode;
  timeouts?: number[];
  timeoutFallbacks?: ReactNode[];
};

export type RetryProps = {
  retry?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  backoff?: boolean | undefined;
  onRetryFallback?: (attempt: number) => ReactNode;
};

type EnhancedSuspenseWithRetryWithPromiseProps<T> = RetryProps & {
  retry: true;
  children: () => Promise<T>;
  onSuccess?: (data: T) => ReactNode;
} & EnhancedSuspenseBaseProps;

type EnhancedSuspenseWithoutRetryWithPromiseProps<T> = {
  retry?: false | undefined;
  children: Usable<T>;
  onSuccess: (data: T) => ReactNode;
} & EnhancedSuspenseBaseProps;

type EnhancedSuspenseWithoutPromiseProps = EnhancedSuspenseBaseProps & {
  children?: ReactNode;
  onSuccess?: undefined;
  retry?: never;
};

export type EnhancedSuspenseWithRetryProps<T> =
  | EnhancedSuspenseWithRetryWithPromiseProps<T>
  | EnhancedSuspenseWithoutPromiseProps;

export type EnhancedSuspenseWithoutRetryProps<T> =
  | EnhancedSuspenseWithoutRetryWithPromiseProps<T>
  | EnhancedSuspenseWithoutPromiseProps;

export type EnhancedSuspenseProps<T> =
  | EnhancedSuspenseWithRetryProps<T>
  | EnhancedSuspenseWithoutRetryProps<T>;

export type UseProps<T> =
  | {
      retry: true;
      resource: () => Promise<T>;
      onSuccess: (data: T) => ReactNode;
      enhancedResource: Promise<T>;
    }
  | {
      retry?: false | undefined;
      resource: Usable<T>;
      onSuccess: (data: T) => ReactNode;
      enhancedResource: undefined;
    };
