import { FeedRankingEngine } from '../src/feed/FeedRankingEngine';
import { ModerationService } from '../src/moderation/ModerationService';
import { Post } from '../src/types';

describe('DevFlow Feed & Moderation Engine', () => {
  let rankingEngine: FeedRankingEngine;
  let moderationService: ModerationService;

  beforeEach(() => {
    rankingEngine = new FeedRankingEngine(1.8);
    moderationService = new ModerationService({
      bannedKeywords: ['crypto_scam', 'free_tokens'],
      maxPostsPerMinute: 2
    });
  });

  test('prioritizes fresh high-engagement posts over older high-vote posts', () => {
    const baseTime = new Date('2024-04-01T12:00:00Z');

    // Fresh post: 2 hours old with 20 upvotes
    const freshPost: Post = {
      id: 'p_fresh',
      authorId: 'dev_1',
      title: 'Building Distributed Raft in Go',
      contentMarkdown: '...',
      tags: ['go', 'distributed-systems'],
      upvotes: 20,
      reactions: {},
      createdAt: new Date('2024-04-01T10:00:00Z').toISOString()
    };

    // Stale post: 72 hours old with 100 upvotes
    const oldPost: Post = {
      id: 'p_old',
      authorId: 'dev_2',
      title: 'Intro to HTML',
      contentMarkdown: '...',
      tags: ['web'],
      upvotes: 100,
      reactions: {},
      createdAt: new Date('2024-03-29T12:00:00Z').toISOString()
    };

    const ranked = rankingEngine.rankPosts([oldPost, freshPost], baseTime);
    expect(ranked[0].id).toBe('p_fresh');
    expect(ranked[1].id).toBe('p_old');
  });

  test('moderation blocks prohibited spam keywords', () => {
    const res = moderationService.inspectContent('Earn crypto_scam fast', 'Click link');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('prohibited keyword');
  });

  test('enforces author posting rate limits within 60s window', () => {
    const userId = 'usr_spam_bot';
    expect(moderationService.checkRateLimit(userId, 1000)).toBe(true);
    expect(moderationService.checkRateLimit(userId, 2000)).toBe(true);
    expect(moderationService.checkRateLimit(userId, 3000)).toBe(false); // 3rd post in 1m blocked
  });
});
