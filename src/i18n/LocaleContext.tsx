"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Dictionary } from "./dictionaries/en";
import { DICTIONARIES, LOCALE_COOKIE_NAME, type Locale } from "./locale";

export type { Locale };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// One year — this is a plain preference, not session/auth state.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    // Server-rendered <html lang> only reflects the locale at the last page load; correct it
    // immediately client-side too so assistive tech picks up the change without a reload.
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: DICTIONARIES[locale] }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
