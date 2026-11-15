import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { Icon } from "react-native-paper";

type AnimatedHeartProps = Readonly<{
  color: string;
  liked: boolean;
  size: number;
}>;

export function AnimatedHeart({ color, liked, size }: AnimatedHeartProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    scale.stopAnimation();
    Animated.sequence([
      Animated.timing(scale, {
        duration: liked ? 90 : 70,
        toValue: liked ? 1.35 : 0.8,
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        friction: 3,
        tension: 200,
        toValue: 1,
        useNativeDriver: true
      })
    ]).start();
  }, [liked, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Icon color={color} size={size} source={liked ? "heart" : "heart-outline"} />
    </Animated.View>
  );
}
