import { View } from "react-native";

type IoniconsProps = {
  color?: string;
  size?: number;
};

export function Ionicons({ color, size }: IoniconsProps) {
  return <View accessibilityRole="image" style={{ backgroundColor: color, height: size, width: size }} />;
}
