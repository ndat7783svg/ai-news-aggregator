/**
 * share.js — Chia sẻ 1 tin qua Web Share API (mobile) hoặc copy link (desktop).
 * Client-only; import bởi các client component.
 */

/**
 * Chia sẻ tin ra ngoài với URL trỏ về trang chi tiết BAI News.
 * Trả về "shared" | "copied" | "error".
 */
export async function shareItem(item, lang) {
  const url = `https://bainews.site/tin/${item.id}`;
  const title = lang === "vi" ? item.title_vi || item.title : item.title;
  const text = (
    lang === "vi" ? item.summary_vi : item.summary_en
  )?.slice(0, 120);

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ url, title, text });
      return "shared";
    }
    // Fallback: copy link
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    // Người dùng bấm Huỷ trên popup share native → bỏ qua.
    // Clipboard cũng thất bại → vẫn không crash trang.
    return "error";
  }
}
