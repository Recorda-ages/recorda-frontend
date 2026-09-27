export type NotificationType =
  "COMMENT" | "FOLLOW_ACCEPTED" | "FOLLOW_REQUEST" | "LIKE" | "MENTION" | "NEW_FOLLOWER";

export type NotificationSender = {
  profile_picture_url: string | null;
  user_id: string;
  username: string;
};

export type NotificationItem = {
  comment_id: string | null;
  created_at: string;
  follow_id: string | null;
  is_read: boolean;
  notification_id: string;
  recorda_id: string | null;
  sender: NotificationSender | null;
  type: NotificationType;
};

export type NotificationPage = {
  items: NotificationItem[];
  unread_count: number;
};

export type FollowRequestDecision = "accept" | "decline";
