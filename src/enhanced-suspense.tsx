import type { EnhancedSuspenseProps } from "./types/types.js";
import EnhancedSuspenseWithRetry from "./enhanced-suspense-with-retry.js";
import EnhancedSuspenseWithoutRetry from "./enhanced-suspense-without-retry.js";
import EnhancedSuspenseWithoutRetryClient from "./enhanced-suspense-without-retry-client.js";

/**
 * Enhances React's `Suspense` with optional resource resolved values handling, error handling, retry functionality, and caching.
 *
 * Matches React's `Suspense` when no enhancements are used.
 *
 * With `onSuccess`, restricts `children` to a `Usable` resource (e.g., `Promise` or `Context`, resolved via `use`) and transforms the value.
 *
 * With `onError`, wraps React's `Suspense` in an `ErrorBoundary` for custom error rendering.
 *
 * With `retry` set to `true`, enables retry logic for failed promises, turning the component into a Client Component;
 *
 * @template T - The type of the resolved value from the resource (promise or React Context).
 * @param {EnhancedSuspenseProps<T>} props - The component props.
 * @param {ReactNode} [props.fallback] - Fallback UI shown while a resource is pending (same as React's `Suspense`).
 * @param {Usable<T> | (() => Promise<T>) | ReactNode} [props.children] - The resource or content to render.
 *   - Any `ReactNode` (same as React's `Suspense`) if `onSuccess` is not provided and `retry` is `false` or omitted.
 *   - A `Usable<T>` (e.g., `Promise<T>` or `Context<T>`) if `onSuccess` is provided and `retry` is `false` or omitted.
 *   - A function `() => Promise<T>` if `retry` is `true`.
 * @param {(data: T) => ReactNode} [props.onSuccess] - Optional callback to transform the resolved value of a usable resource.
 * @param {(error: Error) => ReactNode} [props.onError] - Optional callback to render errors (rejected values of promises are normalized to Error instances).
 * @param {boolean} [props.retry] - Enables retry logic for failed promises when set to `true` (makes it a Client Component). Defaults to `false`.
 * @param {number} [props.retryCount] - Number of retry attempts (default: `1`). Only applies when `retry` is `true`.
 * @param {number} [props.retryDelay] - Delay in milliseconds between retries (default: `0`). Only applies when `retry` is `true`.
 * @param {boolean} [props.backoff] - Enables exponential backoff for retries (default: `false`). Only applies when `retry` is `true`.
 * @param {(attempt: number) => ReactNode} [props.onRetryFallback] - Fallback UI shown on each retry attempt. Only applies when `retry` is `true`.
 * @param {number []} [props.timeouts] - Array of timeouts when to show timeout fallbacks (makes it a Client Component).
 * @param {ReactNode []} [props.timeoutFallbacks] - Fallbacks UI to show on each timeout specified in `timeouts`. Only applies when `timeouts` it's not an empty array.
 * @param {string} [props.cacheKey] - Unique key for caching the promise result (optional). Enables caching when provided.
 * @param {number} [props.cacheTTL] - Time-to-live for the cached result in milliseconds (optional). Only applies when `cacheKey` is provided.
 * @param {number} [props.cacheVersion] - Version of the cache (optional). The cache is cleared immediately when this value changes compared to the previous version (e.g., 0 to 1, 1 to 0, or any different value). Only applies when `cacheKey` is provided.
 * @param {boolean} [props.cachePersist] - Enables persistence of the cache in `localStorage` when set to `true` (default: `false`). Only applies when `cacheKey` is provided. Allows the cached result to persist across page reloads or component unmounts, synchronizing with `localStorage` dynamically if changed.
 * @returns {ReactNode} The enhanced suspense component.
 * @see https://www.npmjs.com/package/react-enhanced-suspense - Package documentation.
 * @see https://react.dev/reference/react/Suspense - React's Suspense documentation.
 * @example
 * ```tsx
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
 * @example With retry functionality (Client Component)
 * ```tsx
 * "use client";
 *
 * import Suspense from "react-enhanced-suspense";
 * import { useState } from "react";
 *
 * export default function SayHelloRetry() {
 * const [retryKey, setRetryKey] = useState(0);
 *
 *   return (
 *     <>
 *       <div>Hey</div>
 *       <div>
 *         <Suspense
 *           key={retryKey}
 *           fallback={<div>Loading...</div>}
 *           onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
 *           onError={(error) => (
 *             <div>
 *               <div>{error.message}</div>
 *               <button onClick={() => setRetryKey(k => k + 1)}>
 *                 Retry
 *               </button>
 *             </div>
 *           )}
 *           retry
 *           retryCount={3}
 *           retryDelay={1000}
 *           backoff
 *           onRetryFallback={(attempt) => <div>{`Retrying ${attempt}...`}</div>}
 *         >
 *           {() =>
 *             new Promise<string[]>((resolve, reject) => {
 *               setTimeout(() => {
 *                 if (Math.random() > 0.5) {
 *                   resolve(["Roger", "Alex"]);
 *                 } else {
 *                   reject("Fail on data fetching");
 *                 }
 *               }, 1000);
 *             })
 *           }
 *         </Suspense>
 *       </div>
 *     </>
 *   );
 * }
 * ```
 * @example With cacheKey (Client Component)
 * ```tsx
 * "use client";
 *
 * import Suspense from "react-enhanced-suspense";
 * import {useState} from "react";
 *
 * export default function SayHello({ promise }: { promise: Promise<string[]> }) {
 *   const [cacheVersion, setCacheVersion] = useState(0);
 *   const [cachePersist, setCachePersist] = useState(false);
 *
 *   return (
 *     <>
 *       <div>Hey</div>
 *       <button onClick={() => setCacheVersion(cchV => cchV + 1)}>Increase cacheVersion</button>
 *       <button onClick={() => setCachePersist(cchP => !cchP)}>Toggle cachePersist</button>
 *       <div>
 *         <Suspense
 *           fallback={<div>Loading...</div>}
 *           onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
 *           onError={(error) => <div>{error.message}</div>}
 *           cacheKey="hello"
 *           cacheTTL={60000}
 *           cacheVersion={cacheVersion}
 *           cachePersist={cachePersist}
 *         >
 *           {promise}
 *         </Suspense>
 *       </div>
 *     </>
 *   );
 * }
 * ```
 */
const EnhancedSuspense = <T,>(props: EnhancedSuspenseProps<T>) => {
  return props.retry ? (
    <EnhancedSuspenseWithRetry {...props} />
  ) : props.timeouts || props.cacheKey !== undefined ? (
    <EnhancedSuspenseWithoutRetryClient {...props} />
  ) : (
    <EnhancedSuspenseWithoutRetry {...props} />
  );
};

export default EnhancedSuspense;
