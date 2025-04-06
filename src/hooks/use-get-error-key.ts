import { useEffect, useRef } from "react";
import { EnhancedSuspenseProps } from "../types/types.js";

export function useGetErrorKey<T>({
  onSuccess,
  onError,
  fallback,
  ...props
}: EnhancedSuspenseProps<T>) {
  const keyRef = useRef(0);

  useEffect(() => {
    keyRef.current += 1;
  }, [...Object.values(props)]);

  return keyRef.current;
}
