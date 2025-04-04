import type { Usable, ReactNode, Context } from "react";

type EnhancedSuspenseBaseProps = {
  fallback?: ReactNode;
  onError?: (error: Error) => ReactNode;
};

type TimeoutsProps = {
  timeouts?: number[];
  timeoutFallbacks?: ReactNode[];
};

type CacheProps = {
  cacheKey?: string | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
};

export type RetryProps = {
  retry?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  backoff?: boolean | undefined;
  onRetryFallback?: (attempt: number) => ReactNode;
};

type EnhancedSuspenseWithRetryProps<T> = EnhancedSuspenseBaseProps &
  RetryProps &
  CacheProps &
  TimeoutsProps & {
    retry: true;
    children: () => Promise<T>;
    onSuccess?: (data: T) => ReactNode;
  };

type EnhancedSuspenseNoRetryWithCacheProps<T> = EnhancedSuspenseBaseProps &
  CacheProps &
  TimeoutsProps & {
    retry?: false | undefined;
    children: () => Promise<T>;
    onSuccess?: (data: T) => ReactNode;
    cacheKey: string;
  };

type EnhancedSuspenseNoRetryNoCacheWithTimeoutsWithOnSuccessProps<T> =
  EnhancedSuspenseBaseProps &
    TimeoutsProps & {
      retry?: false | undefined;
      children: Usable<T>;
      onSuccess: (data: T) => ReactNode;
      cacheKey?: never;
      cacheTTL?: never;
      cacheVersion?: never;
      cachePersist?: never;
      timeouts: number[];
    };

type EnhancedSuspenseNoRetryNoCacheWithTimeoutsNoOnSuccessProps =
  EnhancedSuspenseBaseProps &
    TimeoutsProps & {
      retry?: false | undefined;
      children: ReactNode | Context<any>;
      onSuccess?: undefined;
      cacheKey?: never;
      cacheTTL?: never;
      cacheVersion?: never;
      cachePersist?: never;
      timeouts: number[];
    };

type EnhancedSuspenseNoRetryNoCacheNoTimeoutsWithOnSuccessProps<T> =
  EnhancedSuspenseBaseProps & {
    retry?: false | undefined;
    children: Usable<T>;
    onSuccess: (data: T) => ReactNode;
    cacheKey?: never;
    cacheTTL?: never;
    cacheVersion?: never;
    cachePersist?: never;
    timeouts?: never;
    timeoutFallbacks?: never;
  };

type EnhancedSuspenseNoRetryNoCacheNoTimeoutsNoOnSuccessProps =
  EnhancedSuspenseBaseProps & {
    children?: ReactNode | Context<any>;
    onSuccess?: undefined;
    retry?: false | undefined;
    cacheKey?: never;
    cacheTTL?: never;
    cacheVersion?: never;
    cachePersist?: never;
    timeouts?: never;
    timeoutFallbacks?: never;
  };

export type EnhancedSuspenseServerProps<T> =
  | EnhancedSuspenseNoRetryNoCacheNoTimeoutsWithOnSuccessProps<T>
  | EnhancedSuspenseNoRetryNoCacheNoTimeoutsNoOnSuccessProps;

export type EnhancedSuspenseNoRetryClientProps<T> =
  | EnhancedSuspenseNoRetryNoCacheWithTimeoutsNoOnSuccessProps
  | EnhancedSuspenseNoRetryNoCacheWithTimeoutsWithOnSuccessProps<T>
  | EnhancedSuspenseNoRetryWithCacheProps<T>;

export type EnhancedSuspenseWithRetryClientProps<T> =
  EnhancedSuspenseWithRetryProps<T>;

export type EnhancedSuspenseProps<T> =
  | EnhancedSuspenseWithRetryClientProps<T>
  | EnhancedSuspenseNoRetryClientProps<T>
  | EnhancedSuspenseServerProps<T>;

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
