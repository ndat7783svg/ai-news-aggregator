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

// Blog chính thức có RSS (đã kiểm tra truy cập được). slug = tên nguồn dùng cho badge.
// Anthropic & Meta AI không có RSS chính thức nên tạm bỏ qua (không scraping).
export const BLOG_FEEDS = [
  { slug: "openai", name: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { slug: "deepmind", name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml" },
  { slug: "huggingface", name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
  { slug: "mistral", name: "Mistral AI", url: "https://mistral.ai/rss.xml" },
  { slug: "bair", name: "Berkeley BAIR", url: "https://bair.berkeley.edu/blog/feed.xml" },
  { slug: "simonwillison", name: "Simon Willison", url: "https://simonwillison.net/atom/everything/" },
  { slug: "techcrunch", name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { slug: "theverge", name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { slug: "arstechnica", name: "Ars Technica AI", url: "https://arstechnica.com/ai/feed/" },
  { slug: "venturebeat", name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
  { slug: "technologyreview", name: "MIT Technology Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { slug: "importai", name: "Import AI", url: "https://importai.substack.com/feed" },
  { slug: "thegradient", name: "The Gradient", url: "https://thegradient.pub/rss/" },
];

// Repo AI lớn để lấy Releases (qua GitHub REST API chính thức).
export const GITHUB_RELEASE_REPOS = [
  "ggml-org/llama.cpp",
  "huggingface/transformers",
  "comfyanonymous/ComfyUI",
  "vllm-project/vllm",
  "ollama/ollama",
  "ggml-org/whisper.cpp",
  "unslothai/unsloth",
  "sgl-project/sglang",
];

// "Trending" thay thế bằng GitHub Search API: repo tạo gần đây, nhiều sao, theo các topic AI.
export const GITHUB_TRENDING_TOPICS = ["llm", "ai-agent", "generative-ai"];
export const GITHUB_TRENDING_DAYS = 30; // chỉ xét repo tạo trong N ngày gần đây

// Subreddit theo dõi (qua Reddit API OAuth — cần credential).
export const REDDIT_SUBREDDITS = ["LocalLLaMA", "MachineLearning", "robotics"];
