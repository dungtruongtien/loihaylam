import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { I18nProvider } from '@/components/I18nProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://boardgame.sh'),
  title: { default: 'Boardgame.sh — Trò Chơi Nhóm Online Miễn Phí', template: '%s | Boardgame.sh' },
  description: 'Chơi Truth or Dare, Ma Sói và nhiều trò chơi nhóm vui nhộn miễn phí. Không cần đăng ký, chơi ngay trên trình duyệt!',
  openGraph: { type: 'website', siteName: 'Boardgame.sh', locale: 'vi_VN' },
};

export const viewport = {
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5200581180131547"
          crossOrigin="anonymous"
          strategy="afterInteractive"
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
