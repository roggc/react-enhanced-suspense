# react-enhanced-suspense

A React 19 component that enhances React's `Suspense` with optional features like promise resolved values handling (`onSuccess`), error handling (`onError`), retry functionality of failing promises (`retry`), caching (`cacheKey`), and timeout fallbacks (`timeouts`).

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

This component can be used as a substitute for React's `Suspense`.

## Key Features

- **Promise Resolution Handling**: Use `onSuccess` to transform resolved promise or React Context values.

- **Error Handling**: Use `onError` to wrap React's `Suspense` in an `ErrorBoundary` for custom error rendering.

- **Retry Logic**: Automatically retry failed promises with `retry`, configurable with `retryCount`, `retryDelay`, `backoff`, and `onRetryFallback`.

- **Caching**: Store promise results in memory or `localStorage` with `cacheKey`, `cacheTTL`, `cacheVersion`, and `cachePersist`.

- **Timeout Fallbacks**: Update the fallback UI dynamically with `timeouts` and `timeoutFallbacks` for long-running operations.

- **React's `Suspense`**: This component it's React's `Suspense` when only `fallback` or `children` props are used.

## Promise Resolution Handling With `onSuccess`

```typescript
import Suspense from "react-enhanced-suspense";

export default function OnSuccess({ promise }: { promise: Promise<string[]> }) {
  return (
    <>
      <div>hey</div>
      <div>
        <Suspense
          fallback="Loading..."
          onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
        >
          {promise}
        </Suspense>
      </div>
    </>
  );
}
```

## Error Handling With `onError` (Only In Client Environment)

```typescript
"use client";

import Suspense from "react-enhanced-suspense";

export default function OnError() {
  return (
    <Suspense onError={(error) => <div>{error.message}</div>}>
      {Promise.reject("Failed")}
    </Suspense>
  );
}
```

The `onError` prop wraps React's `Suspense` in an `ErrorBoundary` component for custom error rendering.

## React Context Example

`EnhancedSuspense` also supports React `Context` as a `Usable` resource (`children`):

```typescript
"use client";

import Suspense from "react-enhanced-suspense";
import { createContext } from "react";

const MyContext = createContext("Default value");

export default function Context() {
  return (
    <Suspense onSuccess={(value) => <div>Context value: {value}</div>}>
      {MyContext}
    </Suspense>
  );
}
```

This renders `Context value: Default value` because React’s `use` accepts both promises and React Contexts.

You can also do:

```typescript
"use client";

import Suspense from "react-enhanced-suspense";
import { createContext } from "react";

const MyContext = createContext("Default value");

export default function Context() {
  return <Suspense>{MyContext}</Suspense>;
}
```

if you don't need to transform the resolved value of the React's `Context`. This is also works in React's `Suspense`, but it gives a Typescript error. In `EnhancedSuspense` this Typescript error is fixed.

## Retry Functionality (Only In Client Environment)

With `EnhancedSuspense` you can retry failed promises with configurable options:

```typescript
"use client";

import Suspense from "react-enhanced-suspense";
import { useState } from "react";

export default function Retry() {
  const [key, setKey] = useState(0);

  return (
    <>
      <div>Hey</div>
      <Suspense
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
        {/* 'children' must be a function returning a promise when 'retry' is true */}
      </Suspense>
    </>
  );
}
```

- **Note**: When `retry` is `true`, `children` must be a function returning a promise (`() => Promise<T>`).

## Caching (Only In Client Environment)

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
        Change cacheVersion
      </button>
      <button onClick={() => setCachePersist((cchP) => !cchP)}>
        Toggle cachePersist
      </button>
      <Suspense
        key={key}
        cacheKey="my-cache-key"
        cacheTTL={60000} // expiration time in ms for the cache
        cacheVersion={cacheVersion} // when this changes, invalidates cache
        cachePersist={cachePersist} // whether to persist cache in localStorage
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
        {/* 'children' must be a function returning a promise when 'cacheKey' is used */}
      </Suspense>
    </>
  );
}
```

- `cacheTTL`: Sets expiration time (ms).

- `cacheVersion`: Invalidates cache when changed.

- `cachePersist`: Persists cache in `localStorage`.

- **Note**: When `cacheKey` is used, `children` must be a function returning a promise (`() => Promise<T>`).

## Timeout Fallbacks

Update fallback UI for long-running operations:

```typescript
import Suspense from "react-enhanced-suspense";
import { useState } from "react";

const VERY_LONG_TIME = 15000;

export default function Timeouts() {
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

## Invalid Combination Of Props When Used In Server Environment

`EnhancedSuspense`, when used in Server environment, **cannot have** this props:

- **`retry`**

- **`cacheKey`**

- **`onError`**

- **`timeouts`+`onSuccess`**

The reason is because functions cannot be serialized and passed to the Client. If you use any of this props in Server Environment, `EnhancedSuspense` will not `throw` an `Error`. Instead, it will render a message in development informing about the bad combination of props and how to fix it. In production, it will render nothing or `productionPropsErrorFallback` if provided.

Examples of valid and invalid uses of `EnhancedSuspense` in **Server Environment** are:

```typescript
import Suspense from "react-enhanced-suspense";

export default function InServer() {
  const promise = new Promise<string>((resolve) =>
    setTimeout(() => resolve("Hello From Server"), 15000)
  );

  return (
    <>
      {/* fallback + children: ✅ React's Suspense */}
      <Suspense fallback="Loading...">{promise}</Suspense>
      {/* onSuccess: ✅ React Server Component */}
      <Suspense fallback="Loading..." onSuccess={(data) => <div>{data}</div>}>
        {promise}
      </Suspense>
      {/* timeouts: ✅ React Client Component */}
      <Suspense
        fallback="Loading"
        timeouts={[3000, 6000, 10000]}
        timeoutFallbacks={[
          <div>Timeout 1</div>,
          <div>Timeout 2</div>,
          <div>Timeout 3</div>,
        ]}
      >
        {promise}
      </Suspense>
      {/* timeouts + onSuccess: ❌ BAD (React Client Component + Function) */}
      <Suspense
        fallback="Loading"
        timeouts={[3000, 6000, 10000]}
        timeoutFallbacks={[
          <div>Timeout 1</div>,
          <div>Timeout 2</div>,
          <div>Timeout 3</div>,
        ]}
        onSuccess={(data) => <div>{data}</div>}
      >
        {promise}
      </Suspense>
      {/* retry: ❌ BAD (React Client Component + Function) */}
      <Suspense retry>{() => promise}</Suspense>
      {/* cacheKey: ❌ BAD (React Client Component + Function) */}
      <Suspense cacheKey="my-cache-key">{() => promise}</Suspense>
      {/* onError: ❌ BAD (React Client Component + Function) */}
      <Suspense onError={(error) => <div>{error.message}</div>}>
        {promise}
      </Suspense>
    </>
  );
}
```

If you want to render a fallback in production in case of bad combination of props in Server Environment you can use `productionPropsErrorFallback`:

```typescript
import Suspense from "../lib";

const ProductionPropsErrorFallback = () => (
  <div className="server-error">
    Component unavailable - please contact support
  </div>
);

export default function InServer() {
  const promise = new Promise<string>((resolve) =>
    setTimeout(() => resolve("Hello from server"), 15000)
  );

  return (
    <>
      {/* timeouts + onSuccess: ❌ BAD (React Client Component + Function) */}
      <Suspense
        fallback="Loading"
        timeouts={[3000, 6000, 10000]}
        timeoutFallbacks={[
          <div>Timeout 1</div>,
          <div>Timeout 2</div>,
          <div>Timeout 3</div>,
        ]}
        onSuccess={(data) => <div>{data}</div>}
        productionPropsErrorFallback={<ProductionPropsErrorFallback />}
      >
        {promise}
      </Suspense>
      {/* retry: ❌ BAD (React Client Component + Function) */}
      <Suspense
        retry
        productionPropsErrorFallback={<ProductionPropsErrorFallback />}
      >
        {() => promise}
      </Suspense>
      {/* cacheKey: ❌ BAD (React Client Component + Function) */}
      <Suspense
        cacheKey="my-cache-key"
        productionPropsErrorFallback={<ProductionPropsErrorFallback />}
      >
        {() => promise}
      </Suspense>
      {/* onError: ❌ BAD (React Client Component + Function) */}
      <Suspense
        onError={(error) => <div>{error.message}</div>}
        productionPropsErrorFallback={<ProductionPropsErrorFallback />}
      >
        {promise}
      </Suspense>
    </>
  );
}
```

If not used `productionPropsErrorFallback` it will render nothing in production when a bad combination of props in Server Environment is detected.

## Props

All props are optional:

- **`onSuccess`**: A function that takes the resolved value of a resource (promise or React Context) and returns a `ReactNode`.

- **`onError`**: A function that takes an `Error` and returns a `ReactNode`. **Only use it in Client Environment**.

- **`children`**: Any `ReactNode` (same as React’s `Suspense`). Must be:

  - A `Usable<T>` (e.g., `Promise<T>` or `Context<T>`) when `onSuccess` is provided and no `retry` or `cacheKey` are used.

  - A function `() => Promise<T>` when `retry` or `cacheKey` (or both) are used.

- **`fallback`**: Any `ReactNode` (same as React’s `Suspense`).

- **`retry`**: Boolean. Set to `true` to enable retry functionality. Defaults to `false`. **Only use it in Client Environment**.

- **`retryCount`**: Number of retry attempts (default: `1`). Only applies when `retry` is `true`.

- **`retryDelay`**: Delay in milliseconds between retries (default: `0`). Only applies when `retry` is `true`.

- **`backoff`**: Boolean. Enables exponential backoff for retries (default: `false`). Only applies when `retry` is `true`.

- **`onRetryFallback`**: A function `(attempt: number) => ReactNode`. Fallback UI to be shown on each retry attempt. Only applies when `retry` is `true`.

- **`cacheKey`**: A string. Saves the resolved value of a promise into a memory cache. **Only use it in Client Environment**.

- **`cacheTTL`**: A number. Sets an expiration time in milliseconds for the cached value. Only applies when `cacheKey` is used.

- **`cacheVersion`**: A number. Invalidates previous cached value when it's increased or decreased (changed). Only applies when `cacheKey` is used.

- **`cachePersist`**: A boolean. When `true` it persists the cached value into `localStorage`. Only applies when `cacheKey` is used.

- **`timeouts`**: An array of numbers. Timeouts in milliseconds to update fallback UI shown (makes it a Client Component). Only applies when `onRetryFallback` is not used.

- **`timeoutFallbacks`**: An array of React Nodes (`ReactNode []`). Fallback UI's to show after each timeout specified in `timeouts`. Only applies when `timeouts` is not an empty array.

Refer to [React documentation](https://react.dev/reference/react/Suspense#props) for `children` and `fallback` props.

All props can be used together in Client Environment. In Server Environment **forbidden** props are `retry`, `cacheKey`, `onError`, and `timeouts` + `onSuccess` combination.

## Requirements

- React 19+: Uses the `use` hook when `onSuccess` prop is used.

## License

MIT
