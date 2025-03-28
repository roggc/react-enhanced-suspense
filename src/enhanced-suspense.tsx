import { ReactNode, Suspense, use } from "react";
import type { Usable } from "react";
import ErrorBoundary from "./error-boundary.js";

interface EnhancedSuspenseBaseProps {
  fallback?: ReactNode;
  onError?: (error: any) => ReactNode;
}

interface EnhancedSuspenseWithPromiseProps<T>
  extends EnhancedSuspenseBaseProps {
  children: Usable<T>;
  onSuccess: (data: T) => ReactNode;
}

interface EnhancedSuspenseWithoutPromiseProps
  extends EnhancedSuspenseBaseProps {
  children?: ReactNode;
  onSuccess?: undefined;
}

type EnhancedSuspenseProps<T> =
  | EnhancedSuspenseWithPromiseProps<T>
  | EnhancedSuspenseWithoutPromiseProps;

/** Resolves a usable resource with `use` and applies `onSuccess`. */
const Use = <T,>({
  resource,
  onSuccess,
}: {
  resource: Usable<T>;
  onSuccess: (data: T) => ReactNode;
}) => {
  const data = use(resource);
  return onSuccess(data);
};

/**
 * Enhances React's `Suspense` with optional resource resolution and error handling.
 *
 * Matches React's `SuspenseProps` for `fallback` and `children` when no enhancements are used.
 * With `onSuccess`, restricts `children` to a `Usable` resource (e.g., `Promise` or `Context`, resolved via `use`) and transforms the value.
 * With `onError`, wraps `Suspense` in an `ErrorBoundary` for custom error rendering.
 *
 * @template T - The type of the resolved value from the resource.
 * @param {EnhancedSuspenseProps<T>} props - The component props.
 * @param {ReactNode} [props.fallback] - Fallback UI shown while a promise is pending (same as `Suspense`).
 * @param {Usable<T> | ReactNode} [props.children] - The content to render. Must be a `Usable` (e.g., `Promise` or `Context`) if `onSuccess` is provided; otherwise, any `ReactNode` (same as `Suspense`).
 * @param {(data: T) => ReactNode} [props.onSuccess] - Optional callback to transform the resolved value of a usable resource.
 * @param {(error: any) => ReactNode} [props.onError] - Optional callback to render errors or rejected values. Typically an `Error`, but may be any value (e.g., `string`) for immediately rejected promises like `Promise.reject("string")`.
 * @returns {ReactNode} The enhanced suspense component, optionally wrapped in an error boundary.
 * @see https://www.npmjs.com/package/react-enhanced-suspense - Package documentation.
 * @see https://react.dev/reference/react/Suspense - React Suspense documentation.
 * @example
 * ```tsx
 * // src/components/say-hello.tsx
 * "use client";
 *
 * import Suspense from "react-enhanced-suspense";
 *
 * export default function SayHello({ promise }: { promise: Promise<string[]> }) {
 *   return (
 *     <>
 *       <div>Hey</div>
 *       <div>
 *         <Suspense
 *           fallback={<div>Loading...</div>}
 *           onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
 *           onError={(error) => <div>{error.message}</div>}
 *         >
 *           {promise}
 *         </Suspense>
 *       </div>
 *     </>
 *   );
 * }
 * ```
 */
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

  const wrappedContent = <Suspense fallback={fallback}>{content}</Suspense>;

  return onError ? (
    <ErrorBoundary onError={onError}>{wrappedContent}</ErrorBoundary>
  ) : (
    wrappedContent
  );
};

export default EnhancedSuspense;
