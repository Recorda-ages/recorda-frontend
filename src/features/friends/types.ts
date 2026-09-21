export type FriendsTab = "seguidores" | "seguindo";

export type FriendProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};
