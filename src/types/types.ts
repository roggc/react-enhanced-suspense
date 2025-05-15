import type { Usable, ReactNode } from "react";

export type BackoffStrategy =
  | "exponential"
  | "linear"
  | ((attempt: number, retryDelay: number) => number);

type ESServerComponentWithOnSuccessProps<T> = {
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  cache?: false | undefined;
  retry?: false | undefined;
  onError?: undefined;
  timeouts?: undefined;
  resourceId?: undefined;
  children: Usable<T>;
  onSuccess: (data: T) => ReactNode;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?: "exponential" | "linear" | undefined;
  onRetryFallback?: undefined;
};

type ESServerComponentNoOnSuccessProps<T> = {
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?: "exponential" | "linear" | undefined;
  onRetryFallback?: undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  cache?: false | undefined;
  retry?: false | undefined;
  onError?: undefined;
  timeouts?: undefined;
  resourceId?: undefined;
  children?:
    | ReactNode
    | Usable<T extends ReactNode ? T : ReactNode>
    | undefined;
  onSuccess?: undefined;
};

export type ESServerComponentProps<T> =
  | ESServerComponentWithOnSuccessProps<T>
  | ESServerComponentNoOnSuccessProps<T>;

type ESWhenRetryPropsOnSuccess<T> = {
  timeouts?: number[] | undefined;
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
  onError?: ((error: Error) => ReactNode) | undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  resourceId?: string | undefined;
  cache?: false | undefined;
  retry: true;
  resource: () => Promise<T>;
  children?: undefined;
  onSuccess: (data: T) => ReactNode;
};

type ESWhenRetryPropsNoOnSuccess<T> = {
  timeouts?: number[] | undefined;
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
  onError?: ((error: Error) => ReactNode) | undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  resourceId?: string | undefined;
  cache?: false | undefined;
  retry: true;
  resource: () => Promise<T extends ReactNode ? T : ReactNode>;
  onSuccess?: undefined;
  children?: undefined;
};

type ESWhenRetryProps<T> =
  | ESWhenRetryPropsOnSuccess<T>
  | ESWhenRetryPropsNoOnSuccess<T>;

type ESWhenCachePropsOnSuccess<T> = {
  timeouts?: number[] | undefined;
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
  onError?: ((error: Error) => ReactNode) | undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  retry?: false | undefined;
  cache: true;
  resourceId: string;
  resource: () => Promise<T>;
  onSuccess: (data: T) => ReactNode;
  children?: undefined;
};

type ESWhenCachePropsNoOnSuccess<T> = {
  timeouts?: number[] | undefined;
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
  onError?: ((error: Error) => ReactNode) | undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  retry?: false | undefined;
  cache: true;
  resourceId: string;
  resource: () => Promise<T extends ReactNode ? T : ReactNode>;
  onSuccess?: undefined;
  children?: undefined;
};

type ESWhenCacheProps<T> =
  | ESWhenCachePropsOnSuccess<T>
  | ESWhenCachePropsNoOnSuccess<T>;

type ESWhenRetryAndCachePropsOnSuccess<T> = {
  timeouts?: number[] | undefined;
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
  onError?: ((error: Error) => ReactNode) | undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  cache: true;
  resourceId: string;
  retry: true;
  resource: () => Promise<T>;
  onSuccess: (data: T) => ReactNode;
  children?: undefined;
};

type ESWhenRetryAndCachePropsNoOnSuccess<T> = {
  timeouts?: number[] | undefined;
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
  onError?: ((error: Error) => ReactNode) | undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  cache: true;
  resourceId: string;
  retry: true;
  resource: () => Promise<T extends ReactNode ? T : ReactNode>;
  onSuccess?: undefined;
  children?: undefined;
};

type ESWhenRetryAndCacheProps<T> =
  | ESWhenRetryAndCachePropsOnSuccess<T>
  | ESWhenRetryAndCachePropsNoOnSuccess<T>;

type ESWhenTimeoutsNoOnSuccessProps<T> = {
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
  onError?: ((error: Error) => ReactNode) | undefined;
  children?:
    | ReactNode
    | Usable<T extends ReactNode ? T : ReactNode>
    | undefined;
  onSuccess?: undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  resourceId?: string | undefined;
  retry?: false | undefined;
  cache?: false | undefined;
  timeouts: number[];
  resource?: undefined;
};

type ESWhenTimeoutsWhenOnSuccessProps<T> = {
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
  onError?: ((error: Error) => ReactNode) | undefined;
  children: Usable<T>;
  onSuccess: (data: T) => ReactNode;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  resourceId?: string | undefined;
  timeouts: number[];
  retry?: false | undefined;
  cache?: false | undefined;
  resource?: undefined;
};

type ESWhenTimeoutsProps<T> =
  | ESWhenTimeoutsNoOnSuccessProps<T>
  | ESWhenTimeoutsWhenOnSuccessProps<T>;

type ESWhenOnErrorWhenOnSuccessProps<T> = {
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
  children: Usable<T>;
  onSuccess: (data: T) => ReactNode;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  resourceId?: string | undefined;
  timeouts?: undefined;
  onError: (error: Error) => ReactNode;
  retry?: false | undefined;
  cache?: false | undefined;
  resource?: undefined;
};

type ESWhenOnErrorNoOnSuccessProps<T> = {
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
  children?:
    | ReactNode
    | Usable<T extends ReactNode ? T : ReactNode>
    | undefined;
  onSuccess?: undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  resourceId?: string | undefined;
  timeouts?: undefined;
  onError: (error: Error) => ReactNode;
  retry?: false | undefined;
  cache?: false | undefined;
  resource?: undefined;
};

type ESWhenOnErrorProps<T> =
  | ESWhenOnErrorWhenOnSuccessProps<T>
  | ESWhenOnErrorNoOnSuccessProps<T>;

export type ESClientComponentProps<T> =
  | ESWhenCacheProps<T>
  | ESWhenRetryProps<T>
  | ESWhenRetryAndCacheProps<T>
  | ESWhenTimeoutsProps<T>
  | ESWhenOnErrorProps<T>;

export type EnhancedSuspenseProps<T> =
  | ESClientComponentProps<T>
  | ESServerComponentProps<T>;

export type UseProps<T> = {
  onSuccess: (data: T) => ReactNode;
  resource: Usable<T>;
};
