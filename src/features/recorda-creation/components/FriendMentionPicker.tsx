import { useState } from "react";
import { View } from "react-native";
import { Button, Checkbox, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useFollowing } from "@/features/friends/hooks/useFollowing";

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
  const friends = useFollowing(user?.user_id ?? "", search, open);
  return (
    <View>
      <Button disabled={disabled} onPress={() => setOpen(!open)}>
        {t("recordaDetails.mentions.label", { count: selectedIds.length })}
      </Button>
      {open ? (
        <View>
          <TextInput
            accessibilityLabel={t("recordaDetails.mentions.search")}
            placeholder={t("recordaDetails.mentions.search")}
            value={search}
            onChangeText={setSearch}
          />
          {friends.isError ? (
            <Button onPress={() => void friends.refetch()}>{t("profile.retry")}</Button>
          ) : null}
          {friends.isPending ? <Text>{t("recordaDetails.mentions.loading")}</Text> : null}
          {friends.data?.pages.flat().map((friend) => (
            <Checkbox.Item
              key={friend.id}
              label={`@${friend.username}`}
              status={selectedIds.includes(friend.id) ? "checked" : "unchecked"}
              disabled={disabled || (!selectedIds.includes(friend.id) && selectedIds.length >= 20)}
              onPress={() =>
                onChange(
                  selectedIds.includes(friend.id)
                    ? selectedIds.filter((id) => id !== friend.id)
                    : [...selectedIds, friend.id]
                )
              }
            />
          ))}
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
