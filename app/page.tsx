import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import HomePageContent from '@/components/HomePageContent';

export const metadata: Metadata = {
  title: 'Broadgame.app — Online Group Games: Truth or Dare, Werewolf',
  description: 'Play Truth or Dare and Werewolf online free with friends. No sign-up, no app required — play right in your browser!',
  keywords: ['truth or dare', 'lói hay làm', 'ma sói', 'werewolf online', 'trò chơi nhóm', 'boardgame online', 'party game'],
  openGraph: {
    title: 'Broadgame.app — Free Online Group Games',
    description: 'Truth or Dare, Werewolf and more fun party games. Free, no sign-up!',
    url: 'https://broadgame.app',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://broadgame.app' },
  twitter: {
    card: 'summary_large_image',
    title: 'Broadgame.app — Free Online Group Games',
    description: 'Truth or Dare, Werewolf and more fun party games. Free, no sign-up!',
    images: ['/opengraph-image'],
  },
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Broadgame.app',
        url: 'https://broadgame.app',
        description: 'Free online group games platform: Truth or Dare, Werewolf and more.',
        potentialAction: { '@type': 'SearchAction', target: 'https://broadgame.app/?q={search_term_string}', 'query-input': 'required name=search_term_string' },
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Games on Broadgame.app',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Truth or Dare', url: 'https://broadgame.app/truthordare' },
          { '@type': 'ListItem', position: 2, name: 'Werewolf Online', url: 'https://broadgame.app/werewolf' },
        ],
      })}} />

      <HomePageContent />

      <footer className="site-footer">
        <p><a href="/privacy">Privacy Policy / Chính sách bảo mật</a> &nbsp;·&nbsp; © 2025 Broadgame.app</p>
      </footer>
    </>
  );
}
