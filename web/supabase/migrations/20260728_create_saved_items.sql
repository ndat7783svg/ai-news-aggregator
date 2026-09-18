-- ==============================================================================
-- Migration: Tạo bảng saved_items lưu tin theo tài khoản và kích hoạt RLS
-- Ngày tạo: 2026-07-28
-- Hướng dẫn: Mở Supabase Dashboard -> chọn project -> SQL Editor -> dán toàn bộ
-- mã này và bấm "Run".
-- ==============================================================================

-- 1. Tạo bảng saved_items liên kết auth.users và public.news_items
CREATE TABLE IF NOT EXISTS public.saved_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL REFERENCES public.news_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT saved_items_user_item_unique UNIQUE (user_id, item_id)
);

-- 2. Đặt comment mô tả cho bảng
COMMENT ON TABLE public.saved_items IS 'Lưu trữ danh sách tin tức yêu thích theo từng tài khoản người dùng';

-- 3. Tạo index tăng tốc độ query danh sách tin đã lưu của user
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON public.saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_created_at ON public.saved_items(created_at DESC);

-- 4. Bật Row Level Security (RLS) để đảm bảo bảo mật dữ liệu
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- 5. Policy: Người dùng đã đăng nhập chỉ được xem (SELECT) các tin do chính mình lưu
DROP POLICY IF EXISTS "Users can select their own saved items" ON public.saved_items;
CREATE POLICY "Users can select their own saved items"
  ON public.saved_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Policy: Người dùng đã đăng nhập chỉ được thêm (INSERT) tin cho chính mình
DROP POLICY IF EXISTS "Users can insert their own saved items" ON public.saved_items;
CREATE POLICY "Users can insert their own saved items"
  ON public.saved_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. Policy: Người dùng đã đăng nhập chỉ được xoá (DELETE) tin của chính mình
DROP POLICY IF EXISTS "Users can delete their own saved items" ON public.saved_items;
CREATE POLICY "Users can delete their own saved items"
  ON public.saved_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
