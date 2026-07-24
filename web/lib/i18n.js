// Chuỗi giao diện song ngữ. Nội dung tin (tóm tắt) lấy từ DB theo ngôn ngữ chọn;
// còn các nhãn cố định của web thì lấy ở đây.

const STRINGS = {
  vi: {
    tagline: "Tổng hợp & tóm tắt tin tức, kèm nguồn.",
    themeToDark: "Chuyển chế độ tối",
    themeToLight: "Chuyển chế độ sáng",
    all: "Tất cả",
    filterBlogLabs: "Blog hãng AI",
    filterBlogPress: "Báo công nghệ",
    filterBlogNews: "Newsletter",
    readOriginal: "Đọc bài gốc",
    empty: "Chưa có tin nào trong cơ sở dữ liệu.",
    errorPrefix: "Lỗi tải dữ liệu",
    configHint:
      "Chưa cấu hình Supabase. Thêm SUPABASE_URL và SUPABASE_ANON_KEY vào web/.env.local rồi tải lại trang.",
    itemsSuffix: "tin",
    updatedAuto: "Cập nhật tự động",
    loadingMore: "Đang tải thêm…",
    end: "— Đã hết tin —",
    sourceLabel: "Nguồn",
    sortLabel: "Sắp xếp",
    sortNew: "Mới nhất",
    sortHot: "Nổi bật nhất",
    timeLabel: "Thời gian",
    timeAll: "Mọi lúc",
    timeToday: "Hôm nay",
    timeWeek: "Tuần này",
    timeMonth: "Tháng này",
    timeYear: "Năm này",
  },
  en: {
    tagline: "News, summarized, with sources.",
    themeToDark: "Switch to dark mode",
    themeToLight: "Switch to light mode",
    all: "All",
    filterBlogLabs: "AI Labs",
    filterBlogPress: "Tech Press",
    filterBlogNews: "Newsletters",
    readOriginal: "Read original",
    empty: "No items in the database yet.",
    errorPrefix: "Failed to load data",
    configHint:
      "Supabase not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to web/.env.local and reload.",
    itemsSuffix: "items",
    updatedAuto: "Auto-updated",
    loadingMore: "Loading more…",
    end: "— No more items —",
    sourceLabel: "Source",
    sortLabel: "Sort",
    sortNew: "Latest",
    sortHot: "Top",
    timeLabel: "Time",
    timeAll: "All time",
    timeToday: "Today",
    timeWeek: "This week",
    timeMonth: "This month",
    timeYear: "This year",
  },
};

export function t(lang, key) {
  return (STRINGS[lang] || STRINGS.vi)[key] ?? key;
}
