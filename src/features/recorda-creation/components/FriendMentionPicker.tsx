import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Checkbox, Chip, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useFollowing } from "@/features/friends/hooks/useFollowing";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { baseColors, colors, spacing } from "@/theme";

const SEARCH_DEBOUNCE_MS = 350;
const MAX_MENTIONS = 20;

export function FriendMentionPicker({
  selectedIds,
  onChange,
  disabled
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [knownUsernames, setKnownUsernames] = useState<Record<string, string>>({});
  const debouncedSearch = useDebouncedValue(search.trim().replace(/^@+/, ""), SEARCH_DEBOUNCE_MS);
  const friends = useFollowing(user?.user_id ?? "", debouncedSearch, open);
  const items = useMemo(() => friends.data?.pages.flat() ?? [], [friends.data]);
  const isSettling =
    search.trim().replace(/^@+/, "") !== debouncedSearch || friends.isPlaceholderData;

  const toggle = (id: string, username: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
      return;
    }
    setKnownUsernames((current) => ({ ...current, [id]: username }));
    onChange([...selectedIds, id]);
  };

  return (
    <View>
      <Button disabled={disabled} onPress={() => setOpen(!open)}>
        {t("recordaDetails.mentions.label", { count: selectedIds.length })}
      </Button>
      {selectedIds.length > 0 ? (
        <View style={styles.chips}>
          {selectedIds.map((id) => (
            <Chip
              compact
              disabled={disabled}
              key={id}
              onClose={() => onChange(selectedIds.filter((selectedId) => selectedId !== id))}
              style={styles.chip}
              textStyle={styles.chipText}
            >
              {`@${knownUsernames[id] ?? id.slice(0, 8)}`}
            </Chip>
          ))}
        </View>
      ) : null}
      {open ? (
        <View>
          <TextInput
            accessibilityLabel={t("recordaDetails.mentions.search")}
            autoCapitalize="none"
            autoCorrect={false}
            dense
            mode="outlined"
            onChangeText={setSearch}
            placeholder={t("recordaDetails.mentions.search")}
            right={
              isSettling && friends.isFetching ? <TextInput.Icon icon="timer-sand" /> : undefined
            }
            value={search}
          />
          {friends.isError ? (
            <Button onPress={() => void friends.refetch()}>{t("profile.retry")}</Button>
          ) : null}
          {friends.isPending ? <Text>{t("recordaDetails.mentions.loading")}</Text> : null}
          {friends.isSuccess && items.length === 0 ? (
            <Text style={styles.empty}>{t("recordaDetails.mentions.empty")}</Text>
          ) : null}
          <View style={isSettling ? styles.settling : undefined}>
            {items.map((friend) => (
              <Checkbox.Item
                disabled={
                  disabled ||
                  (!selectedIds.includes(friend.id) && selectedIds.length >= MAX_MENTIONS)
                }
                key={friend.id}
                label={`@${friend.username}`}
                onPress={() => toggle(friend.id, friend.username)}
                status={selectedIds.includes(friend.id) ? "checked" : "unchecked"}
              />
            ))}
          </View>
          {friends.hasNextPage ? (
            <Button
              loading={friends.isFetchingNextPage}
              onPress={() => void friends.fetchNextPage()}
            >
              {t("recordaDetails.mentions.more")}
            </Button>
          ) : null}
          {selectedIds.length > 0 ? (
            <Button disabled={disabled} onPress={() => onChange([])}>
              {t("recordaDetails.mentions.clear")}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.secondary[900]
  },
  chipText: {
    color: baseColors.white
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    paddingVertical: spacing[2]
  },
  empty: {
    color: colors.neutrals[300],
    paddingVertical: spacing[3],
    textAlign: "center"
  },
  settling: {
    opacity: 0.6
  }
});
