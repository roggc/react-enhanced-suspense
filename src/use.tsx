import { use } from "react";
import type { UseProps } from "./types/types.js";

/** Resolves a usable resource with `use` and applies `onSuccess`. */
const Use = <T,>({ onSuccess, resource }: UseProps<T>) => {
  const data = use(resource);
  return onSuccess(data);
};

export default Use;
