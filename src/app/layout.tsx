import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getCurrentUser } from "@/server/auth/session";
import { getHeaderCounts } from "@/server/services/users";
import { getSettings } from "@/server/services/settings";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import { siteUrl } from "@/lib/utils";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} — קונים ומוכרים. פשוט.`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: "website", locale: "he_IL", siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e7c66",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const counts = user ? await getHeaderCounts(user.id) : { unreadMessages: 0 };

  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <Providers>
          <a href="#main" className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
            דילוג לתוכן הראשי
          </a>
          {settings.announcement && (
            <div className="bg-primary-800 px-4 py-2 text-center text-sm text-white">{settings.announcement}</div>
          )}
          <Header />
          <main id="main" className="min-h-[60vh]">
            {children}
          </main>
          <Footer />
          <BottomNav unreadMessages={counts.unreadMessages} isLoggedIn={!!user} />
        </Providers>
      </body>
    </html>
  );
}
