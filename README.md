# react-enhanced-suspense

A React 19 component that extends React's `Suspense` with optional promise resolved values handling (`onSuccess`), error handling (`onError`), retry functionality of failing promises (`retry`), and more.

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

This component can be used as a substitute for React's `Suspense` and adds enhanced features like promise resolution, error handling, retry logic, and more.

## Key Features

- **Server Component by Default**: When `retry` is not used (or set to `false`), `EnhancedSuspense` behaves as a Server Component by default.

- **Client Component with Retry**: When `retry` is set to `true`, it becomes a Client Component to handle retry logic in the browser.

- **Promise Resolution**: Use `onSuccess` to transform resolved promise or React Context values.

- **Error Handling**: Use `onError` to wrap React's `Suspense` in an `ErrorBoundary` for custom error rendering.

- **Retry**: Use `retry` to retry fetching data in case of failure.

- **Timeout fallbacks**: Use `timeouts` and `timeoutFallbacks` toguether to update fallback shown to enhance user experience.

## Basic Example

If you have this component using React's `Suspense`:

```typescript
import { Suspense, use } from "react";

const Use = ({ promise }: { promise: Promise<string[]> | undefined }) => {
  const data = use(promise);
  return data.map((item) => <div key={item}>{item}</div>);
};

export default function SayHello({ promise }: { promise: Promise<string[]> }) {
  return (
    <>
      <div>hey</div>
      <div>
        <Suspense fallback="Loading...">
          <Use promise={promise} />
        </Suspense>
      </div>
    </>
  );
}
```

You can rewrite it using `EnhancedSuspense` as a drop-in replacement:

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

When only `fallback` or `children` props are passed, `EnhancedSuspense` behaves like React's `Suspense`.

## Promise Resolution with `onSuccess`

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

Here, `onSuccess` uses React’s `use` hook under the hood to resolve the promise and transform the result.

## Error Handling with `onError`

Add an `ErrorBoundary` by passing the `onError` prop:

```typescript
import { EnhancedSuspense } from "react-enhanced-suspense";

export default function Component() {
  return (
    <EnhancedSuspense onError={(error) => <div>{error}</div>}>
      {Promise.reject("Failed")}
    </EnhancedSuspense>
  );
}
```

The `onError` prop wraps React's `Suspense` in an `ErrorBoundary` component for custom error rendering.

## Combining `onSuccess` and `onError`

Use both props together for promise resolution and error handling:

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
          onError={(error) => <div>{`Error: ${error.message}`}</div>}
        >
          {promise}
        </EnhancedSuspense>
      </div>
    </>
  );
}
```

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

## Retry Functionality

When `retry` is set to `true`, `EnhancedSuspense` becomes a Client Component and retries failed promises with configurable options:

```typescript
"use client";

import { EnhancedSuspense } from "react-enhanced-suspense";

export default function SayHello() {
  return (
    <>
      <div>hey</div>
      <div>
        <EnhancedSuspense
          retry
          retryCount={10}
          retryDelay={500}
          backoff
          onRetryFallback={(attempt) => <div>{`Retrying ${attempt}...`}</div>}
          onError={(error) => (
            <div>
              <div>{error.message}</div>
              <button onClick={() => setRetryKey((prev) => prev + 1)}>
                Retry
              </button>
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

- **Note**: When `retry` is `true`, `children` must be a function that returns a promise (e.g., `() => Promise<T>`), not a promise directly, to allow multiple executions during retries.

## Updating fallback UI if it takes too long (`timeouts` and `timeoutFallbacks`)

```typescript
"use client";

import Suspense from "react-enhanced-suspense";
import { useState } from "react";

const VERY_LONG_TIME = 15000;

export default function Timeouts({}) {
  const [retryKey, setRetryKey] = useState(0);

  return (
    <>
      <Suspense
        key={retryKey}
        fallback="Loading..."
        timeouts={[3000, 6000, 10000]}
        timeoutFallbacks={[
          "Still working...",
          "Taking longer...",
          <button onClick={() => setRetryKey((prev) => prev + 1)}>
            Retry
          </button>,
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

## Optional Props

All props are optional. These are:

- **`onSuccess`**: A function that takes the resolved value of a resource (promise or React Context) and returns a `ReactNode`.

- **`onError`**: A function that takes an `Error` (or any value for immediately rejected promises) and returns a `ReactNode`.

- **`children`**: Any `ReactNode` (same as React’s `Suspense`). Must be:

  - A `Usable<T>` (e.g., `Promise<T>` or `Context<T>`) when `onSuccess` is provided and `retry` is `false` or omitted.

  - A function `() => Promise<T>` when `retry` is `true`.

- **`fallback`**: Any `ReactNode` (same as React’s `Suspense`).

- **`retry`**: Boolean. Set to `true` to enable retry logic (makes it a Client Component). Defaults to `false` (Server Component by default).

- **`retryCount`**: Number of retry attempts (default: `1`). Only applies when `retry` is `true`.

- **`retryDelay`**: Delay in milliseconds between retries (default: `0`). Only applies when `retry` is `true`.

- **`backoff`**: Boolean. Enables exponential backoff for retries (default: `false`). Only applies when `retry` is `true`.

- **`onRetryFallback`**: A function `(attempt: number) => ReactNode`. Fallback UI to be shown on each retry attempt. Only applies when `retry` is `true`.

- **`timeouts`**: An array of numbers. Timeouts in milliseconds to update fallback UI shown. Only applies when `onRetryFallback` is not used.

- **`timeoutFallbacks`**: An array of React Nodes (`ReactNode []`). Fallback UI's to show after each timeout specified in `timeouts`. Only applies when `timeouts` is not an empty array.

Refer to [React documentation](https://react.dev/reference/react/Suspense#props) for `children` and `fallback` props.

## Requirements

- React 19 or higher (due to the use of `use`).
