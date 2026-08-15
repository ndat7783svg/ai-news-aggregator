// Tóm tắt AI song ngữ (Việt + Anh) cho mỗi tin, dùng GPT-5.6 Luna (OpenAI).
// Đọc API key từ biến môi trường OPENAI_API_KEY.

import OpenAI from "openai";

// GPT-5.6 Luna: rẻ, nhanh, đủ tốt cho tóm tắt ngắn. Model ID chính thức trên OpenAI API.
const MODEL = "gpt-5.6-luna";

// Nguyên tắc dịch tiêu đề — dùng chung cho bước tóm tắt và bước backfill.
const TITLE_RULES = `Dịch tiêu đề sang tiếng Việt tự nhiên, gọn. GIỮ NGUYÊN, KHÔNG dịch: tên riêng; tên người/công ty/sản phẩm; tên repo/dự án (vd "ggml-org/llama.cpp"); tên giao thức/công nghệ/viết tắt (vd BitTorrent, LLM, GPU, API, RAG, Transformer); mã phiên bản/build (vd "b10092"); tên người dùng. Chỉ dịch phần câu chữ mô tả xung quanh các tên đó. Ví dụ: "Petals: Run LLMs at home, BitTorrent-style" -> "Petals: Chạy LLM tại nhà, theo phong cách BitTorrent".`;

// JSON Schema cho structured outputs (Chat Completions response_format).
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
    .replace(/^OPENAI_API_KEY\s*=\s*/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

let client = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: cleanKey(process.env.OPENAI_API_KEY) });
  return client;
}

/**
 * Tóm tắt 1 tin. Trả về item mới có thêm { summaryVi, summaryEn }.
 * Nếu lỗi, trả về item kèm summaryError để không làm chết cả mẻ.
 * Có thể nhận response.usage qua tham số onUsage để đo chi phí (như translateTitle).
 */
export async function summarizeItem(item, { onUsage } = {}) {
  try {
    const res = await getClient().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserContent(item) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "news_summary",
          strict: true,
          schema: OUTPUT_SCHEMA,
        },
      },
    });
    if (onUsage && res.usage) onUsage(res.usage);

    // Structured outputs trả JSON trong content của message đầu tiên.
    const parsed = JSON.parse(res.choices[0].message.content);

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

// Chỉ dịch TIÊU ĐỀ (cho backfill tin cũ — không tạo lại tóm tắt, rẻ hơn)
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
    const res = await getClient().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 300,
      messages: [
        { role: "system", content: TITLE_SYSTEM },
        { role: "user", content: `Tiêu đề: ${item.title}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "title_translation",
          strict: true,
          schema: TITLE_SCHEMA,
        },
      },
    });
    if (onUsage && res.usage) onUsage(res.usage);
    return { ...item, titleVi: JSON.parse(res.choices[0].message.content).title_vi };
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
