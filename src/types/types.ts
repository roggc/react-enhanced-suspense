import type { Usable, ReactNode, Context } from "react";

type TimeoutsProps = {
  timeouts?: number[] | undefined;
  timeoutFallbacks?: ReactNode[] | undefined;
};

type NeverTimeoutsProps = {
  timeouts?: never;
  timeoutFallbacks?: never;
};

type CacheProps = {
  cacheKey?: string | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
};

type NeverCacheProps = {
  cacheKey?: never;
  cacheTTL?: never;
  cacheVersion?: never;
  cachePersist?: never;
};

type RetryProps = {
  retry?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  backoff?: boolean | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
};

type NeverRetryProps = {
  retry?: never;
  retryCount?: never;
  retryDelay?: never;
  backoff?: never;
  onRetryFallback?: never;
};

type OnErrorProps = {
  onError?: ((error: Error) => ReactNode) | undefined;
};

type NeverOnErrorProps = {
  onError?: never;
};

type ChildrenWhenOnSuccessProps<T> = {
  children: Usable<T>;
  onSuccess: (data: T) => ReactNode;
};

type ChildrenNoOnSuccessProps = {
  children?: ReactNode | Context<any> | undefined;
  onSuccess?: never;
};

type ESBaseProps = {
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
};

type ESWhenOnSuccessProps<T> = ESBaseProps &
  NeverCacheProps &
  NeverRetryProps &
  NeverOnErrorProps &
  NeverTimeoutsProps &
  ChildrenWhenOnSuccessProps<T>;

type ESNoOnSuccessProps = ESBaseProps &
  NeverCacheProps &
  NeverRetryProps &
  NeverOnErrorProps &
  NeverTimeoutsProps &
  ChildrenNoOnSuccessProps;

export type ESServerComponentProps<T> =
  | ESNoOnSuccessProps
  | ESWhenOnSuccessProps<T>;

export type ESWhenRetryProps<T> = ESBaseProps &
  RetryProps &
  CacheProps &
  TimeoutsProps &
  OnErrorProps & {
    retry: true;
    children: () => Promise<T>;
    onSuccess?: ((data: T) => ReactNode) | undefined;
  };

type ESWhenCacheProps<T> = ESBaseProps &
  NeverRetryProps &
  CacheProps &
  OnErrorProps &
  TimeoutsProps & {
    cacheKey: string;
    children: () => Promise<T>;
    onSuccess?: ((data: T) => ReactNode) | undefined;
  };

type ESWhenTimeoutsNoOnSuccessProps = ESBaseProps &
  NeverRetryProps &
  NeverCacheProps &
  OnErrorProps &
  TimeoutsProps &
  ChildrenNoOnSuccessProps & { timeouts: number[] };

type ESWhenTimeoutsWhenOnSuccessProps<T> = ESBaseProps &
  NeverRetryProps &
  NeverCacheProps &
  OnErrorProps &
  TimeoutsProps &
  ChildrenWhenOnSuccessProps<T> & { timeouts: number[] };

export type ESWhenCacheOrTimeoutsProps<T> =
  | ESWhenTimeoutsNoOnSuccessProps
  | ESWhenTimeoutsWhenOnSuccessProps<T>
  | ESWhenCacheProps<T>;

type ESWhenOnErrorWhenOnSuccessProps<T> = ESBaseProps &
  NeverRetryProps &
  NeverCacheProps &
  NeverTimeoutsProps &
  OnErrorProps &
  ChildrenWhenOnSuccessProps<T> & { onError: (error: Error) => ReactNode };

type ESWhenOnErrorNoOnSuccessProps = ESBaseProps &
  NeverRetryProps &
  NeverCacheProps &
  NeverTimeoutsProps &
  OnErrorProps &
  ChildrenNoOnSuccessProps & { onError: (error: Error) => ReactNode };

export type ESWhenOnErrorProps<T> =
  | ESWhenOnErrorWhenOnSuccessProps<T>
  | ESWhenOnErrorNoOnSuccessProps;

export type EnhancedSuspenseProps<T> =
  | ESWhenRetryProps<T>
  | ESWhenCacheOrTimeoutsProps<T>
  | ESWhenOnErrorProps<T>
  | ESServerComponentProps<T>;

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
