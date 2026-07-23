-- Bảng lưu tin cho AI News Aggregator.
-- Cách dùng: Supabase Dashboard > SQL Editor > New query > dán toàn bộ file này > Run.

create table if not exists news_items (
  id            bigint generated always as identity primary key,
  source        text        not null,           -- tên nguồn (hackernews, arxiv, ...)
  source_id     text        not null,           -- id gốc từ nguồn (để chống trùng)
  title         text        not null,
  url           text        not null,           -- link bài gốc
  author        text,
  published_at  timestamptz,
  score         int,                             -- điểm HN; arXiv để trống
  summary_vi    text,
  summary_en    text,
  extra         jsonb       not null default '{}'::jsonb,  -- abstract, categories...
  collected_at  timestamptz not null default now(),
  unique (source, source_id)                     -- chống trùng: 1 tin/nguồn chỉ lưu 1 lần
);

-- Sắp feed theo thời gian đăng mới nhất.
create index if not exists news_items_published_idx
  on news_items (published_at desc nulls last);

-- Bật bảo mật hàng (RLS): cho phép ĐỌC công khai (frontend dùng anon key),
-- còn GHI chỉ qua service_role key (bypass RLS) từ script pipeline.
alter table news_items enable row level security;

drop policy if exists "public read" on news_items;
create policy "public read" on news_items for select using (true);
