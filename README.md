# react-enhanced-suspense

A React 19 component that enhances `Suspense` with promise handling.

## Installation

To install the package, run:

```bash
npm i react-enhanced-suspense
```

## Usage

Import `EnhancedSuspense` in your code:

```typescript
import { EnhancedSuspense } from "react-enhanced-suspense";
```

This component can be used as a substitute for React's `Suspense`.

## Basic Example

If you have this component using React's `Suspense`:

```typescript
"use client";

import { Suspense, use } from "react";

export default function SayHello({ promise }: { promise?: Promise<string[]> }) {
  const Comp = () => {
    if (!promise) return null;
    const data = use(promise);
    return data.map((item) => <div key={item}>{item}</div>);
  };

  return (
    <>
      <div>hey</div>
      <div>
        <Suspense fallback="Loading...">
          <Comp />
        </Suspense>
      </div>
    </>
  );
}
```

You can rewrite it using `EnhancedSuspense`:

```typescript
"use client";

import { use } from "react";
import { EnhancedSuspense } from "react-enhanced-suspense";

export default function SayHello({ promise }: { promise?: Promise<string[]> }) {
  const Comp = () => {
    if (!promise) return null;
    const data = use(promise);
    return data.map((item) => <div key={item}>{item}</div>);
  };

  return (
    <>
      <div>hey</div>
      <div>
        <EnhancedSuspense fallback="Loading...">
          <Comp />
        </EnhancedSuspense>
      </div>
    </>
  );
}
```

This will work, but internally `EnhancedSuspense` uses React's `use`, so you don’t need to call it manually when using this component. You can write instead directly:

```typescript
"use client";

import { EnhancedSuspense } from "react-enhanced-suspense";

export default function SayHello({ promise }: { promise?: Promise<string[]> }) {
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

## Props

- `fallback`: A `ReactNode` to show while the promise is pending. Defaults to `"Loading..."`.

- `children`: Can be a `Promise<T>`, `JSX.Element`, `string`, or `undefined`.

- `onSuccess`: Can be a function that takes the resolved promise value and returns a `ReactNode`, or `undefined`.

- `onError`: Can be a function that takes an `Error` and returns a `ReactNode` for custom error rendering, or `undefined`.

## Example with onError

```typescript
<EnhancedSuspense
  fallback="Loading..."
  onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
  onError={(error) => <span>Error: {error.message}</span>}
>
  {promise}
</EnhancedSuspense>
```

## Omitting Props

- Without `fallback` (uses default) and without `onError` (uses default JSX returned by integrated Error Boundary, referencing `error.message`):

  ```typescript
  <EnhancedSuspense
    onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
  >
    {promise}
  </EnhancedSuspense>
  ```

- Without `onSuccess` (renders the resolved value directly):

  ```typescript
  <EnhancedSuspense>{promise}</EnhancedSuspense>
  ```

  This is equivalent to:

  ```typescript
  <EnhancedSuspense onSuccess={(data) => data}>{promise}</EnhancedSuspense>
  ```

- Without promise (renders `null`):

  ```typescript
  <EnhancedSuspense />
  ```

## Using with JSX or Strings

```typescript
const ComponentA = () => <div>Hello</div>;
const ComponentB = () => (
  <EnhancedSuspense>
    <ComponentA />
  </EnhancedSuspense>
);
// Renders: <div>Hello</div>

const ComponentC = () => <EnhancedSuspense>Hello again!!!</EnhancedSuspense>;
// Renders: "Hello again!!!"
```

## Note on Promise Resolution

When omitting `onSuccess`, the resolved value of `children` must be a valid `ReactNode`. If the promise resolves to a non-renderable type (e.g., `object`), use `onSuccess` to transform it:

```typescript
<EnhancedSuspense
  onSuccess={(data) =>
    Object.entries(data).map(([k, v]) => <div key={k}>{v}</div>)
  }
>
  {Promise.resolve({ name: "Roger", age: "28" })}
</EnhancedSuspense>
```

## Usage Notes

`EnhancedSuspense` can be used in both Server Components and Client Components. Its behavior depends on the promise passed as `children`:

```typescript
// In a Server Component with an immediately resolved promise
import { EnhancedSuspense } from "react-enhanced-suspense";

export default function ServerPage() {
  const promise = Promise.resolve("Hello from server");

  return (
    <EnhancedSuspense onSuccess={(data) => <div>{data}</div>}>
      {promise}
    </EnhancedSuspense>
  );
}
```

- **Immediately resolved promises**: If the promise is already resolved (e.g., `Promise.resolve`), `EnhancedSuspense` renders the result (`onSuccess`) directly on the server, bypassing the `fallback`.

- **Pending promises**: For unresolved promises (e.g., async operations), `EnhancedSuspense` renders the `fallback` on the server and delegates promise resolution to the client via React's `use` hook.

When used in a Server Component, `EnhancedSuspense` itself acts as a Server Component, while its internal `ErrorBoundary` (a Client Component) handles errors on the client.

## Integration with Waku and Server Actions

`EnhancedSuspense` works seamlessly with [Waku](https://waku.gg), a React 19 framework, and Server Actions.

### Approach 1: Server Action Returns a Component

```typescript
// src/server-actions/say-hello.tsx
"use server";

import SayHello from "../components/say-hello";

export function sayHello() {
  const promise = new Promise<string[]>((resolve, reject) =>
    setTimeout(() => {
      if (Math.random() > 0.2) {
        resolve(["Roger", "Alex"]);
      } else {
        reject("Fail on data fetching");
      }
    }, 1000)
  );

  return <SayHello promise={promise} />;
}
```

```typescript
// src/components/home-page-client.tsx
"use client";

import { sayHello } from "../server-actions/say-hello";
import { useState, useEffect } from "react";
import { EnhancedSuspense } from "react-enhanced-suspense";

export default function HomePageClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <EnhancedSuspense>{sayHello()}</EnhancedSuspense> : null;
}
```

```typescript
// src/components/say-hello.tsx
import { EnhancedSuspense } from "react-enhanced-suspense";

export default function SayHello({ promise }: { promise?: Promise<string[]> }) {
  return (
    <>
      <div>hey</div>
      <div>
        <EnhancedSuspense
          onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)}
        >
          {promise}
        </EnhancedSuspense>
      </div>
    </>
  );
}
```

#### Waku Build/Deploy Workaround for Client Components

If `SayHello` is a Client Component, Waku requires you to use it in the JSX tree to avoid build/deploy errors:

```typescript
// src/pages/_layout.tsx
import type { ReactNode } from "react";
import SayHello from "../components/say-hello"; // 1. Import the Client Component returned by the Server Action

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  const data = await getData();

  return (
    <div className="font-['Nunito']">
      <meta name="description" content={data.description} />
      <link rel="icon" type="image/png" href={data.icon} />
      <main className="m-6 flex items-center *:min-h-64 *:min-w-64 lg:m-0 lg:min-h-svh lg:justify-center">
        {children}
      </main>
      {/*2. Use it in the JSX tree without affecting the functionality of the app*/}
      {false && <SayHello />}
    </div>
  );
}
```

This is not needed if `SayHello` is a Server Component and doesn’t call or use any Client Component down the tree.

### Approach 2: Server Action Returns a Promise

```typescript
// src/server-actions/say-hello.tsx
"use server";

export function sayHello() {
  return new Promise<string[]>((resolve, reject) =>
    setTimeout(() => {
      if (Math.random() > 0.2) {
        resolve(["Roger", "Alex"]);
      } else {
        reject("Fail on data fetching");
      }
    }, 1000)
  );
}
```

```typescript
// src/components/home-page-client.tsx
"use client";

import { sayHello } from "../server-actions/say-hello";
import { useState, useEffect } from "react";
import SayHello from "./say-hello";

export default function HomePageClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <SayHello promise={sayHello()} /> : null;
}
```

**Note**: This approach works but may log errors in the console occasionally, making it less stable than the first approach.

## Requirements

- React 19 or higher (due to the use of `use`).
