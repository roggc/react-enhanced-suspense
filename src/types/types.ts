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
  cache?: boolean | undefined;
  retry?: boolean | undefined;
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
  cache?: boolean | undefined;
  retry?: boolean | undefined;
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

type ESClientComponentWithOnSuccessProps<T> = {
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  cache?: boolean | undefined;
  retry?: boolean | undefined;
  onError?: ((error: Error) => ReactNode) | undefined;
  timeouts?: number[] | undefined;
  resourceId?: string | undefined;
  children?: (() => Promise<T>) | Usable<T> | undefined;
  onSuccess: (data: T) => ReactNode;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
};

type ESClientComponentNoOnSuccessProps<T> = {
  timeoutFallbacks?: ReactNode[] | undefined;
  cacheTTL?: number | undefined;
  cacheVersion?: number | undefined;
  cachePersist?: boolean | undefined;
  fallback?: ReactNode | undefined;
  productionPropsErrorFallback?: ReactNode | undefined;
  cache?: boolean | undefined;
  retry?: boolean | undefined;
  onError?: ((error: Error) => ReactNode) | undefined;
  timeouts?: number[] | undefined;
  resourceId?: string | undefined;
  children?:
    | ReactNode
    | Usable<T extends ReactNode ? T : ReactNode>
    | (() => Promise<T extends ReactNode ? T : ReactNode>)
    | undefined;
  onSuccess?: undefined;
  retryCount?: number | undefined;
  retryDelay?: number | undefined;
  retryBackoff?:
    | "exponential"
    | "linear"
    | ((attempt: number, retryDelay: number) => number)
    | undefined;
  onRetryFallback?: ((attempt: number) => ReactNode) | undefined;
};

export type ESClientComponentProps<T> =
  | ESClientComponentWithOnSuccessProps<T>
  | ESClientComponentNoOnSuccessProps<T>;

export type EnhancedSuspenseProps<T> =
  | ESClientComponentProps<T>
  | ESServerComponentProps<T>;

export type UseProps<T> = {
  onSuccess: (data: T) => ReactNode;
  resource: Usable<T>;
};
