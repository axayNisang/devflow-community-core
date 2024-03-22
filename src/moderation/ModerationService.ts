import { ModerationRule } from '../types';

export class ModerationService {
  private postTimestampsByUser: Map<string, number[]> = new Map();

  constructor(private rules: ModerationRule) {}

  public inspectContent(title: string, content: string): { allowed: boolean; reason?: string } {
    const lowerText = `${title} ${content}`.toLowerCase();
    for (const word of this.rules.bannedKeywords) {
      if (lowerText.includes(word.toLowerCase())) {
        return { allowed: false, reason: `Content contains prohibited keyword: ${word}` };
      }
    }
    return { allowed: true };
  }

  public checkRateLimit(userId: string, nowMs: number = Date.now()): boolean {
    const timestamps = this.postTimestampsByUser.get(userId) || [];
    const windowStart = nowMs - 60000; // last 1 minute
    const recent = timestamps.filter(t => t > windowStart);

    if (recent.length >= this.rules.maxPostsPerMinute) {
      return false; // Rate limit exceeded
    }

    recent.push(nowMs);
    this.postTimestampsByUser.set(userId, recent);
    return true;
  }
}
