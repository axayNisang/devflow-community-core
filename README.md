# DevFlow — Developer Community Platform Engine 💬

[![CI Pipeline](https://github.com/axayNisang/devflow-community-core/actions/workflows/ci.yml/badge.svg)](https://github.com/axayNisang/devflow-community-core/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%20%7C%2020-green.svg)](https://nodejs.org)

A high-performance developer community discussion platform backend engineered to handle high write concurrency, real-time feed ranking decay, and automated spam moderation.

---

## 🏛 System Architecture & Ranking Formula

```
                       User Post Submission
                                │
                                ▼
                 +-----------------------------+
                 |    Content Moderation Gate  |
                 |  (Spam AST & Sliding Rate)  |
                 +-----------------------------+
                                │
                                ▼
                 +-----------------------------+
                 |    Post Storage & Tagging   |
                 +-----------------------------+
                                │
                                ▼
                 +-----------------------------+
                 |   Feed Ranking Engine       |
                 |   Score = (U - 1)/(T + 2)^G |
                 +-----------------------------+
                                │
                                ▼
                 +-----------------------------+
                 |   Redis Hot Cache Expiration|
                 |    (Trending Feeds API)     |
                 +-----------------------------+
```

---

## 🌟 Key Engineering Features

- **Time-Decay Ranking Algorithm**: Ranks discussions using the time-decay gravity formula $Score = rac{U - 1}{(T + 2)^G}$, ensuring that freshly trending high-velocity technical discussions rise above older static posts.
- **Sliding-Window Rate Limiting**: Protects platform discussion boards from spam flooding by enforcing author rate limits per minute.
- **Content Moderation Filters**: Automated keyword inspection stops malicious spam before entering the database.

---

## 🧪 Testing

```bash
npm install
npm test
```

---

## 📄 License
MIT License. Created by [Akshay Nisang](https://github.com/axayNisang).
