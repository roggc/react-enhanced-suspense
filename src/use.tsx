import { use } from "react";
import type { UseProps } from "./types/types.js";

/** Resolves a usable resource with `use` and applies `onSuccess`. */
const Use = <T,>({
  resource,
  onSuccess,
  retry,
  enhancedResource,
}: UseProps<T>) => {
  const data = use(retry ? enhancedResource : resource);
  return onSuccess(data);
};

export default Use;
