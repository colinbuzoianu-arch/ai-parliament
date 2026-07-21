// Plain data/logic shared by both the client context (LocaleContext.tsx, "use client") and
// server-only code (getServerLocale.ts). Deliberately has no "use client" directive: Next.js
// treats every export of a "use client" file as a client-component reference, so a server
// module can't import a plain function like isLocale() from one — it has to live here instead.

import { en, type Dictionary } from "./dictionaries/en";
import { de } from "./dictionaries/de";
import { fr } from "./dictionaries/fr";

export type Locale = "en" | "de" | "fr";

export const LOCALE_COOKIE_NAME = "locale";

export const DICTIONARIES: Record<Locale, Dictionary> = { en, de, fr };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "de" || value === "fr";
}
