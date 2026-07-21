import "./globals.css";
import { LocaleProvider } from "@/src/i18n/LocaleContext";
import { getServerLocale } from "@/src/i18n/getServerLocale";

export const metadata = {
  title: "AI Parliament",
  description: "Deliberation sandbox",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();

  return (
    <html lang={locale}>
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
