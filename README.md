# react-enhanced-suspense

A React 19 component that enhances React's `Suspense` with optional features like promise resolved values handling (`onSuccess`), error handling (`onError`), retry functionality of failing promises (`retry`), caching (`cache`), and timeout fallbacks (`timeouts`).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Key Features](#key-features)
- [React's `Suspense` (only `fallback` and/or `children` props)](#reacts-suspense-only-fallback-andor-children-props)
  - [React Context as `children` in React's Suspense](#react-context-as-children-in-reacts-suspense)
- [Promise Resolution Handling With `onSuccess`](#promise-resolution-handling-with-onsuccess)
  - [React `Context` Example](#react-context-example)
- [Error Handling With `onError` (\*Client Only)](#error-handling-with-onerror-client-only)
- [Retry Functionality With `retry` (\*Client Only)](#retry-functionality-with-retry-client-only)
- [Caching With `cacheKey` (\*Client Only)](#caching-with-cachekey-client-only)
- [Timeout Fallbacks With `timeouts` And `timeoutFallbacks`](#timeout-fallbacks-with-timeouts-and-timeoutfallbacks)
- [Invalid Props In The Server](#invalid-props-in-the-server)
  - [Quick Reference Table](#quick-reference-table)
  - [Examples](#examples)
  - [`productionPropsErrorFallback`](#productionpropserrorfallback)
- [Props](#props)
- [Requirements](#requirements)
- [License](#license)

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

- **(\*)Error Handling**: Use `onError` to wrap React's `Suspense` in an `ErrorBoundary` for custom error rendering **(Client only)**.

- **(\*)Retry Functionality**: Automatically retry failed promises with `retry`, configurable with `retryCount`, `retryDelay`, `retryBackoff`, and `onRetryFallback` **(Client only)**.

- **Caching**: Store promise results in memory or `localStorage` (or any custom storage) with `cache`, `resourceId`, `cacheTTL`, `cacheVersion`, and `cachePersist`.

- **Timeout Fallbacks**: Update the fallback UI dynamically with `timeouts` and `timeoutFallbacks` for long-running operations.

- **React's `Suspense`**: This component is React's `Suspense` when only `fallback` or `children` props are used.

- **TypeScript Support**: Fixes TypeScript errors when using React Context with `Suspense`, unlike React’s native `Suspense`.

**(\*)**: These props can only be used in the **Client**.

## React's `Suspense` (only `fallback` and/or `children` props)

```typescript
import Suspense from "react-enhanced-suspense";

export default function Component({ promise }: { promise: Promise<string> }) {
  return (
    <>
      <div>Hey</div>
      <div>
        <Suspense fallback="Loading...">{promise}</Suspense>
      </div>
    </>
  );
}
```

Can be used either in the Client or Server.

### React Context as `children` in React's Suspense

`EnhancedSuspense` fixes a Typescript error that appears when using React Context as `children` in React's `Suspense`:

```typescript
"use client";

import Suspense from "react-enhanced-suspense";
import { createContext, Suspense as ReactSuspense } from "react";

const MyContext = createContext("Default value");

export default function ShowContext() {
  return (
    <>
      <Suspense>{MyContext}</Suspense> // <-- No Typescript error
      <ReactSuspense>{MyContext}</ReactSuspense> // <-- Typescript error: Type 'Context<string>' is not assignable to type 'ReactNode'.
    </>
  );
}
```

## Promise Resolution Handling With `onSuccess`

```typescript
import Suspense from "react-enhanced-suspense";

export default function Component({ promise }: { promise: Promise<string[]> }) {
  return (
    <>
      <div>Hey</div>
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

**Can be used either in the Client or Server.**

### React `Context` Example

`EnhancedSuspense` also supports React Context as a `Usable` resource (`children` prop):

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

This renders `Context value: Default value`.

## Error Handling With `onError` (\*Client Only)

```typescript
"use client";

import Suspense from "react-enhanced-suspense";

export default function Component() {
  return (
    <Suspense onError={(error) => <div>{error.message}</div>}>
      {
        new Promise((resolve, reject) =>
          setTimeout(() => reject("Failed"), 1000)
        )
      }
    </Suspense>
  );
}
```

The `onError` prop wraps React's `Suspense` in an `ErrorBoundary` component for custom error rendering. It always expects an `Error` object, no matter what the rejected value of the promise is.

**Can only be used in the Client.**

## Retry Functionality With `retry` (\*Client Only)

With `EnhancedSuspense` you can automatically retry failed promises with configurable options:

```typescript
"use client";

import Suspense from "react-enhanced-suspense";

export default function Component() {
  return (
    <>
      <div>Hey</div>
      <Suspense
        retry
        retryCount={10} // number of retries; default: 1
        retryDelay={500} // delay between retries in ms; default: 0
        retryBackoff="linear" // backoff for retries; default: undefined
        onRetryFallback={(attempt) => <div>{`Retrying ${attempt}...`}</div>} // fallback to show in each retry attempt; default: undefined
        fallback="Loading..." // fallback to show on first attempt
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
      </Suspense>
    </>
  );
}
```

When using `retry`, the resource (the `children` prop) should be a function returning a promise, rather than a promise itself. If not, the retries will be on the same initially rejected promise and would have no effect.

`retryBackoff` admits the following values: `linear`, `exponential`, or a function with signature `(attemptIndex:number, retryDelay:number)=>number`.

**Works only in the Client.**

## Caching With `cache` and `resourceId`

Cache promise results with `cache` and `resourceId` props:

```typescript
import Suspense from "react-enhanced-suspense";

export default function Component() {
  return (
    <>
      <div>Hey</div>
      <Suspense
        cache
        cacheTTL={2000} // expiration time in ms for the cache; default: undefined
        cacheVersion={1} // number, when this changes invalidates cache; default: undefined
        cachePersist // whether to persist or not cache in localStorage; default: false
        resourceId="my-promise" // the id of the resource; without it the cache takes no effect
      >
        {
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

Can be used either in the Client or the Server.

## Timeout Fallbacks With `timeouts` And `timeoutFallbacks`

Update fallback UI for long-running operations:

```typescript
import Suspense from "react-enhanced-suspense";

const VERY_LONG_TIME = 15000;

export default function Component() {
  return (
    <Suspense
      fallback="Loading..."
      timeouts={[3000, 6000, 10000]}
      timeoutFallbacks={[
        "Still working...",
        "Taking longer...",
        <div style={{ color: "green" }}>Almost there...</div>,
      ]}
    >
      {
        new Promise<string>((resolve) =>
          setTimeout(() => resolve("Done"), VERY_LONG_TIME)
        )
      }
    </Suspense>
  );
}
```

Can be used either in the Client or the Server.

## All Props Can Be Used Together

```typescript
"use client";

import Suspense from "react-enhanced-suspense";

export default function Component() {
  return (
    <Suspense
      retry
      retryCount={15}
      onRetryFallback={(attempt) => <div>{`Retry ${attempt}...`}</div>}
      cache
      cacheTTL={2000}
      resourceId="my-promise"
      onError={(error) => <div>{error.message}</div>}
      onSuccess={(value) => value.map((item) => <div key={item}>{item}</div>)}
      fallback="Loading..."
      timeouts={[1000, 2000, 3000]}
      timeoutFallbacks={["Three...", "Two...", "One..."]}
    >
      {() =>
        new Promise<string[]>((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.9) {
              resolve(["Roger", "Alex"]);
            } else {
              reject("Fail on data fetching");
            }
          }, 4000);
        })
      }
    </Suspense>
  );
}
```

`onRetryFallback` takes precedence over `timeouts` and `timeoutFallbacks`. In the component above, from 0 to 1s, `Loading...` will render. From 1s to 2s, `Three...`; from 2s to 3s, `Two...`; from 3s to 4s, `One...`. Then, if promise is rejected, `Retry 1...` will render for 4s, then, if rejected again, `Retry 2...`, and so on, until promise is resolved or the number of retries are 15.

As always, when `retry` is used, `children`, the resource, should be a function returning a promise.

## Invalid Combination Of Props In The Server (`productionPropsErrorFallback`)

When used in the Server, there are certain combination of props which are not allowed. This happens when the component is a React Client Component and has props which are functions. For example, **`resourceId` turns the component into a Client Component**. If we use then `onSuccess`, this is not allowed in the Server, because **functions are not serializable**.

```typescript
// In the Server
{
  /* resourceId + onSuccess: ❌ BAD (React Client Component + Function) */
}
<Suspense
  resourceId="my-cache-key"
  onSuccess={(data) => <div>{data}</div>}
  productionPropsErrorFallback={
    <div>Component unavailable - please contact support</div>
  }
>
  {promise}
</Suspense>;
```

When this happens, that the component is a React Client Component and is used in the Server passing some prop as a function, the **app will not crash**. Instead, will show a message in development signaling that point, and in production will show either `null` or, if provided, `productionPropsErrorFallback`.

**Other props that turns the component into a Client Component, apart from `resourceId`, are `timeouts`, `onError`, `retry`, `cache`, and when `children`, the resource, is a function**. So when using `onError`, or `children` as a function, the component cannot be used in the Server (because it's a Client Component with props as functions).

But a Client Component can be used in the Server when no props are functions. For example, this is allowed in the Server:

```typescript
// In the Server
{
  /* timeouts: ✅ React Client Component, no props as functions */
}
<Suspense
  fallback="Loading..."
  timeouts={[3000, 6000, 10000]}
  timeoutFallbacks={[
    <div>Timeout 1</div>,
    <div>Timeout 2</div>,
    <div>Timeout 3</div>,
  ]}
>
  {promise}
</Suspense>;
```

`onSuccess` **doesn't turn the component into a Client Component**. So, despite it is a function, it can be used in the Server:

```typescript
// In the Server
{
  /* onSuccess: ✅ React Server Component */
}
<Suspense fallback="Loading..." onSuccess={(data) => <div>{data}</div>}>
  {promise}
</Suspense>;
```

`cache` can also be used in the Server if `children` is not a function (remember that `cache` only works with `resourceId`):

```typescript
// In the server
{
  /* cache + resourceId: ✅ React Client Component, no props as functions */
}
<Suspense fallback="Loading..." cache resourceId="my-promise" cachePersist>
  {promise}
</Suspense>;
```

Because `retry`, in order to work properly, requires `children` to be a function, cannot be used in the Server, and only in the Client.

### Quick Reference Table

| Props                     | React Client Component | Server Allowed                                        |
| ------------------------- | ---------------------- | ----------------------------------------------------- |
| `children` as a function  | ✅                     | ❌                                                    |
| `onError`                 | ✅                     | ❌                                                    |
| `timeouts`                | ✅                     | ✅ if no props as function (e.g. ❌ with `onSuccess`) |
| `resourceId`              | ✅                     | ✅ if no props as function (e.g. ❌ with `onSuccess`) |
| `retry`                   | ✅                     | ❌ because used with `children` as a function         |
| `cache`                   | ✅                     | ✅ if no props as function (e.g. ❌ with `onSuccess`) |
| `onSuccess`               | ❌                     | ✅                                                    |
| `fallback`                | ❌                     | ✅                                                    |
| `children` not a function | ❌                     | ✅                                                    |

In the Client all props are allowed.

## `children`, The Resource Prop

`children` is the resource. It can be either a `ReactNode`, a `Usable` (which is a promise or a React Context), or a function returning a promise. When used with `onSuccess`, it can be a `Usable` or a function returning a promise. When used without `onSuccess`, it can be a `ReactNode`, a `Usable` that resolves to a `ReactNode`, or a function returning a promise that resolves to a `ReactNode`.

## The `resourceId` Prop

As has been stated, `resourceId` turns the component into a Client Component, and it's necessary for `cache` to take effect (it's the cache key for storing the value into memory or localStorage or custom storage). `resourceId` it's a string. Apart from serving as a cache key when `cache` is used, it is also usefull when the resource, the `children` prop, changes dynamically. When `resourceId` changes, the evaluation of the resource is cancelled and a new evaluation starts. That is, a change in `resourceId` triggers a new evaluation of the resource, cancelling any pending evaluations.

React's `Suspense` evaluates the resource in every render if the resource is not memoized and it is not a state variable, that is, if it changes in every render. `EnhancedSuspense`, on the other hand, in its Client version, doesn't need to memoize the resource. It is stable between rerenders. Therefore, if you want to reevalute a resource, you must supply a `resourceId` and change it.

```typescript
"use client";

import Suspense from "react-enhanced-suspense";
import { useState, useEffect } from "react";

export default function Component() {
  const [resource, setResource] = useState(
    () =>
      new Promise<string[]>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.002) {
            resolve(["Roger", "Alex"]);
          } else {
            reject("Fail on data fetching");
          }
        }, 2000);
      })
  );
  const [resourceId, setResourceId] = useState("first");
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    if (!isMounted) return;
    setResourceId("second");
  }, [resource]);
  return (
    <>
      <button
        onClick={() =>
          setResource(
            new Promise<string[]>((resolve, reject) => {
              setTimeout(() => {
                if (Math.random() > 0.002) {
                  resolve(["Alex", "Roger"]);
                } else {
                  reject("Fail on data fetching");
                }
              }, 2000);
            })
          )
        }
      >
        change resource
      </button>
      <Suspense
        fallback="Loading..."
        onSuccess={(values) =>
          values.map((item) => <div key={item}>{item}</div>)
        }
        // Reevaluates the resource when pressing the button (not a Client Component)
      >
        {resource}
      </Suspense>
      <Suspense
        fallback="Loading..."
        resourceId="fixed"
        onSuccess={(values) =>
          values.map((item) => <div key={item}>{item}</div>)
        }
        // DON'T Reevaluate the resource when pressing button (React Client Component + resourceId constant)
      >
        {resource}
      </Suspense>
      <Suspense
        fallback="Loading..."
        resourceId={resourceId}
        onSuccess={(values) =>
          values.map((item) => <div key={item}>{item}</div>)
        }
        // Reevaluate the resource when pressing button (React Client Component + resourceId changes)
      >
        {resource}
      </Suspense>
    </>
  );
}
```

The first `Suspense` **will reevaluate** the resource when pressing the button because the props used doesn't turn it into a React Client Component (only `fallback`, `children` not being a function, and `onSuccess` are used).

The second `Suspense` **will NOT reevaluate** the resource despite pressing the button and changing it because `resourceId` turns the component into a Client Component and is fixed (constant, doesn't change when pressing the button).

The third `Suspense` **will reevaluate** the resource when pressing the button because of the `useEffect`, that changes the `resourceId` when the resource changes.

The correct way to implement it would be (a more realistic scenario):

```typescript
"use client";

import Suspense from "react-enhanced-suspense";
import { useState, useEffect } from "react";

export default function Component() {
  const [prop, setProp] = useState(true);
  const resource = prop
    ? new Promise<string[]>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.002) {
            resolve(["Roger", "Alex"]);
          } else {
            reject("Fail on data fetching");
          }
        }, 2000);
      })
    : new Promise<string[]>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.002) {
            resolve(["Alex", "Roger"]);
          } else {
            reject("Fail on data fetching");
          }
        }, 2000);
      });
  const [resourceId, setResourceId] = useState(`my-promise-${prop}`);
  useEffect(() => {
    setResourceId(`my-promise-${prop}`);
  }, [prop]);
  return (
    <>
      <button onClick={() => setProp((currentValue) => !currentValue)}>
        Toggle prop
      </button>
      <Suspense
        fallback="Loading..."
        // Reevaluates the resource on EVERY RENDER (not a Client Component, resource not memoized and not a state variable)
      >
        {resource}
      </Suspense>
      <Suspense
        fallback="Loading..."
        resourceId="fixed"
        // DON'T Reevaluate the resource on every render, NEITHER when the button is pressed.
      >
        {resource}
      </Suspense>
      <Suspense
        fallback="Loading..."
        resourceId={resourceId}
        // DON'T Reevaluate the resource on every render, only WHEN the button is pressed.
      >
        {resource}
      </Suspense>
    </>
  );
}
```

## The `cacheAPI`

Together with the component `EnhancedSuspense`, a `cacheAPI` is also exported:

```typescript
const cacheAPI: Readonly<{
  setCacheSizeLimit(bytes: number | null, entries?: number | null): void;
  setCustomStorage(storage: CustomCacheStorage | null): void;
  cleanupCache(): void;
  startAutomaticCacheCleanup(intervalMs?: number): void;
  stopAutomaticCacheCleanup(): void;
  getCacheStatus(): {
    isCustomStorage: boolean;
    entryCount: number | undefined;
    persistentCount: number | undefined;
    expirationCount: number | undefined;
    isCleanupActive: boolean;
  };
  clearCache(options?: { clearLocalStorage?: boolean }): void;
}>;
```

`clenaupCache()` removes from cache all expired entries. `clearCache()` clears all the cache. `setCustomStorage` sets a custom storage for the cache, where:

```typescript
type CustomCacheStorage = {
  get(key: string): CacheEntry | null;
  set(key: string, value: any, ttl?: number, persist?: boolean): void;
  delete(key: string): void;
  cleanup?(): void;
  clear?(): void;
  status?():
    | {
        entryCount?: number;
        persistentCount?: number;
        expirationCount?: number;
      }
    | undefined;
};
```

and:

```typescript
type CacheEntry = {
  value: any;
  expiry?: number | undefined;
};
```

These two types, `CustomCacheStorage` and `CacheEntry` are also exported by the package.

## Props

All props are optional. All props can be used together in the **Client**.

| Prop                           | Description                                                                                                                                                                                                                             | Example                                                                                                                                                                                | React Client Component                           | Server Allowed                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| `onSuccess`                    | A **function** that takes the resolved value of a resource (promise or React Context) and returns a `ReactNode`. When used, `children` must be a `Usable` (promise or React Context) or a function returning a promise.                 | `<Suspense onSuccess={(values) => values.map(item => <div key={item}>{item}</div>)}>{new Promise<string[]>(resolve => setTimeout(() => resolve(["Roger", "Alex"]), 1000))}</Suspense>` | ❌                                               | ✅                                                    |
| `onError`                      | A **function** that takes an `Error` and returns a `ReactNode`                                                                                                                                                                          | `<Suspense onError={(error) => <div>{error.message}</div>} />`                                                                                                                         | ✅                                               | ❌                                                    |
| `children`                     | A **function** that returns a promise, a `ReactNode`, or a `Usable` (promise or React Context). Specifies the **resource** or content that suspenses                                                                                    | `<Suspense>{new Promise<string>(r => setTimeout(() => r("Done"), 1000))}</Suspense>`                                                                                                   | ✅ when is a function ❌ rest of cases           | ❌ when is a function ✅ rest of cases                |
| `fallback`                     | A `ReactNode`                                                                                                                                                                                                                           | `<Suspense fallback="Loading..." />`                                                                                                                                                   | ❌                                               | ✅                                                    |
| `retry`                        | A `boolean` that indicates whether to retry failing promises or not (default `false`). When used, the resource should be a function returning a promise.                                                                                | `<Suspense retry>{() => new Promise((resolve, reject) => setTimeout(() => {if(Math.random() > 0.6){resolve(["Roger", "Alex"])}else{reject("Failed")}}, 1000))}</Suspense>`             | ✅                                               | ❌ because of used with `children` as a function      |
| `retryCount`                   | The `number` of retries to try when using `retry` (defaults to `1`). Only applies when `retry` is used                                                                                                                                  | `<Suspense retry retryCount={15}>{...}</Suspense>`                                                                                                                                     | ✅ because of used with `retry`                  | ❌ because of used with `children` as a function      |
| `retryDelay`                   | The `number` of ms to apply (wait) between each retry (defaults to `0`). Only applies when `retry` is used                                                                                                                              | `<Suspense retry retryDelay={1000}>{...}</Suspense>`                                                                                                                                   | ✅ because of used with `retry`                  | ❌ because of used with `children` as a function      |
| `retryBackoff`                 | Specifies the backoff strategy to apply for retries (defaults `undefined`). Can be `"linear"`, `"exponential"`, or a function with signature `(attemptIndex: number, retryDelay: number) => number`. Only applies when `retry` is used. | `<Suspense retry retryBackoff="linear">{...}</Suspense>`                                                                                                                               | ✅ because of used with `retry`                  | ❌ because of used with `children` as a function      |
| `onRetryFallback`              | A **function** (with signature `(retryAttempt: number) => ReactNode`) that specifies the fallback UI to be shown on each retry attempt. Only applies when `retry` is used.                                                              | `<Suspense retry onRetryFallback={(retryAttempt) => <div>Retrying {retryAttempt}...</div>}>{...}</Suspense>`                                                                           | ✅ because of used with `retry`                  | ❌ because of used with `children` as a function      |
| `resourceId`                   | A `string` that identifies the resource being used. When used with `cache` serves as the cache key. Stabilizes the resource between rerenders.                                                                                          | `<Suspense resourceId="my-promise">{new Promise<string>(r => setTimeout(() => r("Done"), 1000))}</Suspense>`                                                                           | ✅                                               | ✅ if no props as function (e.g. ❌ with `onSuccess`) |
| `cache`                        | A `boolean` that indicates whether to use the cache functionality or not. In order to work needs to be accompanied by `resourceId`, that serves as the cache key.                                                                       | `<Suspense cache cachePersist resourceId="my-promise">{new Promise<string>(r => setTimeout(() => r("Done"), 1000))}</Suspense>`                                                        | ✅                                               | ✅ if no props as function (e.g. ❌ with `onSuccess`) |
| `cacheTTL`                     | A `number` that sets an expiration time in milliseconds for the cached value. Only applies when `cache` and `resourceId` are used.                                                                                                      | `<Suspense cache cachePersist cacheTTL={60000} resourceId="my-promise">{...}</Suspense>`                                                                                               | ✅ because of used with `cache` and `resourceId` | ✅ if no props as function (e.g. ❌ with `onSuccess`) |
| `cacheVersion`                 | A `number`. Invalidates previous cached value when it's increased or decreased (changed). Only applies when `cache` and `resourceId` are used.                                                                                          | `<Suspense cache cachePersist cacheTTL={60000} cacheVersion={cacheVersionKey} resourceId="my-promise">{...}</Suspense>`                                                                | ✅ because of used with `cache` and `resourceId` | ✅ if no props as function (e.g. ❌ with `onSuccess`) |
| `cachePersist`                 | A `boolean` (defaults to `false`) that indicates whether to persist the cached value into `localStorage` (or custom storage) or not. Only applies when `cache` and `resourceId` are used.                                               | `<Suspense cache cachePersist cacheTTL={60000} cacheVersion={cacheVersionKey} resourceId="my-promise">{...}</Suspense>`                                                                | ✅ because of used with `cache` and `resourceId` | ✅ if no props as function (e.g. ❌ with `onSuccess`) |
| `timeouts`                     | A `number[]`. Timeouts in milliseconds to update fallback UI shown (`onRetryFallback` takes precedence). Only makes sense if `timeoutFallbacks` is used.                                                                                | `<Suspense timeouts={[1000, 2000]} timeoutFallbacks={["Two...", "One..."]} fallback="Loading...">{new Promise<string>(r => setTimeout(() => r("Go!"), 3000))}</Suspense>`              | ✅                                               | ✅ if no props as function (e.g. ❌ with `onSuccess`) |
| `timeoutFallbacks`             | A `ReactNode[]`. Fallback UIs to show after each timeout specified in `timeouts`. Only makes sense if `timeouts` is not an empty array.                                                                                                 | `<Suspense timeouts={[1000, 2000]} timeoutFallbacks={["Two...", "One..."]} fallback="Loading...">{new Promise<string>(r => setTimeout(() => r("Go!"), 3000))}</Suspense>`              | ✅ Because used with `timeouts`                  | ✅ if no props as function (e.g. ❌ with `onSuccess`) |
| `productionPropsErrorFallback` | A `ReactNode`. Renders a custom fallback **in production** when invalid props are used in the Server (e.g. a React Client Component with props as functions in the Server). Defaults to `null` (renders nothing) if not provided.       | `<Suspense productionPropsErrorFallback={<div>component not available - contact support</div>}>{()=>Promise.resolve("Hey")}</Suspense>`                                                | ❌                                               | ✅                                                    |

## Requirements

- React 19.

## License

MIT
