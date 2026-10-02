"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { t } from "../../lib/i18n";
import { useLang } from "../../lib/useSiteState";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { GoogleIcon } from "../../components/icons";

function DangKyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Chỉ chấp nhận đường dẫn NỘI BỘ ("/..."), chặn "//domain" hoặc "https://..." để không bị
  // lợi dụng chuyển người dùng sang trang lạ sau khi đăng nhập (open redirect).
  const rawRedirect = searchParams.get("redirect") || "/";
  const redirectPath =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.startsWith("/\\")
      ? rawRedirect
      : "/";

  const [lang] = useLang();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          router.replace(redirectPath);
        }
      });
    }
  }, [router, redirectPath]);

  async function handleRegister(e) {
    e.preventDefault();
    if (!supabase) {
      setErrorMsg(t(lang, "configHint"));
      return;
    }

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setErrorMsg(t(lang, "nameRequired"));
      return;
    }

    if (password.length < 6) {
      setErrorMsg(t(lang, "passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t(lang, "passwordMismatch"));
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://bainews.site";

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: trimmedName,
            full_name: trimmedName,
          },
          emailRedirectTo: `${origin}/tai-khoan`,
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setErrorMsg(
            lang === "vi"
              ? "Email này đã được đăng ký. Vui lòng đăng nhập."
              : "This email is already registered. Please sign in."
          );
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      // Nếu Supabase trả về user nhưng session là null (do cần email confirm)
      if (data?.user && !data?.session) {
        setSuccessMsg(true);
      } else if (data?.session) {
        // Nếu project tắt email confirm thì đăng nhập luôn
        router.push(redirectPath);
      }
    } catch (err) {
      setErrorMsg(
        lang === "vi"
          ? "Đã xảy ra lỗi kết nối. Vui lòng thử lại."
          : "A connection error occurred. Please try again."
      );
    } finally {
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
          ? "Không thể khởi động đăng ký qua Google."
          : "Could not initiate Google sign-up."
      );
      setLoading(false);
    }
  }

  return (
    <>
    <SiteHeader />
    <main className="wrap auth-page-wrap">
      <div className="auth-card">
        <a href="/" className="detail-back">
          {t(lang, "backHome")}
        </a>

        <h1 className="auth-title">{t(lang, "register")}</h1>
        <p className="auth-subtitle">BAI News</p>

        {successMsg ? (
          <div className="auth-success-box">
            <div className="auth-success-icon">✉️</div>
            <h2 className="auth-success-title">{t(lang, "checkEmailVerify")}</h2>
            <p className="auth-success-desc">
              {lang === "vi"
                ? `Chúng tôi đã gửi liên kết xác nhận đến địa chỉ email ${email}. Vui lòng mở hộp thư (kiểm tra cả mục Thư rác/Spam) và bấm vào link để kích hoạt tài khoản.`
                : `We have sent a verification link to ${email}. Please check your inbox (including Spam folder) and click the link to activate your account.`}
            </p>
            <a href="/dang-nhap" className="auth-btn-primary" style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}>
              {t(lang, "loginNow")}
            </a>
          </div>
        ) : (
          <>
            {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label className="form-label">{t(lang, "fullName")}</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={lang === "vi" ? "Ví dụ: Nguyễn Văn A" : "e.g. John Doe"}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t(lang, "email")}</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
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
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t(lang, "confirmPassword")}</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={loading}
              >
                {loading ? t(lang, "loadingMore") : t(lang, "register")}
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
              <span>{t(lang, "registerWithGoogle")}</span>
            </button>

            <div className="auth-footer-link">
              <span>{t(lang, "hasAccount")} </span>
              <a
                href={`/dang-nhap${redirectPath !== "/" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
              >
                {t(lang, "loginNow")}
              </a>
            </div>
          </>
        )}
      </div>
    </main>
    <SiteFooter lang={lang} />
    </>
  );
}

export default function DangKyPage() {
  return (
    <Suspense fallback={<main className="wrap auth-page-wrap"><p className="loadmore">...</p></main>}>
      <DangKyForm />
    </Suspense>
  );
}
