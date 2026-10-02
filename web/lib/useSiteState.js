"use client";

// Các hook trạng thái dùng chung cho mọi trang client: ngôn ngữ, chế độ sáng/tối, tài khoản.
// Đồng bộ giữa các component (header ↔ nội dung trang) qua sự kiện window "bai-lang-change".

import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";

/**
 * Ngôn ngữ giao diện VI/EN, nhớ bằng localStorage.
 * `respectStored = false` dùng cho route ép ngôn ngữ (vd `/en`): không đọc giá trị đã lưu lúc mount.
 */
export function useLang(initial = "vi", respectStored = true) {
  const [lang, setLangState] = useState(initial);

  useEffect(() => {
    if (respectStored) {
      try {
        const saved = localStorage.getItem("lang");
        if (saved === "vi" || saved === "en") setLangState(saved);
      } catch {}
    }
    function onChange(e) {
      if (e.detail === "vi" || e.detail === "en") setLangState(e.detail);
    }
    window.addEventListener("bai-lang-change", onChange);
    return () => window.removeEventListener("bai-lang-change", onChange);
  }, [respectStored]);

  const setLang = useCallback((l) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
    window.dispatchEvent(new CustomEvent("bai-lang-change", { detail: l }));
  }, []);

  return [lang, setLang];
}

/**
 * Chế độ Sáng/Tối. Script inline trong layout.js đã đặt `data-theme` trước khi vẽ (chống nháy);
 * hook này đọc lại từ localStorage để chắc chắn khớp sau khi hydrate.
 */
export function useTheme() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const cur =
        saved === "dark" || saved === "light" ? saved : document.documentElement.dataset.theme;
      if (cur === "dark" || cur === "light") {
        setTheme(cur);
        document.documentElement.dataset.theme = cur;
      }
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        document.documentElement.dataset.theme = next;
        localStorage.setItem("theme", next);
      } catch {}
      return next;
    });
  }, []);

  return [theme, toggle];
}

/** Người dùng đang đăng nhập (Supabase Auth) — `undefined` khi chưa kiểm tra xong, `null` khi chưa đăng nhập. */
export function useAuthUser() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription?.unsubscribe();
  }, []);

  return user;
}
