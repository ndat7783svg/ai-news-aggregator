import test from "node:test";
import assert from "node:assert/strict";

import {
  isAiTrendingRepo,
  parseTrendingRepoNames,
  toTrendingItem,
} from "../collectors/github.js";
import { sourcesForFilter } from "../web/lib/filters.js";
import { formatStars, sourceMeta } from "../web/lib/format.js";

test("parseTrendingRepoNames preserves the GitHub Trending ranking order", () => {
  const html = `
    <article class="Box-row"><h2><a href="/acme/first-ai"> acme / first-ai </a></h2></article>
    <article class="Box-row"><h2><a href="/other/second-ai">other / second-ai</a></h2></article>
  `;

  assert.deepEqual(parseTrendingRepoNames(html), ["acme/first-ai", "other/second-ai"]);
});

test("isAiTrendingRepo keeps matching topics or AI keywords and rejects unrelated repos", () => {
  assert.equal(isAiTrendingRepo({ topics: ["llm"], description: "A toolkit" }), true);
  assert.equal(isAiTrendingRepo({ topics: [], description: "Fast AI inference server" }), true);
  assert.equal(isAiTrendingRepo({ topics: ["game"], description: "A CSS framework" }), false);
});

test("toTrendingItem records the source, GitHub id, stars, language, and rank", () => {
  const item = toTrendingItem(
    {
      id: 42,
      full_name: "acme/first-ai",
      html_url: "https://github.com/acme/first-ai",
      owner: { login: "acme" },
      stargazers_count: 1234,
      language: "Python",
      description: "AI tools",
    },
    "daily",
    2,
    "2026-07-26T00:00:00.000Z"
  );

  assert.deepEqual(item, {
    source: "github_trending_daily",
    sourceId: "42",
    title: "acme/first-ai",
    url: "https://github.com/acme/first-ai",
    author: "acme",
    publishedAt: "2026-07-26T00:00:00.000Z",
    score: 1234,
    extra: { language: "Python", stars: 1234, abstract: "AI tools", rank: 2 },
  });
});

test("GitHub presentation uses compact star counts and groups daily and weekly Trending sources", () => {
  assert.equal(formatStars(158000), "158K");
  assert.equal(formatStars(1200), "1.2K");
  assert.equal(formatStars(800), "800");
  assert.deepEqual(sourcesForFilter("github_hot"), [
    "github_trending_daily",
    "github_trending_weekly",
  ]);
  assert.equal(sourceMeta("github_trending_daily").label, "🔥 Trending (ngày)");
});
