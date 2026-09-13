export type FeedTab = "following" | "forYou";

export type FeedComment = {
  id: string;
  text: string;
  username: string;
};

export type FeedPost = {
  author: {
    avatarUrl: string;
    username: string;
  };
  comments: FeedComment[];
  description: string;
  id: string;
  likedBy: {
    avatarUrl: string;
    username: string;
  };
  likesCount: number;
  mediaUrl: string;
  publishedAt: string;
  song: {
    artistName: string;
    title: string;
  };
  tabs: FeedTab[];
};
