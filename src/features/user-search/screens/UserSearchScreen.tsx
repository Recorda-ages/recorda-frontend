import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { UserSearchResultRow } from "../components/UserSearchResultRow";
import { useUserSearch } from "../hooks/useUserSearch";

const SEARCH_DEBOUNCE_MS = 350;

export function UserSearchScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useUserSearch(debouncedQuery);
  const isWaitingDebounce = query.trim() !== debouncedQuery;
  const hasQuery = debouncedQuery.length > 0;
  const results = hasQuery && !isWaitingDebounce ? (search.data ?? []) : [];

  return (
    <SafeAreaView style={styles.screen} testID="user-search-screen">
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={t("userSearch.back")}
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.topBarAction}
          testID="user-search-back-button"
        >
          <Icon color={colors.neutrals[100]} size={32} source="chevron-left" />
        </Pressable>
        <AppText style={styles.topBarTitle} variant="headline4">
          {t("userSearch.header")}
        </AppText>
        <View style={styles.topBarAction} />
      </View>

      <View style={styles.search}>
        <TextInput
          accessibilityLabel={t("userSearch.search")}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder={t("userSearch.search")}
          placeholderTextColor={colors.neutrals[300]}
          returnKeyType="search"
          style={styles.input}
          testID="user-search-input"
          value={query}
        />
        {query.trim() && (isWaitingDebounce || search.isFetching) ? (
          <ActivityIndicator
            accessibilityLabel={t("userSearch.loading")}
            color={colors.primary[500]}
            size="small"
          />
        ) : (
          <Icon color={colors.neutrals[200]} size={24} source="magnify" />
        )}
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={results}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.user_id}
        ListEmptyComponent={
          <SearchFeedback
            hasQuery={hasQuery && !isWaitingDebounce}
            isError={search.isError}
            isSuccess={search.isSuccess}
            onRetry={() => void search.refetch()}
          />
        }
        renderItem={({ item }) => (
          <UserSearchResultRow
            item={item}
            onPress={(userId) => navigation.navigate("UserProfile", { userId })}
          />
        )}
      />
    </SafeAreaView>
  );
}

type SearchFeedbackProps = {
  hasQuery: boolean;
  isError: boolean;
  isSuccess: boolean;
  onRetry: () => void;
};

/**
 * Estados da lista quando ela está vazia.
 *
 * O ramo `!hasQuery` é onde a US27 (#198) encaixa a lista de sugestões por
 * afinidade; até lá ele mostra só a dica de busca.
 */
function SearchFeedback({ hasQuery, isError, isSuccess, onRetry }: SearchFeedbackProps) {
  const { t } = useTranslation();

  if (!hasQuery) {
    return (
      <AppText style={styles.feedback} testID="user-search-hint">
        {t("userSearch.hint")}
      </AppText>
    );
  }

  if (isError) {
    return (
      <View style={styles.feedbackGroup}>
        <AppText accessibilityRole="alert" style={styles.error}>
          {t("userSearch.searchError")}
        </AppText>
        <Pressable accessibilityRole="button" onPress={onRetry}>
          <AppText color="primary">{t("userSearch.retry")}</AppText>
        </Pressable>
      </View>
    );
  }

  if (isSuccess) {
    return (
      <AppText style={styles.feedback} testID="user-search-empty">
        {t("userSearch.empty")}
      </AppText>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  error: {
    color: colors.error[200]
  },
  feedback: {
    color: colors.neutrals[200],
    paddingVertical: spacing[4],
    textAlign: "center"
  },
  feedbackGroup: {
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[4]
  },
  input: {
    color: colors.neutrals[100],
    flex: 1,
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    minWidth: 0,
    paddingVertical: spacing[4]
  },
  list: {
    paddingHorizontal: spacing[4]
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.md,
    flexDirection: "row",
    marginBottom: spacing[2],
    marginHorizontal: spacing[4],
    minHeight: 56,
    paddingHorizontal: spacing[4]
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: spacing[4]
  },
  topBarAction: {
    justifyContent: "center",
    width: 48
  },
  topBarTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold
  }
});
