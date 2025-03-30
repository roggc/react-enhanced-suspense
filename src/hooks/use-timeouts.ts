import { useState, useEffect } from "react";

export function useTimeouts(timeouts: number[] = [], resource: any) {
  const [currentStage, setCurrentStage] = useState(-1);

  useEffect(() => {
    if (!timeouts.length) return;

    const timers = timeouts.map((timeout, index) =>
      setTimeout(() => setCurrentStage(index), timeout)
    );

    return () => timers.forEach(clearTimeout);
  }, [timeouts, resource]);

  return currentStage;
}
