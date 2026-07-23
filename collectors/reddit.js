// Collector: Reddit (r/LocalLLaMA, r/MachineLearning, r/robotics) qua API OAuth chính thức.
// Cần REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET trong .env (tạo "app" tại reddit.com/prefs/apps).
// Nếu thiếu credential thì bỏ qua nguồn này (không làm chết pipeline).

import { REDDIT_SUBREDDITS, MAX_ITEMS_PER_SOURCE } from "../lib/config.js";

// Reddit yêu cầu User-Agent mô tả rõ ràng, nếu không sẽ bị chặn.
const USER_AGENT = "web:ai-news-aggregator:0.1 (news summarizer)";

let tokenCache = { token: null, exp: 0 };

async function getToken() {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (tokenCache.token && Date.now() < tokenCache.exp) return tokenCache.token;

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`Reddit auth HTTP ${res.status} — kiểm tra CLIENT_ID/SECRET và loại app`);
  const j = await res.json();
  tokenCache = { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return tokenCache.token;
}

async function collectSub(sub, token) {
  const res = await fetch(`https://oauth.reddit.com/r/${sub}/hot?limit=10&raw_json=1`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();

  return (j.data?.children || [])
    .map((c) => c.data)
    .filter((p) => p && !p.stickied)
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map((p) => ({
      source: "reddit",
      sourceId: p.id,
      title: p.title,
      // Bài link -> URL ngoài; bài tự đăng -> trang thảo luận trên Reddit.
      url: p.url && !p.is_self ? p.url : `https://www.reddit.com${p.permalink}`,
      author: p.author ? `u/${p.author}` : null,
      publishedAt: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
      score: typeof p.score === "number" ? p.score : null,
      extra: {
        subreddit: sub,
        permalink: `https://www.reddit.com${p.permalink}`,
        abstract: (p.selftext || "").replace(/\s+/g, " ").slice(0, 500),
      },
    }));
}

export async function collectReddit() {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.error("  ⚠ Reddit: chưa cấu hình REDDIT_CLIENT_ID/SECRET → bỏ qua.");
    return [];
  }

  let token;
  try {
    token = await getToken();
  } catch (e) {
    console.error(`  ⚠ Reddit đăng nhập lỗi: ${e.message}`);
    return [];
  }

  const results = await Promise.allSettled(
    REDDIT_SUBREDDITS.map((sub) => collectSub(sub, token))
  );
  const items = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") items.push(...r.value);
    else console.error(`  ⚠ Reddit r/${REDDIT_SUBREDDITS[i]} lỗi: ${r.reason?.message || r.reason}`);
  });
  return items;
}
