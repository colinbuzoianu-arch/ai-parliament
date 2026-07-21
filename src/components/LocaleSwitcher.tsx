"use client";

import { useLocale, type Locale } from "@/src/i18n/LocaleContext";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
  { code: "fr", label: "FR" },
];

// Shared across the two public-facing pages (root + permalink) — never rendered on /admin,
// which stays English-only as an internal tool.
export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="locale-switcher" role="group" aria-label="Language">
      {LOCALES.map((l, i) => (
        <span key={l.code} style={{ display: "inline-flex", alignItems: "center" }}>
          <button
            type="button"
            className={`locale-switcher-btn ${locale === l.code ? "locale-switcher-btn--active" : ""}`}
            onClick={() => setLocale(l.code)}
            aria-pressed={locale === l.code}
          >
            {l.label}
          </button>
          {i < LOCALES.length - 1 && <span className="locale-switcher-sep">|</span>}
        </span>
      ))}
    </div>
  );
}
