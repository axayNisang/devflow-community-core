import express, { Request, Response } from 'express';
import { FeedRankingEngine } from './feed/FeedRankingEngine';
import { ModerationService } from './moderation/ModerationService';
import { Post } from './types';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const rankingEngine = new FeedRankingEngine(1.8);
const moderation = new ModerationService({
  bannedKeywords: ['crypto_scam', 'free_tokens', 'phishing_link'],
  maxPostsPerMinute: 2
});

const posts: Post[] = [];

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'devflow-community-core' }));

app.post('/api/posts', (req: Request, res: Response) => {
  const { authorId, title, contentMarkdown, tags } = req.body;
  if (!authorId || !title) return res.status(400).json({ error: 'authorId and title are required' });

  // Rate limit
  if (!moderation.checkRateLimit(authorId)) {
    return res.status(429).json({ error: 'Rate limit exceeded: max 2 posts per minute' });
  }

  // Spam inspection
  const inspection = moderation.inspectContent(title, contentMarkdown || '');
  if (!inspection.allowed) {
    return res.status(422).json({ error: inspection.reason });
  }

  const post: Post = {
    id: `post_${uuidv4().replace(/-/g, '').slice(0, 8)}`,
    authorId,
    title,
    contentMarkdown: contentMarkdown || '',
    tags: tags || [],
    upvotes: 1,
    reactions: {},
    createdAt: new Date().toISOString()
  };

  posts.push(post);
  return res.status(201).json(post);
});

app.get('/api/feed', (req, res) => {
  const ranked = rankingEngine.rankPosts(posts);
  return res.json(ranked);
});

app.post('/api/posts/:id/upvote', (req: Request, res: Response) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.upvotes += 1;
  return res.json({ id: post.id, upvotes: post.upvotes });
});

const PORT = 8086;
app.listen(PORT, () => console.log(`[DevFlow] Running on port ${PORT}`));
