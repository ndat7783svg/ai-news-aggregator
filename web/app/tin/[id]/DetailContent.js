"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { t } from "../../../lib/i18n";
import { domainOf, relativeTime } from "../../../lib/format";
import { useLang, useAuthUser } from "../../../lib/useSiteState";
import { fetchUserSavedItemIds } from "../../../lib/savedItems";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import StoryActions from "../../../components/StoryActions";
import { StoryMeta, pickText } from "../../../components/NewsCard";
import { ExternalIcon } from "../../../components/icons";

/**
 * Client component con của /tin/[id]/page.js.
 * Ưu tiên `?lang=` trên URL (dùng cho link chia sẻ từ bot Facebook, luôn ép vi),
 * nếu không có mới đọc `localStorage` (mặc định "vi" cho khách mới).
 */
export default function DetailContent({ item, related = [] }) {
  const searchParams = useSearchParams();
  const urlLang = searchParams.get("lang");
  const forced = urlLang === "vi" || urlLang === "en" ? urlLang : null;
  // Có ?lang= trên URL → không đọc giá trị đã lưu lúc mount (URL thắng).
  const [lang, setLang] = useLang(forced || "vi", !forced);
  const user = useAuthUser();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      return;
    }
    fetchUserSavedItemIds().then((ids) => setIsSaved(ids.includes(item.id)));
  }, [user, item.id]);

  const { title, summary } = pickText(item, lang);
  const domain = domainOf(item.url);
  const homeHref = lang === "en" ? "/en" : "/";

  return (
    <>
      <SiteHeader lang={lang} onLangChange={setLang} />

      <main className="detail">
        <a href={homeHref} className="detail-back">
          {t(lang, "backHome")}
        </a>

        <article>
          <StoryMeta item={item} lang={lang} />
          <h1 className="detail-title">{title}</h1>
          {item.author && <p className="detail-author">{item.author}</p>}

          {summary && (
            <>
              <p className="detail-summary-label">{t(lang, "summaryLabel")}</p>
              <p className="detail-summary">{summary}</p>
            </>
          )}

          <div className="detail-cta">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-ink">
              {t(lang, "readAt")} {domain || t(lang, "readOriginal")}
              <ExternalIcon size={15} />
            </a>
            <StoryActions item={item} lang={lang} initialSaved={isSaved} showLabels />
          </div>
        </article>

        {related.length > 0 && (
          <section className="related">
            <div className="rail-block">
              <h2 className="rail-title">{t(lang, "relatedTitle")}</h2>
              <ul className="rail-list">
                {related.map((r) => (
                  <li key={r.id}>
                    <a href={`/tin/${r.id}`}>{pickText(r, lang).title}</a>
                    <span className="rail-meta" suppressHydrationWarning>
                      {domainOf(r.url)} · {relativeTime(r.published_at, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <SiteFooter lang={lang} />
    </>
  );
}
