// Dùng chung client + server: thuộc tính data-* gắn vào link tin để ClickTracker (layout.js)
// nhận ra và gửi lượt bấm ẩn danh về /api/track. Giá trị `placement` phải nằm trong danh sách
// cho phép ở API + ràng buộc CHECK của bảng click_events.

import { SOURCE_FILTERS } from "./filters";

export const PLACEMENTS = [
  "feed",
  "github_strip",
  "rail_top",
  "detail",
  "related",
  "github_page",
  "saved",
];

export function trackProps(item, placement) {
  return {
    "data-track-id": item.id,
    "data-track-source": item.source,
    "data-track-place": placement,
  };
}

/** Nguồn → nhóm loại tin (github / hackernews / arxiv / blog_labs / blog_press / blog_news / reddit). */
export function categoryOf(source) {
  const f = SOURCE_FILTERS.find((x) => !x.parent && x.sources.includes(source));
  return f ? f.key : "other";
}
