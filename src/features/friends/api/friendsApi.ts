import { authApiClient } from "@/services/api";

import type { FriendProfile } from "../types";

type FollowUser = {
  user_id: string;
  username: string;
  name: string;
  profile_picture_url: string | null;
};

type ListParams = {
  q?: string;
  limit?: number;
  offset?: number;
};

function toFriendProfile(u: FollowUser): FriendProfile {
  return {
    id: u.user_id,
    username: u.username,
    displayName: u.name,
    avatarUrl: u.profile_picture_url
  };
}

function buildQuery(params: ListParams): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export async function listFollowers(
  userId: string,
  params: ListParams = {}
): Promise<FriendProfile[]> {
  const qs = buildQuery(params);
  const data = await authApiClient.get<FollowUser[]>(`/users/${userId}/followers${qs}`);
  return data.map(toFriendProfile);
}

export async function listFollowing(
  userId: string,
  params: ListParams = {}
): Promise<FriendProfile[]> {
  const qs = buildQuery(params);
  const data = await authApiClient.get<FollowUser[]>(`/users/${userId}/following${qs}`);
  return data.map(toFriendProfile);
}

export async function removeFollower(followerId: string): Promise<void> {
  await authApiClient.delete<void>(`/users/me/followers/${followerId}`);
}
