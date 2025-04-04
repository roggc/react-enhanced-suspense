# react-enhanced-suspense

A React 19 component that extends React's `Suspense` with optional powerful features like promise resolved values handling (`onSuccess`), error handling (`onError`), retry functionality of failing promises (`retry`), caching (`cacheKey`), and timeout fallbacks (`timeouts`).

## Installation

To install the package, run:

```bash
npm i react-enhanced-suspense
```

## Usage

You can import the component in two ways:

- **Named import**: Use this if you prefer explicit names:

  ```typescript
  import { EnhancedSuspense } from "react-enhanced-suspense";
  ```

- **Default import**: Use this for a shorter, more familiar syntax (like React’s `Suspense`):

  ```typescript
  import Suspense from "react-enhanced-suspense";
  ```

Both are the same component under the hood. Pick the one that suits your project!

This component can be used as a substitute for React's `Suspense` and adds enhanced features like promise resolution handling, error handling, retry logic, caching, and more.

## Key Features

- **Promise Resolution Handling**: Use `onSuccess` to transform resolved promise or React Context values.

- **Error Handling**: Use `onError` to wrap React's `Suspense` in an `ErrorBoundary` for custom error rendering.

- **Retry Logic**: Automatically retry failed promises with `retry`, configurable with `retryCount`, `retryDelay`, `backoff`, and `onRetryFallback`.

- **Caching**: Store promise results in memory or `localStorage` with `cacheKey`, `cacheTTL`, `cacheVersion`, and `cachePersist`.

- **Timeout Fallbacks**: Update the fallback UI dynamically with `timeouts` and `timeoutFallbacks` for long-running operations.

## Basic Example

Replace React’s `Suspense` with `EnhancedSuspense`:

```typescript
import { use } from "react";
import { EnhancedSuspense } from "react-enhanced-suspense";

const Use = ({ promise }: { promise: Promise<string[]> | undefined }) => {
  const data = use(promise);
  return data.map((item) => <div key={item}>{item}</div>);
};

export default function SayHello({ promise }: { promise: Promise<string[]> }) {
  return (
    <>
      <div>hey</div>
      <div>
        <EnhancedSuspense fallback="Loading...">
          <Use promise={promise} />
        </EnhancedSuspense>
      </div>
    </>
  );
}
```

When only `fallback` and `children` are used, `EnhancedSuspense` behaves exactly like React’s `Suspense`.

## Promise Resolution Handling With `onSuccess`

```typescript
import { EnhancedSuspense } from "react-enhanced-suspense";

export default function SayHello({ promise }: { promise: Promise<string[]> }) {
  return (
    <>
      <div>hey</div>
      <div>
        <EnhancedSuspense
          fallback="Loading..."
          onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
        >
          {promise}
        </EnhancedSuspense>
      </div>
    </>
  );
}
```

`onSuccess` leverages React’s `use` hook to resolve the promise and transform the result.

## Error Handling With `onError`

Handle errors with a custom UI using `onError`:

```typescript
import { EnhancedSuspense } from "react-enhanced-suspense";

export default function Component() {
  return (
    <EnhancedSuspense onError={(error) => <div>{error.message}</div>}>
      {Promise.reject("Failed")}
    </EnhancedSuspense>
  );
}
```

The `onError` prop wraps React's `Suspense` in an `ErrorBoundary` component for custom error rendering.

## React Context Example

`EnhancedSuspense` also supports React Context as a Usable resource:

```typescript
"use client";

import { EnhancedSuspense } from "react-enhanced-suspense";
import { createContext } from "react";

const MyContext = createContext("Default value");

export default function ShowContext() {
  return (
    <EnhancedSuspense onSuccess={(value) => <div>Context value: {value}</div>}>
      {MyContext}
    </EnhancedSuspense>
  );
}
```

This renders `Context value: Default value` because React’s `use` accepts both promises and React Contexts.

## Retry Logic (Client Component)

Retry failed promises with configurable options:

```typescript
"use client";

import { EnhancedSuspense } from "react-enhanced-suspense";
import { useState } from "react";

export default function SayHello() {
  const [key, setKey] = useState(0);

  return (
    <>
      <div>hey</div>
      <div>
        <EnhancedSuspense
          key={key}
          retry
          retryCount={10}
          retryDelay={500}
          backoff
          onRetryFallback={(attempt) => <div>{`Retrying ${attempt}...`}</div>}
          onError={(error) => (
            <div>
              <div>{error.message}</div>
              <button onClick={() => setKey((k) => k + 1)}>Remount</button>
            </div>
          )}
          onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
        >
          {() =>
            new Promise<string[]>((resolve, reject) => {
              setTimeout(() => {
                if (Math.random() > 0.7) {
                  resolve(["Roger", "Alex"]);
                } else {
                  reject("Fail on data fetching");
                }
              }, 1000);
            })
          }
          {/* Must be a function returning a promise when retry is true */}
        </EnhancedSuspense>
      </div>
    </>
  );
}
```

- **Note**: When `retry` is `true`, `children` must be a function returning a promise (`() => Promise<T>`).

## Caching (Cient Component)

Cache promise results with `cacheKey`:

```typescript
"use client";

import Suspense from "react-enhanced-suspense";
import { useState } from "react";

export default function Cache() {
  const [key, setKey] = useState(0);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [cachePersist, setCachePersist] = useState(false);

  return (
    <>
      <button onClick={() => setKey((k) => k + 1)}>Remount</button>
      <button onClick={() => setCacheVersion((cchV) => cchV + 1)}>
        increase cache version
      </button>
      <button onClick={() => setCacheVersion((cchV) => cchV - 1)}>
        decrease cache version
      </button>
      <button onClick={() => setCachePersist((cchP) => !cchP)}>
        toggle persist cache
      </button>
      <Suspense
        cacheKey="my-cache"
        cacheTTL={60000}
        cacheVersion={cacheVersion}
        cachePersist={cachePersist}
        key={key}
        fallback="Loading..."
        onError={(error) => <div>{error.message}</div>}
        onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
      >
        {() =>
          new Promise<string[]>((resolve, reject) => {
            setTimeout(() => {
              if (Math.random() > 0.2) {
                resolve(["Roger", "Alex"]);
              } else {
                reject("Fail on data fetching");
              }
            }, 1000);
          })
        }
      </Suspense>
    </>
  );
}
```

- `cacheTTL`: Sets expiration time (ms).

- `cacheVersion`: Invalidates cache when changed.

- `cachePersist`: Persists cache in `localStorage`.

- **Note**: When `cacheKey` is used, `children` must be a function returning a promise (`() => Promise<T>`).

## Timeout Fallbacks (Client Component)

Update fallback UI for long-running operations:

```typescript
"use client";

import Suspense from "react-enhanced-suspense";
import { useState } from "react";

const VERY_LONG_TIME = 15000;

export default function Timeouts({}) {
  const [key, setKey] = useState(0);

  return (
    <>
      <Suspense
        key={key}
        fallback="Loading..."
        timeouts={[3000, 6000, 10000]}
        timeoutFallbacks={[
          "Still working...",
          "Taking longer...",
          <button onClick={() => setKey((k) => k + 1)}>Remount</button>,
        ]}
      >
        {
          new Promise<string>((resolve) =>
            setTimeout(() => resolve("Done"), VERY_LONG_TIME)
          )
        }
      </Suspense>
    </>
  );
}
```

## Props

All props are optional:

- **`onSuccess`**: A function that takes the resolved value of a resource (promise or React Context) and returns a `ReactNode`.

- **`onError`**: A function that takes an `Error` and returns a `ReactNode`.

- **`children`**: Any `ReactNode` (same as React’s `Suspense`). Must be:

  - A `Usable<T>` (e.g., `Promise<T>` or `Context<T>`) when `onSuccess` is provided and no `retry` or `cacheKey` are used.

  - A function `() => Promise<T>` when `retry` or `cacheKey` (or both) are used.

- **`fallback`**: Any `ReactNode` (same as React’s `Suspense`).

- **`retry`**: Boolean. Set to `true` to enable retry logic (makes it a Client Component). Defaults to `false`.

- **`retryCount`**: Number of retry attempts (default: `1`). Only applies when `retry` is `true`.

- **`retryDelay`**: Delay in milliseconds between retries (default: `0`). Only applies when `retry` is `true`.

- **`backoff`**: Boolean. Enables exponential backoff for retries (default: `false`). Only applies when `retry` is `true`.

- **`onRetryFallback`**: A function `(attempt: number) => ReactNode`. Fallback UI to be shown on each retry attempt. Only applies when `retry` is `true`.

- **`cacheKey`**: A string. Saves the resolved value of a promise into a memory cache (makes it a Client Component).

- **`cacheTTL`**: A number. Sets an expiration time in milliseconds for the cached value. Only applies when `cacheKey` is used.

- **`cacheVersion`**: A number. Invalidates previous cached value when it's increased or decreased (changed). Only applies when `cacheKey` is used.

- **`cachePersist`**: A boolean. When `true` it persists the cached value into `localStorage`. Only applies when `cacheKey` is used.

- **`timeouts`**: An array of numbers. Timeouts in milliseconds to update fallback UI shown (makes it a Client Component). Only applies when `onRetryFallback` is not used.

- **`timeoutFallbacks`**: An array of React Nodes (`ReactNode []`). Fallback UI's to show after each timeout specified in `timeouts`. Only applies when `timeouts` is not an empty array.

Refer to [React documentation](https://react.dev/reference/react/Suspense#props) for `children` and `fallback` props.

All props can be used toguether.

## Requirements

- React 19+: Uses the `use` hook for promise/Context resolution.

## License

MIT
