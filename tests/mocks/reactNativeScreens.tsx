import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

type NativeMockProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

function NativeMockView({ children, style, testID }: NativeMockProps) {
  return (
    <View style={style} testID={testID}>
      {children}
    </View>
  );
}

export const compatibilityFlags = {
  usesNewAndroidHeaderHeightImplementation: true
};

export const ScreenFooter = NativeMockView;
export const ScreenStack = NativeMockView;
export const ScreenStackHeaderBackButtonImage = NativeMockView;
export const ScreenStackHeaderCenterView = NativeMockView;
export const ScreenStackHeaderConfig = NativeMockView;
export const ScreenStackHeaderLeftView = NativeMockView;
export const ScreenStackHeaderRightView = NativeMockView;
export const ScreenStackHeaderSearchBarView = NativeMockView;
export const ScreenStackHeaderSubview = NativeMockView;
export const ScreenStackItem = NativeMockView;
export const SearchBar = NativeMockView;

export function enableFreeze() {
  return undefined;
}

export function enableScreens() {
  return undefined;
}

export function freezeEnabled() {
  return false;
}

export function isSearchBarAvailableForCurrentPlatform() {
  return false;
}
