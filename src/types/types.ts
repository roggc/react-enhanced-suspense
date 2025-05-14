import type { Usable, ReactNode } from "react";

type TimeoutsProps = {
  timeouts?: number[] | undefined;
  timeoutFallbacks?: ReactNode[] | undefined;
};

type CacheProps = {
  cache?: boolean | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
};

export type BackoffStrategy =
  | "exponential"
  | "linear"
  | ((attempt: number, retryDelay: number) => number);

type RetryProps = {
  retry?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
};

type OnErrorProps = {
  onError?: ((error: Error) => ReactNode) | undefined;
};

type ChildrenWhenOnSuccessProps<T> = {
  children: Usable<T>;
  onSuccess: (data: T) => ReactNode;
};

type ChildrenNoOnSuccessProps = {
  children?: ReactNode | Usable<ReactNode> | undefined;
  onSuccess?: never;
};

type ESBaseProps = {
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  resourceId?: string | undefined;
};

type ESServerComponentWithOnSuccessProps<T> = ESBaseProps &
  CacheProps &
  RetryProps &
  OnErrorProps &
  TimeoutsProps &
  ChildrenWhenOnSuccessProps<T> & {
    cache?: false | undefined;
    retry?: false | undefined;
    onError?: undefined;
    timeouts?: undefined;
    resourceId?: undefined;
  };

type ESServerComponentNoOnSuccessProps = ESBaseProps &
  CacheProps &
  RetryProps &
  OnErrorProps &
  TimeoutsProps &
  ChildrenNoOnSuccessProps & {
    cache?: false | undefined;
    retry?: false | undefined;
    onError?: undefined;
    timeouts?: undefined;
    resourceId?: undefined;
  };

export type ESServerComponentProps<T> =
  | ESServerComponentNoOnSuccessProps
  | ESServerComponentWithOnSuccessProps<T>;

type ESWhenRetryProps<T> = ESBaseProps &
  RetryProps &
  CacheProps &
  TimeoutsProps &
  OnErrorProps & {
    cache?: false | undefined;
    retry: true;
    children: () => Promise<T>;
    onSuccess?: ((data: T) => ReactNode) | undefined;
  };

type ESWhenCacheProps<T> = ESBaseProps &
  CacheProps &
  RetryProps &
  TimeoutsProps &
  OnErrorProps & {
    retry?: false | undefined;
    cache: true;
    resourceId: string;
    children: () => Promise<T>;
    onSuccess?: ((data: T) => ReactNode) | undefined;
  };

type ESWhenRetryAndCacheProps<T> = ESBaseProps &
  RetryProps &
  CacheProps &
  TimeoutsProps &
  OnErrorProps & {
    cache: true;
    resourceId: string;
    retry: true;
    children: () => Promise<T>;
    onSuccess?: ((data: T) => ReactNode) | undefined;
  };

type ESWhenTimeoutsNoOnSuccessProps = ESBaseProps &
  RetryProps &
  CacheProps &
  OnErrorProps &
  TimeoutsProps &
  ChildrenNoOnSuccessProps & {
    retry?: false | undefined;
    cache?: false | undefined;
    timeouts: number[];
  };

type ESWhenTimeoutsWhenOnSuccessProps<T> = ESBaseProps &
  RetryProps &
  CacheProps &
  OnErrorProps &
  TimeoutsProps &
  ChildrenWhenOnSuccessProps<T> & {
    timeouts: number[];
    retry?: false | undefined;
    cache?: false | undefined;
  };

type ESWhenTimeoutsProps<T> =
  | ESWhenTimeoutsNoOnSuccessProps
  | ESWhenTimeoutsWhenOnSuccessProps<T>;

type ESWhenOnErrorWhenOnSuccessProps<T> = ESBaseProps &
  RetryProps &
  CacheProps &
  TimeoutsProps &
  OnErrorProps &
  ChildrenWhenOnSuccessProps<T> & {
    timeouts?: undefined;
    onError: (error: Error) => ReactNode;
    retry?: false | undefined;
    cache?: false | undefined;
  };

type ESWhenOnErrorNoOnSuccessProps = ESBaseProps &
  RetryProps &
  CacheProps &
  TimeoutsProps &
  OnErrorProps &
  ChildrenNoOnSuccessProps & {
    timeouts?: undefined;
    onError: (error: Error) => ReactNode;
    retry?: false | undefined;
    cache?: false | undefined;
  };

type ESWhenOnErrorProps<T> =
  | ESWhenOnErrorWhenOnSuccessProps<T>
  | ESWhenOnErrorNoOnSuccessProps;

export type ESClientComponentProps<T> =
  | ESWhenCacheProps<T>
  | ESWhenRetryProps<T>
  | ESWhenRetryAndCacheProps<T>
  | ESWhenTimeoutsProps<T>
  | ESWhenOnErrorProps<T>;

export type EnhancedSuspenseProps<T> =
  | ESServerComponentProps<T>
  | ESClientComponentProps<T>;

export type UseProps<T> = {
  onSuccess: (data: T) => ReactNode;
  resource: Promise<T>;
};
