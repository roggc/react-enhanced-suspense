import type { EnhancedSuspenseProps } from "./types/types.js";
import ESServerComponent from "./e-s-server-component.js";
import ESClientComponent from "./e-s-client-component.js";
import type { ReactNode } from "react";

const ErrorMessage = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      color: "#ff0000",
      padding: "1rem",
      border: "2px solid #ff0000",
      backgroundColor: "#fff0f0",
      borderRadius: "4px",
      fontFamily: "monospace",
    }}
  >
    {children}
  </div>
);

/**
 * Enhances React's `Suspense` with optional resource resolved values handling, error handling, retry functionality, caching, and timeout fallbacks.
 *
 * Matches React's `Suspense` when no enhancements are used.
 *
 * With `onSuccess`, restricts `children` to a `Usable` resource (e.g., `Promise` or `Context`, resolved via `use`) and transforms the value.
 *
 * With `onError`, wraps React's `Suspense` in an `ErrorBoundary` for custom error rendering. Only use it in Client Environment.
 *
 * With `retry` set to `true`, enables retry functionality for failed promises. Only use it in Client Environment.
 *
 * With `cacheKey`, enables caching of the promise result. Only use it in Client Environment.
 *
 * With `timeouts`, enables timeout fallbacks for the resource.
 *
 * The combination of `timeouts` and `onSuccess` is not allowed in the Server Environment.
 *
 * @template T - The type of the resolved value from the resource (promise or React Context; `children` prop).
 * @param {EnhancedSuspenseProps<T>} props - The component props.
 * @param {ReactNode} [props.fallback] - Fallback UI shown while a resource is pending (same as React's `Suspense`).
 * @param {Usable<T> | (() => Promise<T>) | ReactNode} [props.children] - The resource or content to render.
 *   - Any `ReactNode` (same as React's `Suspense`) if `onSuccess`, `retry`, and `cacheKey` are not used.
 *   - A `Usable<T>` (e.g., `Promise<T>` or `Context<T>`) if `onSuccess` is provided and `retry` and `cacheKey` are not used.
 *   - A function `() => Promise<T>` if `retry` or `cacheKey` (or both) are used.
 * @param {(data: T) => ReactNode} [props.onSuccess] - Optional callback to transform the resolved value of a usable resource.
 * @param {(error: Error) => ReactNode} [props.onError] - Optional callback to render errors (rejected values of promises are normalized to Error instances). Only use it in Client Environment.
 * @param {boolean} [props.retry] - Enables retry functionality for failed promises when set to `true`. Defaults to `false`. Only use it in Client Environment.
 * @param {number} [props.retryCount] - Number of retry attempts (default: `1`). Only applies when `retry` is `true`.
 * @param {number} [props.retryDelay] - Delay in milliseconds between retries (default: `0`). Only applies when `retry` is `true`.
 * @param {boolean} [props.retryBackoff] - Applies a backoff strategy between retries. Can be `"linear"`, `"exponential"` or a function. If a function, the first parameter it's the attempt index (starting at zero) and the second parameter it's the `retryDelay`; the returned value must be a number (`(attempt: number, retrayDelay: number) => number`). Only applies when `retry` is `true`.
 * @param {(attempt: number) => ReactNode} [props.onRetryFallback] - Fallback UI shown on each retry attempt. Only applies when `retry` is `true`.
 * @param {number []} [props.timeouts] - Array of timeouts when to show timeout fallbacks.
 * @param {ReactNode []} [props.timeoutFallbacks] - Fallbacks UI to show on each timeout specified in `timeouts`. Only applies when `timeouts` is used.
 * @param {string} [props.cacheKey] - Unique key for caching the promise result (optional). Enables caching when provided. Only use it in Client Environment.
 * @param {number} [props.cacheTTL] - Time-to-live for the cached result in milliseconds (optional). Only applies when `cacheKey` is provided.
 * @param {number} [props.cacheVersion] - Version of the cache (optional). The cache is cleared immediately when this value changes compared to the previous version (e.g., 0 to 1, 1 to 0, or any different value). Only applies when `cacheKey` is provided.
 * @param {boolean} [props.cachePersist] - Enables persistence of the cache in `localStorage` when set to `true` (default: `false`). Only applies when `cacheKey` is provided. Allows the cached result to persist across page reloads or component unmounts, synchronizing with `localStorage` dynamically if changed.
 * @returns {ReactNode} The enhanced suspense component.
 * @see https://www.npmjs.com/package/react-enhanced-suspense - Package documentation.
 * @see https://react.dev/reference/react/Suspense - React's Suspense documentation.
 * @example
 * ```tsx
 * "use client";
 *
 * import Suspense from "react-enhanced-suspense";
 *
 * export default function Component({ promise }: { promise: Promise<string[]> }) {
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
 * @example With `retry` functionality
 * ```tsx
 * "use client";
 *
 * import Suspense from "react-enhanced-suspense";
 * import { useState } from "react";
 *
 * export default function Retry() {
 * const [key, setKey] = useState(0);
 *
 *   return (
 *     <>
 *       <div>Hey</div>
 *       <div>
 *         <Suspense
 *           key={key}
 *           fallback={<div>Loading...</div>}
 *           onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
 *           onError={(error) => (
 *             <div>
 *               <div>{error.message}</div>
 *               <button onClick={() => setKey(k => k + 1)}>
 *                 Remount
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
 * @example With `cacheKey`
 * ```tsx
 * "use client";
 *
 * import Suspense from "react-enhanced-suspense";
 * import {useState} from "react";
 *
 * export default function Cache() {
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
 *           {() =>
 *             new Promise<string[]>((resolve) => {
 *               setTimeout(() => {resolve(["Roger", "Alex"]);}, 3000);
 *             })
 *           }
 *         </Suspense>
 *       </div>
 *     </>
 *   );
 * }
 * ```
 */
const EnhancedSuspense = <T,>(props: EnhancedSuspenseProps<T>) => {
  const isServer = typeof window === "undefined";

  const {
    retry,
    cache,
    onError,
    timeouts,
    onSuccess,
    productionPropsErrorFallback,
  } = props;

  const usingInvalidCombo =
    isServer && (retry || cache || onError || (timeouts && onSuccess));

  if (usingInvalidCombo) {
    const errorLines = [];

    if (retry)
      errorLines.push("❌ 'retry' prop cannot be used in server environment.");
    if (cache)
      errorLines.push(
        "❌ 'cacheKey' prop cannot be used in server environment."
      );
    if (onError)
      errorLines.push(
        "❌ 'onError' prop cannot be used in server environment."
      );
    if (timeouts && onSuccess)
      errorLines.push(
        "❌ 'timeouts' prop and 'onSuccess' prop cannot be used together in server environment."
      );

    const errorMessage = [
      "🚨⚠️ EnhancedSuspense - Invalid Props In Server Environment:",
      ...errorLines,
      "Solution: Add 'use client' directive or remove some props. ⚠️🚨",
    ].join("\n");

    console.error(errorMessage);

    return process.env.NODE_ENV !== "production" ? (
      <ErrorMessage>{errorMessage}</ErrorMessage>
    ) : (
      productionPropsErrorFallback ?? null
    );
  }

  if (cache || retry || timeouts || onError)
    return <ESClientComponent {...props} />;
  return <ESServerComponent {...props} />;
};

export default EnhancedSuspense;
