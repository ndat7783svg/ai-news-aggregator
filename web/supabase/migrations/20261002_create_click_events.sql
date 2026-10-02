-- ==============================================================================
-- Migration: Bảng click_events — đếm lượt bấm vào tin theo LOẠI TIN để biết người đọc
-- quan tâm gì nhất (GitHub / tin hãng AI / báo / HN / arXiv...).
-- KHÔNG lưu thông tin cá nhân: không IP, không tài khoản, không cookie.
-- Ngày tạo: 2026-10-02
-- Hướng dẫn: Supabase Dashboard -> project -> SQL Editor -> dán toàn bộ mã này -> "Run".
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.click_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_id BIGINT,
  source TEXT NOT NULL CHECK (char_length(source) <= 40),
  category TEXT NOT NULL CHECK (category IN
    ('github', 'hackernews', 'arxiv', 'blog_labs', 'blog_press', 'blog_news', 'reddit', 'other')),
  placement TEXT NOT NULL CHECK (placement IN
    ('feed', 'github_strip', 'rail_top', 'detail', 'related', 'github_page', 'saved')),
  lang TEXT CHECK (lang IN ('vi', 'en')),
  device TEXT CHECK (device IN ('mobile', 'desktop')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.click_events IS 'Lượt bấm vào tin (ẩn danh) — thống kê loại tin được quan tâm';

CREATE INDEX IF NOT EXISTS idx_click_events_created_at ON public.click_events(created_at DESC);

ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

-- Web (khoá anon) chỉ được GHI THÊM; không có policy SELECT → chỉ service_role đọc được số liệu.
DROP POLICY IF EXISTS "Anyone can log a click" ON public.click_events;
CREATE POLICY "Anyone can log a click"
  ON public.click_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
