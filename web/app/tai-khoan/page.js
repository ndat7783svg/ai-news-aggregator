"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { fetchUserSavedItemIds } from "../../lib/savedItems";
import { t } from "../../lib/i18n";
import { BookmarkIcon, UserIcon } from "../../components/icons";

export default function TaiKhoanPage() {
  const router = useRouter();
  const [lang, setLang] = useState("vi");
  const [user, setUser] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "vi" || saved === "en") setLang(saved);
    } catch {}

    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/dang-nhap?redirect=/tai-khoan");
        return;
      }
      setUser(user);
      const savedIds = await fetchUserSavedItemIds();
      setSavedCount(savedIds.length);
      setLoading(false);
    });
  }, [router]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="wrap auth-page-wrap">
        <p className="loadmore">{t(lang, "loadingMore")}</p>
      </main>
    );
  }

  if (!user) return null;

  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <main className="wrap auth-page-wrap">
      <div className="auth-card account-card">
        <a href="/" className="detail-back">
          {t(lang, "backHome")}
        </a>

        <div className="account-header">
          <div className="account-avatar">
            <UserIcon size={32} />
          </div>
          <div>
            <h1 className="account-name">{displayName}</h1>
            <p className="account-email">{user.email}</p>
          </div>
        </div>

        <div className="account-badge-row">
          <span className="account-badge-label">{t(lang, "memberLevel")}:</span>
          <span className="account-badge">{t(lang, "memberStatus")}</span>
        </div>

        <div className="account-actions">
          <a href="/da-luu" className="account-saved-link">
            <BookmarkIcon size={18} />
            <span>
              {t(lang, "navSaved")} ({savedCount})
            </span>
            <span className="arrow-right">→</span>
          </a>

          <button
            type="button"
            className="auth-btn-danger"
            onClick={handleLogout}
          >
            {t(lang, "logout")}
          </button>
        </div>
      </div>
    </main>
  );
}
