// Cấu hình chung cho phần thu thập tin.
// Giữ tập trung ở đây để sau này dễ chỉnh mà không phải sửa từng collector.

// Từ khoá coi là "tin AI" khi lọc Hacker News.
// Dùng dạng chữ thường, so khớp không phân biệt hoa/thường.
export const AI_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "llm",
  "gpt",
  "chatgpt",
  "claude",
  "gemini",
  "llama",
  "mistral",
  "machine learning",
  "deep learning",
  "neural network",
  "transformer",
  "diffusion",
  "openai",
  "anthropic",
  "hugging face",
  "huggingface",
  "agent",
  "rag",
  "fine-tune",
  "fine tuning",
  "inference",
];

// Các từ khoá truy vấn Algolia HN Search. Lưu ý: Algolia KHÔNG hỗ trợ toán tử OR
// (mọi từ trong 1 truy vấn bị AND lại), nên ta gọi từng từ riêng rồi gộp kết quả.
export const HN_SEARCH_TERMS = [
  "AI",
  "LLM",
  "GPT",
  "Claude",
  "OpenAI",
  "Anthropic",
  "machine learning",
];

// Chỉ lấy tin trong khoảng thời gian gần đây (giờ).
export const RECENT_WINDOW_HOURS = 48;

// Số lượng tối đa lấy về mỗi nguồn (bản đầu giữ nhỏ để dễ xem).
export const MAX_ITEMS_PER_SOURCE = 20;

// Các chuyên mục arXiv cần theo dõi.
export const ARXIV_CATEGORIES = ["cs.AI", "cs.LG", "cs.RO"];
