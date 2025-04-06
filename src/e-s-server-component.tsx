import { Suspense } from "react";
import type { ReactNode } from "react";
import Use from "./use.js";
import type { ESServerComponentProps } from "./types/types.js";

const ESServerComponent = <T,>(props: ESServerComponentProps<T>) => {
  const { fallback, children: resource, onSuccess } = props;

  const content = onSuccess ? (
    <Use
      resource={resource}
      onSuccess={onSuccess}
      retry={false}
      enhancedResource={undefined}
    />
  ) : (
    resource
  );

  return <Suspense fallback={fallback}>{content as ReactNode}</Suspense>;
};

export default ESServerComponent;
