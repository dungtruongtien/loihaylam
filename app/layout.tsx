import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { I18nProvider } from '@/components/I18nProvider';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://boardgame.sh'),
  title: { default: 'Boardgame.sh — Free Online Group Games', template: '%s | Boardgame.sh' },
  description: 'Play Truth or Dare, Werewolf (Ma Sói) and more free online group games. No sign-up needed — play instantly in your browser!',
  openGraph: { type: 'website', siteName: 'Boardgame.sh', locale: 'en_US' },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* display=optional: browser uses system font immediately, loads Inter in background — eliminates font-caused LCP delay */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=optional" rel="stylesheet" />
        {/* lazyOnload: AdSense loads only after all page content is done — doesn't block LCP/FCP */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5200581180131547"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body>
        <I18nProvider>
          <div className="ad-rail left">
            <ins className="adsbygoogle"
              style={{ display: 'block', maxWidth: 160, width: 160, height: 600 } as React.CSSProperties}
              data-ad-client="ca-pub-5200581180131547"
              data-ad-slot="1234567890"
              data-ad-format="auto"
              data-adtest="off" />
          </div>
          <div className="ad-rail right">
            <ins className="adsbygoogle"
              style={{ display: 'block', maxWidth: 160, width: 160, height: 600 } as React.CSSProperties}
              data-ad-client="ca-pub-5200581180131547"
              data-ad-slot="1234567890"
              data-ad-format="auto"
              data-adtest="off" />
          </div>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
