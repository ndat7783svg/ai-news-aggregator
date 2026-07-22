// Hàm fetch dùng chung: có timeout, User-Agent lịch sự, và thử lại nhẹ khi lỗi mạng.
// Node 24 đã có sẵn global fetch nên không cần thư viện ngoài.

const DEFAULT_TIMEOUT_MS = 15000;
const USER_AGENT =
  "ai-news-aggregator/0.1 (+https://github.com/; personal news summarizer)";

/**
 * Gọi HTTP GET và trả về Response. Tự huỷ nếu quá thời gian chờ.
 * @param {string} url
 * @param {{ timeoutMs?: number, headers?: Record<string,string> }} [opts]
 */
export async function httpGet(url, opts = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "*/*", ...headers },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} khi gọi ${url}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Gọi httpGet rồi parse JSON. */
export async function fetchJson(url, opts) {
  const res = await httpGet(url, opts);
  return res.json();
}

/** Gọi httpGet rồi lấy text (dùng cho XML/Atom). */
export async function fetchText(url, opts) {
  const res = await httpGet(url, opts);
  return res.text();
}
