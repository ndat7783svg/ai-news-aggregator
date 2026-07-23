// Chuỗi giao diện song ngữ. Nội dung tin (tóm tắt) lấy từ DB theo ngôn ngữ chọn;
// còn các nhãn cố định của web thì lấy ở đây.

const STRINGS = {
  vi: {
    tagline: "Tổng hợp & tóm tắt tin tức AI, kèm nguồn.",
    all: "Tất cả",
    readOriginal: "Đọc bài gốc",
    empty: "Chưa có tin nào trong cơ sở dữ liệu.",
    errorPrefix: "Lỗi tải dữ liệu",
    configHint:
      "Chưa cấu hình Supabase. Thêm SUPABASE_URL và SUPABASE_ANON_KEY vào web/.env.local rồi tải lại trang.",
    itemsSuffix: "tin",
    updatedAuto: "Cập nhật tự động",
  },
  en: {
    tagline: "AI news, summarized, with sources.",
    all: "All",
    readOriginal: "Read original",
    empty: "No items in the database yet.",
    errorPrefix: "Failed to load data",
    configHint:
      "Supabase not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to web/.env.local and reload.",
    itemsSuffix: "items",
    updatedAuto: "Auto-updated",
  },
};

export function t(lang, key) {
  return (STRINGS[lang] || STRINGS.vi)[key] ?? key;
}
