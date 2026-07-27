// Collector: GitHub — Releases của repo AI lớn, và "Trending" (thay bằng Search API chính thức).
// Dùng api.github.com (khác github.com). Không cần token, nhưng nếu có GITHUB_TOKEN thì hạn mức cao hơn.

import * as cheerio from "cheerio";
import { fetchJson, fetchText } from "../lib/http.js";
import {
  AI_KEYWORDS,
  GITHUB_RELEASE_REPOS,
  GITHUB_TRENDING_TOPICS,
  GITHUB_TRENDING_PUSHED_DAYS,
  GITHUB_TRENDING_MIN_STARS,
  GITHUB_TRENDING_PER_TOPIC,
  GITHUB_TRENDING_MAX,
  GITHUB_CLASSICS_MIN_STARS,
  GITHUB_CLASSICS_PER_TOPIC,
  GITHUB_CLASSICS_MAX,
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

/** Lấy owner/repo theo đúng thứ tự xếp hạng mà github.com/trending hiển thị. */
export function parseTrendingRepoNames(html) {
  const $ = cheerio.load(html);
  const names = [];
  $("article.Box-row h2 a").each((_, link) => {
    const href = $(link).attr("href") || "";
    const name = href.replace(/^\//, "").replace(/\/$/, "");
    if (/^[^/]+\/[^/]+$/.test(name)) names.push(name);
  });
  return names;
}

/** Chỉ giữ repo AI theo topic chuẩn hoặc từ khóa mô tả, tránh lẫn repo game/web không liên quan. */
export function isAiTrendingRepo(repo) {
  const topics = new Set((repo.topics || []).map((topic) => String(topic).toLowerCase()));
  if (GITHUB_TRENDING_TOPICS.some((topic) => topics.has(topic.toLowerCase()))) return true;

  const description = String(repo.description || "").toLowerCase();
  // So khớp theo RANH GIỚI TỪ cho mọi từ khoá (không chỉ từ ngắn): khớp kiểu "chứa chuỗi con"
  // làm "storage"/"fragment"/"dragon" dính từ khoá "rag" → repo không liên quan AI lọt vào feed.
  return AI_KEYWORDS.some((keyword) => {
    const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(description);
  });
}

/** Chuẩn hóa 1 repo Trending thành item dùng chung cho pipeline. */
export function toTrendingItem(repo, period, rank, publishedAt = new Date().toISOString()) {
  return {
    source: `github_trending_${period}`,
    sourceId: String(repo.id),
    title: repo.full_name,
    url: repo.html_url,
    author: repo.owner?.login ?? null,
    publishedAt,
    score: repo.stargazers_count ?? null,
    extra: {
      language: repo.language,
      stars: repo.stargazers_count,
      abstract: repo.description || "",
      rank,
    },
  };
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

/** "Repo kinh điển" AI: repo nổi lâu, nhiều sao (>= 5000 sao), không giới hạn ngày push (Search API). */
export async function collectGithubClassics() {
  const byId = new Map();

  for (const topic of GITHUB_TRENDING_TOPICS) {
    try {
      const q = encodeURIComponent(
        `topic:${topic} stars:>${GITHUB_CLASSICS_MIN_STARS}`
      );
      const data = await fetchJson(
        `${GH}/search/repositories?q=${q}&sort=stars&order=desc&per_page=${GITHUB_CLASSICS_PER_TOPIC}`,
        { headers: ghHeaders() }
      );
      for (const repo of data.items || []) {
        if (byId.has(repo.id)) continue;
        byId.set(repo.id, {
          source: "github_classics",
          sourceId: String(repo.id),
          title: repo.full_name,
          url: repo.html_url,
          author: repo.owner?.login ?? null,
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
      console.error(`  ⚠ GitHub repo kinh điển topic ${topic} lỗi: ${e.message}`);
    }
  }

  return [...byId.values()]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, GITHUB_CLASSICS_MAX);
}

/** Trending thật từ github.com/trending, sau đó lọc lại theo chủ đề AI bằng REST API. */
export async function collectGithubTrendingScrape(period) {
  if (period !== "daily" && period !== "weekly" && period !== "monthly") {
    throw new Error(`GitHub Trending period không hợp lệ: ${period}`);
  }

  const html = await fetchText(`https://github.com/trending?since=${period}`, {
    headers: ghHeaders(),
  });
  const repoNames = parseTrendingRepoNames(html).slice(0, 25);
  const publishedAt = new Date().toISOString();
  const items = await Promise.all(
    repoNames.map(async (fullName, index) => {
      try {
        const repo = await fetchJson(`${GH}/repos/${fullName}`, { headers: ghHeaders() });
        return isAiTrendingRepo(repo)
          ? toTrendingItem(repo, period, index + 1, publishedAt)
          : null;
      } catch (e) {
        console.error(`  ⚠ GitHub Trending ${period} ${fullName} lỗi: ${e.message}`);
        return null;
      }
    })
  );

  return items.filter(Boolean);
}
