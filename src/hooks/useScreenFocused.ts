import { useEffect, useState } from "react";

type Navigation = {
  addListener?: (event: "blur" | "focus", callback: () => void) => () => void;
};

export function useScreenFocused(navigation: Navigation) {
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    const unsubscribeBlur = navigation.addListener?.("blur", () => setFocused(false));
    const unsubscribeFocus = navigation.addListener?.("focus", () => setFocused(true));
    return () => {
      unsubscribeBlur?.();
      unsubscribeFocus?.();
    };
  }, [navigation]);

  return focused;
}
