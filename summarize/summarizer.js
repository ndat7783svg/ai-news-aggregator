// Tóm tắt AI song ngữ (Việt + Anh) cho mỗi tin, dùng Claude Haiku.
// Đọc API key từ biến môi trường ANTHROPIC_API_KEY (SDK tự lấy).

import Anthropic from "@anthropic-ai/sdk";

// Haiku 4.5: rẻ, nhanh, đủ tốt cho tóm tắt ngắn. Đây là model spec đã chọn.
const MODEL = "claude-haiku-4-5";

// Nguyên tắc dịch tiêu đề — dùng chung cho bước tóm tắt và bước backfill.
const TITLE_RULES = `Dịch tiêu đề sang tiếng Việt tự nhiên, gọn. GIỮ NGUYÊN, KHÔNG dịch: tên riêng; tên người/công ty/sản phẩm; tên repo/dự án (vd "ggml-org/llama.cpp"); tên giao thức/công nghệ/viết tắt (vd BitTorrent, LLM, GPU, API, RAG, Transformer); mã phiên bản/build (vd "b10092"); tên người dùng. Chỉ dịch phần câu chữ mô tả xung quanh các tên đó. Ví dụ: "Petals: Run LLMs at home, BitTorrent-style" -> "Petals: Chạy LLM tại nhà, theo phong cách BitTorrent".`;

// Ràng buộc đầu ra thành đúng JSON (structured outputs): dịch tiêu đề + tóm tắt song ngữ.
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    title_vi: { type: "string", description: "Tiêu đề dịch sang tiếng Việt (giữ nguyên tên riêng/repo/phiên bản)" },
    summary_vi: { type: "string", description: "Tóm tắt tiếng Việt, 2-4 câu" },
    summary_en: { type: "string", description: "English summary, 2-4 sentences" },
  },
  required: ["title_vi", "summary_vi", "summary_en"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `Bạn là trợ lý tóm tắt tin tức công nghệ, chuyên về AI.
Với mỗi tin: (1) dịch tiêu đề sang tiếng Việt (title_vi), (2) viết tóm tắt NGẮN GỌN bằng CẢ tiếng Việt lẫn tiếng Anh, mỗi bản 2-4 câu.
Nguyên tắc bắt buộc:
- Dịch tiêu đề: ${TITLE_RULES}
- Tóm tắt chỉ dựa vào thông tin được cung cấp (tiêu đề, và tóm lược gốc nếu có). KHÔNG bịa thêm số liệu, tên, kết quả không có trong dữ liệu.
- Nếu chỉ có tiêu đề (không có tóm lược), diễn giải ý của tiêu đề một cách khách quan, không thêm chi tiết cụ thể không chắc chắn.
- Văn phong trung lập, thông tin, không lời mở đầu kiểu "Đây là...".
- Không sao chép nguyên văn đoạn dài từ nguồn — viết lại bằng lời của bạn.
- title_vi và summary_vi PHẢI viết hoàn toàn bằng tiếng Việt (chữ Quốc ngữ), TUYỆT ĐỐI không lẫn
  chữ Hán/Trung/Nhật/Hàn hay ký tự ngôn ngữ khác, kể cả khi nguồn gốc có nhắc tới Trung Quốc/Nhật/Hàn.`;

// Tạo phần nội dung gửi cho model từ 1 item theo khuôn dữ liệu chung.
function buildUserContent(item) {
  const lines = [
    `Nguồn: ${item.source}`,
    `Tiêu đề: ${item.title}`,
  ];
  if (item.extra?.abstract) {
    lines.push(`Tóm lược gốc (abstract): ${item.extra.abstract}`);
  } else {
    lines.push("(Không có tóm lược gốc — chỉ có tiêu đề.)");
  }
  return lines.join("\n");
}

// Chuẩn hoá key: bỏ prefix "TÊN=", dấu nháy, khoảng trắng thừa khi dán secret lỗi.
// (Cùng tinh thần với db/supabase.js — tránh lặp lại sự cố key hỏng trên GitHub.)
function cleanKey(raw) {
  return (raw || "")
    .trim()
    .replace(/^ANTHROPIC_API_KEY\s*=\s*/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

let client = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: cleanKey(process.env.ANTHROPIC_API_KEY) });
  return client;
}

/**
 * Tóm tắt 1 tin. Trả về item mới có thêm { summaryVi, summaryEn }.
 * Nếu lỗi, trả về item kèm summaryError để không làm chết cả mẻ.
 * Có thể nhận response.usage qua tham số onUsage để đo chi phí (như translateTitle).
 */
export async function summarizeItem(item, { onUsage } = {}) {
  try {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserContent(item) }],
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    });
    if (onUsage && res.usage) onUsage(res.usage);

    // Structured outputs trả JSON trong block text đầu tiên.
    const textBlock = res.content.find((b) => b.type === "text");
    const parsed = JSON.parse(textBlock.text);

    return {
      ...item,
      titleVi: parsed.title_vi,
      summaryVi: parsed.summary_vi,
      summaryEn: parsed.summary_en,
    };
  } catch (err) {
    return { ...item, summaryError: err.message, summaryErrorStatus: err.status };
  }
}

// Chỉ dịch TIÊU ĐỀ (cho backfill tin cũ — không tạo lại tóm tắt, rẻ hơn).
const TITLE_SCHEMA = {
  type: "object",
  properties: {
    title_vi: { type: "string", description: "Tiêu đề dịch sang tiếng Việt" },
  },
  required: ["title_vi"],
  additionalProperties: false,
};

const TITLE_SYSTEM = `Bạn dịch tiêu đề tin công nghệ AI sang tiếng Việt. ${TITLE_RULES} Chỉ trả tiêu đề tiếng Việt, không thêm gì khác. title_vi PHẢI viết hoàn toàn bằng tiếng Việt (chữ Quốc ngữ), TUYỆT ĐỐI không lẫn chữ Hán/Trung/Nhật/Hàn hay ký tự ngôn ngữ khác.`;

/**
 * Dịch riêng tiêu đề 1 tin. Trả về item kèm { titleVi } (hoặc titleError nếu lỗi).
 * Có thể nhận response.usage qua tham số onUsage để đo chi phí.
 */
export async function translateTitle(item, { onUsage } = {}) {
  try {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: 300,
      system: TITLE_SYSTEM,
      messages: [{ role: "user", content: `Tiêu đề: ${item.title}` }],
      output_config: { format: { type: "json_schema", schema: TITLE_SCHEMA } },
    });
    if (onUsage && res.usage) onUsage(res.usage);
    const textBlock = res.content.find((b) => b.type === "text");
    return { ...item, titleVi: JSON.parse(textBlock.text).title_vi };
  } catch (err) {
    return { ...item, titleError: err.message, titleErrorStatus: err.status };
  }
}

/** Dịch tiêu đề cho nhiều tin, song song có giới hạn. */
export async function translateTitles(items, { concurrency = 3, onUsage } = {}) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await translateTitle(items[idx], { onUsage });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * Tóm tắt nhiều tin, chạy song song có giới hạn để tránh dồn quá nhiều request.
 * @param {Array} items
 * @param {{ concurrency?: number, onUsage?: (usage: object) => void }} [opts]
 */
export async function summarizeMany(items, { concurrency = 3, onUsage } = {}) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await summarizeItem(items[idx], { onUsage });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}
