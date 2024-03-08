import { Post } from '../types';

export class FeedRankingEngine {
  private gravity: number;

  constructor(gravity: number = 1.8) {
    this.gravity = gravity;
  }

  /**
   * Computes logarithmic decay score based on Hacker News ranking formula:
   * Score = (Upvotes - 1) / (TimeHours + 2)^Gravity
   */
  public computeScore(post: Post, now: Date = new Date()): number {
    const hoursElapsed = Math.max(0, (now.getTime() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
    const votes = Math.max(1, post.upvotes);
    const score = (votes - 1) / Math.pow(hoursElapsed + 2, this.gravity);
    return Math.round(score * 10000) / 10000;
  }

  public rankPosts(posts: Post[], now: Date = new Date()): Post[] {
    return posts
      .map(p => ({ ...p, rankingScore: this.computeScore(p, now) }))
      .sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
  }
}
