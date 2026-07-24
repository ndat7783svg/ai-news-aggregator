// Tóm tắt AI song ngữ (Việt + Anh) cho mỗi tin, dùng Claude Haiku.
// Đọc API key từ biến môi trường ANTHROPIC_API_KEY (SDK tự lấy).

import Anthropic from "@anthropic-ai/sdk";

// Haiku 4.5: rẻ, nhanh, đủ tốt cho tóm tắt ngắn. Đây là model spec đã chọn.
const MODEL = "claude-haiku-4-5";

// Ràng buộc đầu ra thành đúng JSON có 2 trường tóm tắt (structured outputs).
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    summary_vi: { type: "string", description: "Tóm tắt tiếng Việt, 2-4 câu" },
    summary_en: { type: "string", description: "English summary, 2-4 sentences" },
  },
  required: ["summary_vi", "summary_en"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `Bạn là trợ lý tóm tắt tin tức công nghệ, chuyên về AI.
Với mỗi tin, viết tóm tắt NGẮN GỌN bằng CẢ tiếng Việt lẫn tiếng Anh, mỗi bản 2-4 câu.
Nguyên tắc bắt buộc:
- Chỉ dựa vào thông tin được cung cấp (tiêu đề, và tóm lược gốc nếu có). KHÔNG bịa thêm số liệu, tên, kết quả không có trong dữ liệu.
- Nếu chỉ có tiêu đề (không có tóm lược), diễn giải ý của tiêu đề một cách khách quan, không thêm chi tiết cụ thể không chắc chắn.
- Văn phong trung lập, thông tin, không lời mở đầu kiểu "Đây là...".
- Không sao chép nguyên văn đoạn dài từ nguồn — viết lại bằng lời của bạn.`;

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
 */
export async function summarizeItem(item) {
  try {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserContent(item) }],
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    });

    // Structured outputs trả JSON trong block text đầu tiên.
    const textBlock = res.content.find((b) => b.type === "text");
    const parsed = JSON.parse(textBlock.text);

    return {
      ...item,
      summaryVi: parsed.summary_vi,
      summaryEn: parsed.summary_en,
    };
  } catch (err) {
    return { ...item, summaryError: err.message, summaryErrorStatus: err.status };
  }
}

/**
 * Tóm tắt nhiều tin, chạy song song có giới hạn để tránh dồn quá nhiều request.
 * @param {Array} items
 * @param {{ concurrency?: number }} [opts]
 */
export async function summarizeMany(items, { concurrency = 3 } = {}) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await summarizeItem(items[idx]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}
