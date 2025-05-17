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
 * @see https://www.npmjs.com/package/react-enhanced-suspense - Package documentation.
 * @see https://react.dev/reference/react/Suspense - React's Suspense documentation.
 * @example
 * ```tsx
 * "use client";
 *
 * import Suspense from "react-enhanced-suspense";
 *
 * export default function Component() {
 *   return (
 *     <Suspense
 *       retry
 *       retryCount={15}
 *       onRetryFallback={(attempt) => <div>{`Retry ${attempt}...`}</div>}
 *       cache
 *       cacheTTL={2000}
 *       resourceId="my-promise"
 *       onError={(error) => <div>{error.message}</div>}
 *       onSuccess={(value) => value.map((item) => <div key={item}>{item}</div>)}
 *       fallback="Loading..."
 *       timeouts={[1000, 2000, 3000]}
 *       timeoutFallbacks={["Three...", "Two...", "One..."]}
 *     >
 *       {() =>
 *         new Promise<string[]>((resolve, reject) => {
 *           setTimeout(() => {
 *             if (Math.random() > 0.9) {
 *               resolve(["Roger", "Alex"]);
 *             } else {
 *               reject("Fail on data fetching");
 *             }
 *           }, 4000);
 *         })
 *       }
 *     </Suspense>
 *   );
 * }
 * ```
 */
const EnhancedSuspense = <T,>(props: EnhancedSuspenseProps<T>) => {
  const isServerEnvironment = typeof window === "undefined";

  const {
    onError,
    timeouts,
    onSuccess,
    onRetryFallback,
    retryBackoff,
    resourceId,
    children,
    retry,
    cache,
    productionPropsErrorFallback,
  } = props;

  const isClientComponent =
    timeouts ||
    onError ||
    resourceId ||
    retry ||
    cache ||
    typeof children === "function";

  const isFunctionAsProp =
    onSuccess ||
    typeof children === "function" ||
    onRetryFallback ||
    typeof retryBackoff === "function" ||
    onError;

  const usingInvalidCombo =
    isServerEnvironment && isClientComponent && isFunctionAsProp;

  if (usingInvalidCombo) {
    const errorMessage = [
      "🚨⚠️ EnhancedSuspense - Invalid Use Of Props In Server Environment:",
      "Add 'use client' Directive Or Remove Some Props. ⚠️🚨",
    ].join("\n");

    console.error(errorMessage);

    return process.env.NODE_ENV !== "production" ? (
      <ErrorMessage>{errorMessage}</ErrorMessage>
    ) : (
      productionPropsErrorFallback ?? null
    );
  }

  if (isClientComponent) {
    return <ESClientComponent {...props} />;
  }
  // @ts-ignore
  return <ESServerComponent {...props} />;
};

export default EnhancedSuspense;
