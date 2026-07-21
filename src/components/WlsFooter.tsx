"use client";

import Image from "next/image";
import wlsMark from "@/src/lib/wls_mark_v4_cream.png";
import { useLocale } from "@/src/i18n/LocaleContext";

// Subtle WLS attribution for the public-facing pages only (root + permalink) — not shown on
// the internal /admin page. The mark's own background is a warm off-white close enough to
// the site's white background that it needs no special blending; the circular crop below
// just tidies the small unused cream margin around the seal into a clean round badge.
export function WlsFooter() {
  const { t } = useLocale();
  return (
    <footer className="wls-footer">
      <Image src={wlsMark} alt="World Legal Service" width={22} height={22} className="wls-footer-mark" />
      <span>{t.footer.initiative}</span>
    </footer>
  );
}
