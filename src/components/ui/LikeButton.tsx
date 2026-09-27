import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "./Text";
import { colors } from "@/theme";

type LikeButtonProps = {
  accessibilityLabel: string;
  count: number;
  initialLiked?: boolean;
  onChange?: (state: { count: number; liked: boolean }) => void;
  onToggle: (liked: boolean) => Promise<void> | void;
  showCount?: boolean;
  testID?: string;
};

export function LikeButton({
  accessibilityLabel,
  count,
  initialLiked = false,
  onChange,
  onToggle,
  showCount = true,
  testID
}: Readonly<LikeButtonProps>) {
  const [prevInitialLiked, setPrevInitialLiked] = useState(initialLiked);
  const [prevCount, setPrevCount] = useState(count);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(count);
  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(false);

  if (initialLiked !== prevInitialLiked) {
    setPrevInitialLiked(initialLiked);
    setLiked(initialLiked);
  }

  if (count !== prevCount) {
    setPrevCount(count);
    setLikeCount(count);
  }

  async function handlePress() {
    if (pendingRef.current) return;

    const nextLiked = !liked;
    const previousLiked = liked;
    const previousCount = likeCount;

    pendingRef.current = true;
    setIsPending(true);
    setLiked(nextLiked);
    setLikeCount(previousCount + (nextLiked ? 1 : -1));
    onChange?.({ count: previousCount + (nextLiked ? 1 : -1), liked: nextLiked });

    try {
      await onToggle?.(nextLiked);
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      onChange?.({ count: previousCount, liked: previousLiked });
    } finally {
      pendingRef.current = false;
      setIsPending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ selected: liked }}
        disabled={isPending}
        hitSlop={8}
        onPress={(event) => {
          event?.stopPropagation?.();
          void handlePress();
        }}
        style={styles.button}
        testID={testID}
      >
        <Icon color={colors.primary[500]} size={26} source={liked ? "heart" : "heart-outline"} />
      </Pressable>
      {showCount ? <AppText>{likeCount}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: 0
  },
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  }
});
