import { cookies } from "next/headers";
import { isLocale, type Locale } from "./locale";

// Server-only: reads the locale cookie for the initial page load (sets <html lang> and seeds
// LocaleProvider). Client-side locale switches happen entirely in LocaleContext without
// needing this — this only matters for what the very first server-rendered response says.
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("locale")?.value;
  return isLocale(raw) ? raw : "en";
}
