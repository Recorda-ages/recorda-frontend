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
  onToggle?: (liked: boolean) => Promise<void> | void;
};

export function LikeButton({
  accessibilityLabel,
  count,
  initialLiked = false,
  onChange,
  onToggle
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(count);
  const requestId = useRef(0);

  async function handlePress() {
    const nextLiked = !liked;
    const previousLiked = liked;
    const previousCount = likeCount;
    const currentRequestId = requestId.current + 1;

    requestId.current = currentRequestId;
    setLiked(nextLiked);
    setLikeCount(previousCount + (nextLiked ? 1 : -1));
    onChange?.({ count: previousCount + (nextLiked ? 1 : -1), liked: nextLiked });

    try {
      await onToggle?.(nextLiked);
    } catch {
      if (requestId.current === currentRequestId) {
        setLiked(previousLiked);
        setLikeCount(previousCount);
        onChange?.({ count: previousCount, liked: previousLiked });
      }
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ selected: liked }}
        hitSlop={8}
        onPress={() => void handlePress()}
      >
        <Icon color={colors.primary[500]} size={26} source={liked ? "heart" : "heart-outline"} />
      </Pressable>
      <AppText>{likeCount}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  }
});
