import "./globals.css";

export const metadata = {
  title: "AI Parliament",
  description: "Deliberation sandbox",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
        {children}
      </body>
    </html>
  );
}
