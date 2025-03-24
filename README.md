# react-enhanced-suspense

A React 19 component that extends `Suspense` with optional promise resolution (`onSuccess`) and error handling (`onError`).

## Installation

To install the package, run:

```bash
npm i react-enhanced-suspense
```

## Usage

Starting with v1.1.0, you can import the component in two ways:

- **Named import**: Use this for continuity with v1.0.x or if you prefer explicit names:

  ```typescript
  import { EnhancedSuspense } from "react-enhanced-suspense";
  ```

- **Default import**: Use this for a shorter, more familiar syntax (like React’s `Suspense`):

  ```typescript
  import Suspense from "react-enhanced-suspense";
  ```

Both are the same component under the hood. Pick the one that suits your project!

This component can be used as a substitute for React's `Suspense`.

## Basic Example

If you have this component using React's `Suspense`:

```typescript
"use client";

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

You can rewrite it using `EnhancedSuspense`:

```typescript
"use client";

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

and will be exactly the same, because `EnhancedSuspense` behaves exactly as React's `Suspense` when no `onSuccess` prop or `onError` prop is passed. The grace of `EnhancedSuspense` is that we can pass an optional `onSuccess` prop when the `children` is a promise and we want to manipulate the resolved value of the promise, like in this case. So, in this case, with `EnhancedSuspense`, we can write directly:

```typescript
"use client";

import { EnhancedSuspense } from "react-enhanced-suspense";

export default function SayHello({ promise }: { promise: Promise<string[]> }) {
  return (
    <>
      <div>hey</div>
      <div>
        <EnhancedSuspense
          fallback="Loading..."
          onSuccess={(data) => data.map((item) => <div key={item}>{item}</div>)} // <--- this is key, makes the component use React's "use" function under the hood
        >
          {promise}
        </EnhancedSuspense>
      </div>
    </>
  );
}
```

If we want to add an Error Boundary to the code, we can do it passing the optional prop `onError`. This will wrap the React's `Suspense` in an `ErrorBoundary` component:

```typescript
"use client";

import { EnhancedSuspense } from "react-enhanced-suspense";

export default function Component() {
  return (
    <EnhancedSuspense
      onError={(error) => <div>{error}</div>} // <--- this is key, wrapps React's Suspense in an ErrorBoundary component
    >
      {Promise.reject("Failed")}
    </EnhancedSuspense>
  );
}
```

If we want the two options, that is, an `ErrorBoundary` plus the manipulation of the value returned by the promise, we pass the two optional props:

```typescript
"use client";

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

Finally, show this example where the resource passed as children to `EnhancedSuspense` is not a promise but a `Context`:

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

will render `Context value: Default value` on the screen. This is because React's `use` accepts either a Promise or context as resource.

## Optional Props

- `onSuccess`: A function that takes the resolved promise value and returns a `ReactNode`.

- `onError`: A function that takes an `Error` and returns a `ReactNode`.

Apart from that it has the props that React's Suspense has, that is, `fallback` and `children` (refer to [React documentation](https://react.dev/reference/react/Suspense#props) for those).

## Requirements

- React 19 or higher (due to the use of `use`).
