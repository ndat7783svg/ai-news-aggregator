// Collector: GitHub — Releases của repo AI lớn, và "Trending" (thay bằng Search API chính thức).
// Dùng api.github.com (khác github.com). Không cần token, nhưng nếu có GITHUB_TOKEN thì hạn mức cao hơn.

import { fetchJson } from "../lib/http.js";
import {
  GITHUB_RELEASE_REPOS,
  GITHUB_TRENDING_TOPICS,
  GITHUB_TRENDING_DAYS,
  MAX_ITEMS_PER_SOURCE,
} from "../lib/config.js";

const GH = "https://api.github.com";

function ghHeaders() {
  const h = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ai-news-aggregator/0.1",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

/** Bản phát hành mới nhất của các repo AI lớn. */
export async function collectGithubReleases() {
  const out = [];
  for (const repo of GITHUB_RELEASE_REPOS) {
    try {
      const rels = await fetchJson(`${GH}/repos/${repo}/releases?per_page=3`, {
        headers: ghHeaders(),
      });
      for (const r of rels) {
        if (r.draft) continue;
        out.push({
          source: "github_release",
          sourceId: String(r.id),
          title: `${repo} ${r.name || r.tag_name}`,
          url: r.html_url,
          author: repo,
          publishedAt: r.published_at || r.created_at || null,
          score: null,
          extra: {
            repo,
            tag: r.tag_name,
            abstract: (r.body || "").replace(/\r?\n/g, " ").slice(0, 500),
          },
        });
      }
    } catch (e) {
      console.error(`  ⚠ GitHub releases ${repo} lỗi: ${e.message}`);
    }
  }
  return out;
}

/** "Trending" AI: repo tạo gần đây, sắp theo số sao (GitHub Search API chính thức). */
export async function collectGithubTrending() {
  const since = new Date(Date.now() - GITHUB_TRENDING_DAYS * 86400e3)
    .toISOString()
    .slice(0, 10);
  const byId = new Map();

  for (const topic of GITHUB_TRENDING_TOPICS) {
    try {
      const q = encodeURIComponent(`topic:${topic} created:>${since}`);
      const data = await fetchJson(
        `${GH}/search/repositories?q=${q}&sort=stars&order=desc&per_page=5`,
        { headers: ghHeaders() }
      );
      for (const repo of data.items || []) {
        if (byId.has(repo.id)) continue;
        byId.set(repo.id, {
          source: "github_trending",
          sourceId: String(repo.id),
          title: repo.full_name,
          url: repo.html_url,
          author: repo.owner?.login ?? null,
          publishedAt: repo.created_at || null,
          score: repo.stargazers_count ?? null,
          extra: {
            language: repo.language,
            stars: repo.stargazers_count,
            abstract: repo.description || "",
          },
        });
      }
    } catch (e) {
      console.error(`  ⚠ GitHub trending topic ${topic} lỗi: ${e.message}`);
    }
  }

  // Sắp theo sao giảm dần rồi cắt bớt.
  return [...byId.values()]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, MAX_ITEMS_PER_SOURCE);
}
