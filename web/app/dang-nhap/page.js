"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { syncLocalSavedItems } from "../../lib/savedItems";
import { t } from "../../lib/i18n";
import { GoogleIcon } from "../../components/icons";

function DangNhapForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const [lang, setLang] = useState("vi");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "vi" || saved === "en") setLang(saved);
    } catch {}

    // Kiểm tra nếu đã đăng nhập thì chuyển hướng
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          router.replace(redirectPath);
        }
      });
    }
  }, [router, redirectPath]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!supabase) {
      setErrorMsg(t(lang, "configHint"));
      return;
    }
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMsg(
            lang === "vi"
              ? "Email hoặc mật khẩu không chính xác."
              : "Invalid email or password."
          );
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMsg(
            lang === "vi"
              ? "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác nhận."
              : "Email not confirmed. Please check your inbox to verify."
          );
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        await syncLocalSavedItems(data.user.id);
        router.push(redirectPath);
      }
    } catch (err) {
      setErrorMsg(
        lang === "vi"
          ? "Đã xảy ra lỗi kết nối. Vui lòng thử lại."
          : "A connection error occurred. Please try again."
      );
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!supabase) {
      setErrorMsg(t(lang, "configHint"));
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://bainews.site";

      const redirectTo = `${origin}${redirectPath === "/" ? "/tai-khoan" : redirectPath}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg(
        lang === "vi"
          ? "Không thể khởi động đăng nhập Google."
          : "Could not initiate Google sign-in."
      );
      setLoading(false);
    }
  }

  return (
    <main className="wrap auth-page-wrap">
      <div className="auth-card">
        <a href="/" className="detail-back">
          {t(lang, "backHome")}
        </a>

        <h1 className="auth-title">{t(lang, "login")}</h1>
        <p className="auth-subtitle">BAI News</p>

        {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label className="form-label">{t(lang, "email")}</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t(lang, "password")}</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? t(lang, "loadingMore") : t(lang, "login")}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t(lang, "orContinueWith")}</span>
        </div>

        <button
          type="button"
          className="auth-btn-google"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <GoogleIcon size={18} />
          <span>{t(lang, "loginWithGoogle")}</span>
        </button>

        <div className="auth-footer-link">
          <span>{t(lang, "noAccount")} </span>
          <a
            href={`/dang-ky${redirectPath !== "/" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
          >
            {t(lang, "registerNow")}
          </a>
        </div>
      </div>
    </main>
  );
}

export default function DangNhapPage() {
  return (
    <Suspense fallback={<main className="wrap auth-page-wrap"><p className="loadmore">...</p></main>}>
      <DangNhapForm />
    </Suspense>
  );
}
