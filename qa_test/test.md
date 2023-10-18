# Senior Manual QA Test Report: DevFlow Community Core & Feed Engine

**Role:** Senior Manual QA Tester / Community Trust & Safety Reviewer  
**Target Service:** `devflow-community-core`  
**Protocol:** REST API over HTTP  
**Port:** 8086  
**Test Date:** 2026-11-25  
**Overall Verdict:** PASSED (Content moderation, rate limiting, and ranking verified)

---

## 1. Scope & Test Objectives
As a Senior QA Tester, I manually tested the live HTTP server for `devflow-community-core`. The goal was validating community safety, anti-abuse controls, rate-limiting thresholds, and feed ranking math under realistic user traffic.

Scenarios tested:
1. **Service Readiness:** `/health` check.
2. **Article Publishing:** Creating technical posts with markdown formatting and metadata tags.
3. **Automated Content Moderation (Edge Case):** Ingesting content containing blacklisted phishing and spam terms (`crypto_scam`, `free_tokens`, `phishing_link`). The server must block posting with HTTP 422 Unprocessable Entity.
4. **Community Engagement & Upvoting:** Voting on posts to influence ranking.
5. **Anti-Spam Sliding-Window Rate Limiting (Edge Case):** Attempting to publish 3 posts within 60 seconds from the same user. The 3rd attempt must be rejected with HTTP 429 Too Many Requests.
6. **Time-Decay Ranking Feed:** Verifying the Hacker News gravity algorithm:
   $$\text{Score} = \frac{U - 1}{(T + 2)^{1.8}}$$
   Ensuring top-voted fresh articles surface at the top with computed `rankingScore`.

---

## 2. Live Step-by-Step Execution & Results

### Step 1: Healthcheck
- **Description:** Verifies service uptime.
- **Command:**
```bash
curl -i -X GET http://localhost:8086/health
```
- **Live Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"UP","service":"devflow-community-core"}
```
- **Verdict:** PASSED.

---

### Step 2: Publish Legitimate Technical Article
- **Description:** Author `usr_dev_101` publishes an article about distributed key-value stores.
- **Command:**
```bash
curl -i -X POST http://localhost:8086/api/posts \
  -H 'Content-Type: application/json' \
  -d '{
    "authorId": "usr_dev_101",
    "title": "Scaling Distributed Key-Value Store with Raft",
    "contentMarkdown": "In this deep dive, we explore raft consensus and log compaction...",
    "tags": ["distributed-systems", "raft", "golang"]
  }'
```
- **Live Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "id": "post_f0d0da58",
  "authorId": "usr_dev_101",
  "title": "Scaling Distributed Key-Value Store with Raft",
  "contentMarkdown": "In this deep dive, we explore raft consensus and log compaction...",
  "tags": ["distributed-systems", "raft", "golang"],
  "upvotes": 1,
  "reactions": {},
  "createdAt": "2026-11-25T13:10:06.426Z"
}
```
- **Verdict:** PASSED. Post accepted and assigned unique identifier.

---

### Step 3: [Edge Case] Moderation Spam Filter Rejection
- **Description:** Adversary attempts to publish scam content with prohibited keywords (`free_tokens`, `phishing_link`).
- **Command:**
```bash
curl -i -X POST http://localhost:8086/api/posts \
  -H 'Content-Type: application/json' \
  -d '{
    "authorId": "usr_spammer_99",
    "title": "Claim your free_tokens now on discord!",
    "contentMarkdown": "Click this phishing_link to get free rewards",
    "tags": ["giveaway"]
  }'
```
- **Live Response:**
```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json; charset=utf-8

{"error":"Content contains prohibited keyword: free_tokens"}
```
- **Verdict:** PASSED. Server blocked spam ingestion with HTTP 422.

---

### Step 4: Upvote Article
- **Description:** User casts an upvote for `post_f0d0da58`.
- **Command:**
```bash
curl -i -X POST http://localhost:8086/api/posts/post_f0d0da58/upvote
```
- **Live Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":"post_f0d0da58","upvotes":2}
```
- **Verdict:** PASSED. Upvote counter incremented to 2.

---

### Step 5 & 6: [Edge Case] Rate Limit Enforcement
- **Description:** User `usr_dev_101` posts a second article, and then immediately attempts a third article within 60 seconds (limit is 2 posts/min).
- **Command (3rd Attempt):**
```bash
curl -i -X POST http://localhost:8086/api/posts \
  -H 'Content-Type: application/json' \
  -d '{
    "authorId": "usr_dev_101",
    "title": "Spamming quickly without waiting",
    "contentMarkdown": "Should be blocked by rate limiter",
    "tags": ["spam"]
  }'
```
- **Live Response:**
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json; charset=utf-8

{"error":"Rate limit exceeded: max 2 posts per minute"}
```
- **Verdict:** PASSED. Rate limit policy triggered HTTP 429.

---

### Step 7: Hacker News Gravity Feed Algorithm
- **Description:** Requests ranked community feed. The 2-upvote post must rank above the 1-upvote post.
- **Command:**
```bash
curl -i -X GET http://localhost:8086/api/feed
```
- **Live Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  {
    "id": "post_f0d0da58",
    "title": "Scaling Distributed Key-Value Store with Raft",
    "upvotes": 2,
    "rankingScore": 0.2872
  },
  {
    "id": "post_76b75d3c",
    "title": "Optimizing Postgres Index Performance",
    "upvotes": 1,
    "rankingScore": 0
  }
]
```
- **Verdict:** PASSED. Scoring mathematically validated and sorted in descending rank order.
