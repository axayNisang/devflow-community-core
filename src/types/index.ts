export interface Post {
  id: string;
  authorId: string;
  title: string;
  contentMarkdown: string;
  tags: string[];
  upvotes: number;
  reactions: Record<string, number>;
  createdAt: string; // ISO-8601
  rankingScore?: number;
}

export interface ModerationRule {
  bannedKeywords: string[];
  maxPostsPerMinute: number;
}
