import { Suspense } from "react";
import type { ReactNode } from "react";
import Use from "./use.js";
import type { ESServerComponentProps } from "./types/types.js";

const ESServerComponent = <T,>(props: ESServerComponentProps<T>) => {
  const { fallback, children, onSuccess } = props;

  const content = onSuccess ? (
    <Use onSuccess={onSuccess} resource={children} />
  ) : (
    children
  );

  return <Suspense fallback={fallback}>{content as ReactNode}</Suspense>;
};

export default ESServerComponent;
