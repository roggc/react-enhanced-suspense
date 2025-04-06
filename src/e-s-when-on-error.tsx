"use client";

import { Suspense } from "react";
import type { ReactNode } from "react";
import ErrorBoundary from "./error-boundary.js";
import Use from "./use.js";
import type { ESWhenOnErrorProps } from "./types/types.js";
import { useGetErrorKey } from "./hooks/index.js";

const ESWhenOnError = <T,>(props: ESWhenOnErrorProps<T>) => {
  const { fallback, children: resource, onError, onSuccess } = props;

  const content = onSuccess ? (
    <Use
      resource={resource}
      onSuccess={onSuccess}
      retry={false}
      enhancedResource={undefined}
    />
  ) : (
    (resource as ReactNode)
  );

  const wrappedContent = <Suspense fallback={fallback}>{content}</Suspense>;

  const errorKey = useGetErrorKey<T>(props);

  return (
    <ErrorBoundary key={errorKey} onError={onError}>
      {wrappedContent}
    </ErrorBoundary>
  );
};

export default ESWhenOnError;
