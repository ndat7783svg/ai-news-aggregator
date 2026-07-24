// Collector: GitHub — Releases của repo AI lớn, và "Trending" (thay bằng Search API chính thức).
// Dùng api.github.com (khác github.com). Không cần token, nhưng nếu có GITHUB_TOKEN thì hạn mức cao hơn.

import { fetchJson } from "../lib/http.js";
import {
  GITHUB_RELEASE_REPOS,
  GITHUB_TRENDING_TOPICS,
  GITHUB_TRENDING_PUSHED_DAYS,
  GITHUB_TRENDING_MIN_STARS,
  GITHUB_TRENDING_PER_TOPIC,
  GITHUB_TRENDING_MAX,
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

/** "Repo nổi bật" AI: repo nhiều sao còn hoạt động gần đây, sắp theo số sao (GitHub Search API). */
export async function collectGithubTrending() {
  // Chỉ xét repo còn được push (còn "sống") trong N ngày gần đây — không lọc theo ngày TẠO,
  // nên cả repo lớn kinh điển đang bảo trì lẫn repo mới hot đều lọt vào.
  const pushedSince = new Date(Date.now() - GITHUB_TRENDING_PUSHED_DAYS * 86400e3)
    .toISOString()
    .slice(0, 10);
  const byId = new Map();

  for (const topic of GITHUB_TRENDING_TOPICS) {
    try {
      const q = encodeURIComponent(
        `topic:${topic} pushed:>${pushedSince} stars:>${GITHUB_TRENDING_MIN_STARS}`
      );
      const data = await fetchJson(
        `${GH}/search/repositories?q=${q}&sort=stars&order=desc&per_page=${GITHUB_TRENDING_PER_TOPIC}`,
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
          // Dùng ngày hoạt động gần nhất làm mốc thời gian → repo lớn đang bảo trì nổi lên đầu
          // feed thay vì chìm vì "tạo lâu rồi".
          publishedAt: repo.pushed_at || repo.created_at || null,
          score: repo.stargazers_count ?? null,
          extra: {
            language: repo.language,
            stars: repo.stargazers_count,
            abstract: repo.description || "",
          },
        });
      }
    } catch (e) {
      console.error(`  ⚠ GitHub repo nổi bật topic ${topic} lỗi: ${e.message}`);
    }
  }

  // Sắp theo sao giảm dần rồi cắt bớt tổng.
  return [...byId.values()]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, GITHUB_TRENDING_MAX);
}
