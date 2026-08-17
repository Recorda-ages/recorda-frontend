import { createContext } from "react";
import type { PropsWithChildren } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

const frame = {
  height: 0,
  width: 0,
  x: 0,
  y: 0
};

const insets = {
  bottom: 0,
  left: 0,
  right: 0,
  top: 0
};

export const initialWindowMetrics = {
  frame,
  insets
};

export const SafeAreaFrameContext = createContext(frame);
export const SafeAreaInsetsContext = createContext(insets);

type SafeAreaProviderProps = PropsWithChildren<{
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
}>;

export function SafeAreaProvider({ children, onLayout, style }: SafeAreaProviderProps) {
  return (
    <SafeAreaFrameContext.Provider value={frame}>
      <SafeAreaInsetsContext.Provider value={insets}>
        <View onLayout={onLayout} style={style}>
          {children}
        </View>
      </SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
}

type SafeAreaViewProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function SafeAreaView({ children, style, testID }: SafeAreaViewProps) {
  return (
    <View style={style} testID={testID}>
      {children}
    </View>
  );
}

export function useSafeAreaFrame() {
  return frame;
}

export function useSafeAreaInsets() {
  return insets;
}
