import { useEffect, useState } from "react";

type Navigation = {
  addListener?: (event: "blur", callback: () => void) => () => void;
};

export function useBlurCount(navigation: Navigation) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener?.("blur", () => setCount((current) => current + 1));
    return () => unsubscribe?.();
  }, [navigation]);

  return count;
}
