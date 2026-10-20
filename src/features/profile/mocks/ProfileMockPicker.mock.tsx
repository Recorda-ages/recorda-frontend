import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";

import { isProfileMockEnabled, MOCK_PROFILES } from "./profileMocks";

/**
 * DEV ONLY: opens the mock profiles (IMPLEMENTATION_NOTES.md, §10) without deep links.
 * Renders nothing unless __DEV__ and EXPO_PUBLIC_PROFILE_MOCK=true. Remove after #109.
 * Texts are not translated on purpose: this is a developer tool, not product UI.
 */
const SCENARIO_LABELS: Record<string, string> = {
  "mock-profile-public": "Público — Não seguindo",
  "mock-profile-private": "Privado — Não seguindo",
  "mock-profile-requested": "Privado — Solicitado",
  "mock-profile-private-following": "Privado — Seguindo",
  "mock-profile-public-following": "Público — Seguindo"
};

export function ProfileMockPicker() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isOpen, setIsOpen] = useState(false);

  if (!isProfileMockEnabled()) {
    return null;
  }

  const open = (userId: string) => {
    setIsOpen(false);
    navigation.navigate("UserProfile", { userId });
  };

  return (
    <View pointerEvents="box-none" style={styles.anchor}>
      <Pressable
        accessibilityLabel="Abrir perfis de teste"
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        style={styles.trigger}
        testID="profile-mock-picker-button"
      >
        <Text style={styles.triggerLabel}>DEV · Perfis de teste</Text>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet} testID="profile-mock-picker">
            <Text style={styles.title}>PERFIS DE TESTE</Text>
            {MOCK_PROFILES.map(({ user_id: userId }) => (
              <Pressable
                accessibilityRole="button"
                key={userId}
                onPress={() => open(userId)}
                style={styles.option}
                testID={`profile-mock-option-${userId}`}
              >
                <Text style={styles.optionLabel}>{SCENARIO_LABELS[userId] ?? userId}</Text>
                <Text style={styles.optionId}>{userId}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsOpen(false)}
              style={styles.close}
            >
              <Text style={styles.closeLabel}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    alignItems: "center",
    bottom: 48,
    left: 0,
    position: "absolute",
    right: 0
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  close: {
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 14
  },
  closeLabel: {
    color: "#BFBFBF",
    fontSize: 16
  },
  option: {
    backgroundColor: "#292929",
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  optionId: {
    color: "#7F7F7F",
    fontSize: 12,
    marginTop: 2
  },
  optionLabel: {
    color: "#EAEAEA",
    fontSize: 17,
    fontWeight: "600"
  },
  sheet: {
    backgroundColor: "#151515",
    borderColor: "#FFD035",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20
  },
  title: {
    color: "#FFD035",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1
  },
  trigger: {
    backgroundColor: "#292929",
    borderColor: "#FFD035",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  triggerLabel: {
    color: "#FFD035",
    fontSize: 13,
    fontWeight: "600"
  }
});
