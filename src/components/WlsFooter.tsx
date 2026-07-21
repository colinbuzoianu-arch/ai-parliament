import Image from "next/image";
import wlsMark from "@/src/lib/wls_mark_v4_cream.png";

// Subtle WLS attribution for the public-facing pages only (root + permalink) — not shown on
// the internal /admin page. The mark's own background is a warm off-white close enough to
// the site's white background that it needs no special blending; the circular crop below
// just tidies the small unused cream margin around the seal into a clean round badge.
export function WlsFooter() {
  return (
    <footer className="wls-footer">
      <Image src={wlsMark} alt="World Legal Service" width={22} height={22} className="wls-footer-mark" />
      <span>An initiative of World Legal Service</span>
    </footer>
  );
}
