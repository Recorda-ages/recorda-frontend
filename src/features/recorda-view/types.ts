export type RecordaComment = {
  authorId: string;
  id: string;
  text: string;
  username: string;
};

export type RecordaViewData = {
  author: {
    avatarUrl: string;
    id: string;
    username: string;
  };
  comments: RecordaComment[];
  description: string;
  id: string;
  mediaUrl: string;
  song: {
    artistName: string;
    lyrics: string[];
    title: string;
  };
};
