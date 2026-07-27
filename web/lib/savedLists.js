/**
 * savedLists.js — Quản lý danh sách lưu tin trong localStorage.
 * Client-only (import bởi các client component); không có "use client" vì đây là module JS thuần.
 * Tất cả hàm bọc try/catch — localStorage có thể bị chặn ở chế độ ẩn danh (Safari private).
 *
 * Cấu trúc khoá "bai_saved_lists":
 * {
 *   lists: {
 *     "default": { name: "Đã lưu", createdAt: "..." },
 *     "<uuid>":  { name: "...", createdAt: "..." },
 *   },
 *   saved: [
 *     { itemId: 123, listId: "default", savedAt: "..." },
 *   ],
 * }
 */

const STORAGE_KEY = "bai_saved_lists";

const DEFAULT_STATE = () => ({
  lists: {
    default: { name: "Đã lưu", createdAt: new Date().toISOString() },
  },
  saved: [],
});

/** Đọc toàn bộ state từ localStorage. Trả default nếu chưa có hoặc lỗi. */
export function getState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE();
    const parsed = JSON.parse(raw);
    // Đảm bảo danh sách "default" luôn tồn tại (phòng trường hợp dữ liệu bị xoá lẻ tẻ).
    if (!parsed.lists) parsed.lists = {};
    if (!parsed.lists.default) {
      parsed.lists.default = { name: "Đã lưu", createdAt: new Date().toISOString() };
    }
    if (!Array.isArray(parsed.saved)) parsed.saved = [];
    return parsed;
  } catch {
    return DEFAULT_STATE();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Lưu tin vào một danh sách (mặc định: "default"). Bỏ qua nếu đã có. */
export function saveItem(itemId, listId = "default") {
  try {
    const state = getState();
    const alreadyIn = state.saved.some(
      (s) => s.itemId === itemId && s.listId === listId
    );
    if (alreadyIn) return true;
    state.saved.push({ itemId, listId, savedAt: new Date().toISOString() });
    return saveState(state);
  } catch {
    return false;
  }
}

/** Xoá tin khỏi một danh sách cụ thể. */
export function removeItem(itemId, listId) {
  try {
    const state = getState();
    state.saved = state.saved.filter(
      (s) => !(s.itemId === itemId && s.listId === listId)
    );
    return saveState(state);
  } catch {
    return false;
  }
}

/** Xoá tin khỏi TẤT CẢ danh sách (dùng khi bấm bỏ lưu nhanh). */
export function removeItemFromAll(itemId) {
  try {
    const state = getState();
    state.saved = state.saved.filter((s) => s.itemId !== itemId);
    return saveState(state);
  } catch {
    return false;
  }
}

/** Tạo danh sách mới. Trả về listId mới hoặc null nếu lỗi. */
export function createList(name) {
  try {
    const state = getState();
    const listId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `list_${Date.now()}`;
    state.lists[listId] = { name: name.trim(), createdAt: new Date().toISOString() };
    saveState(state);
    return listId;
  } catch {
    return null;
  }
}

/** Đổi tên danh sách (kể cả "default"). */
export function renameList(listId, name) {
  try {
    const state = getState();
    if (!state.lists[listId]) return false;
    state.lists[listId].name = name.trim();
    return saveState(state);
  } catch {
    return false;
  }
}

/** Xoá danh sách và toàn bộ tin trong đó. KHÔNG cho xoá "default". */
export function deleteList(listId) {
  if (listId === "default") return false;
  try {
    const state = getState();
    if (!state.lists[listId]) return false;
    delete state.lists[listId];
    state.saved = state.saved.filter((s) => s.listId !== listId);
    return saveState(state);
  } catch {
    return false;
  }
}

/** Kiểm tra tin có trong bất kỳ danh sách nào không. */
export function isSaved(itemId) {
  try {
    const state = getState();
    return state.saved.some((s) => s.itemId === itemId);
  } catch {
    return false;
  }
}

/** Trả mảng listId mà tin đang nằm trong đó. */
export function getListsForItem(itemId) {
  try {
    const state = getState();
    return state.saved
      .filter((s) => s.itemId === itemId)
      .map((s) => s.listId);
  } catch {
    return [];
  }
}
