/**
 * savedItems.js — Quản lý tin đã lưu theo tài khoản qua Supabase bảng `saved_items`.
 * Client-only (import bởi các client component).
 */

import { supabase } from "./supabaseClient";

/**
 * Lấy danh sách ID các tin đã lưu của user hiện tại.
 * @returns {Promise<number[]>} mảng các item_id
 */
export async function fetchUserSavedItemIds() {
  if (!supabase) return [];
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("saved_items")
      .select("item_id")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => row.item_id);
  } catch {
    return [];
  }
}

/**
 * Lưu 1 tin vào bảng saved_items.
 * @param {number} itemId
 * @returns {Promise<boolean>}
 */
export async function saveUserItem(itemId) {
  if (!supabase) return false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("saved_items").upsert(
      {
        user_id: user.id,
        item_id: Number(itemId),
      },
      { onConflict: "user_id, item_id" }
    );

    if (error) {
      console.error("Lỗi khi lưu tin:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Lỗi mạng khi lưu tin:", err);
    return false;
  }
}

/**
 * Xoá 1 tin khỏi bảng saved_items.
 * @param {number} itemId
 * @returns {Promise<boolean>}
 */
export async function removeUserSavedItem(itemId) {
  if (!supabase) return false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", Number(itemId));

    if (error) {
      console.error("Lỗi khi bỏ lưu tin:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Lỗi mạng khi bỏ lưu tin:", err);
    return false;
  }
}

/**
 * Tự động đồng bộ các tin đã lưu cũ từ localStorage (nếu có) lên Supabase khi user đăng nhập.
 * Sau khi đồng bộ thành công sẽ dọn dẹp localStorage để không lặp lại.
 * @param {string} userId
 */
export async function syncLocalSavedItems(userId) {
  if (!supabase || !userId) return;
  try {
    const oldRaw = localStorage.getItem("bai_saved_lists");
    if (!oldRaw) return;
    const parsed = JSON.parse(oldRaw);
    if (!parsed || !Array.isArray(parsed.saved) || parsed.saved.length === 0) {
      localStorage.removeItem("bai_saved_lists");
      return;
    }

    const itemIds = [...new Set(parsed.saved.map((s) => Number(s.itemId)).filter(Boolean))];
    if (itemIds.length > 0) {
      const rows = itemIds.map((id) => ({
        user_id: userId,
        item_id: id,
      }));
      await supabase.from("saved_items").upsert(rows, { onConflict: "user_id, item_id" });
    }
    localStorage.removeItem("bai_saved_lists");
  } catch {
    // Bỏ qua nếu lỗi parse
  }
}
