import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import HomePageContent from '@/components/HomePageContent';

export const metadata: Metadata = {
  title: 'Boardgame.sh — Online Group Games: Truth or Dare, Werewolf',
  description: 'Play Truth or Dare and Werewolf online free with friends. No sign-up, no app required — play right in your browser!',
  keywords: ['truth or dare', 'lói hay làm', 'ma sói', 'werewolf online', 'trò chơi nhóm', 'boardgame online', 'party game'],
  openGraph: {
    title: 'Boardgame.sh — Free Online Group Games',
    description: 'Truth or Dare, Werewolf and more fun party games. Free, no sign-up!',
    url: 'https://boardgame.sh',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://boardgame.sh' },
  twitter: {
    card: 'summary_large_image',
    title: 'Boardgame.sh — Free Online Group Games',
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
        name: 'Boardgame.sh',
        url: 'https://boardgame.sh',
        description: 'Free online group games platform: Truth or Dare, Werewolf and more.',
        potentialAction: { '@type': 'SearchAction', target: 'https://boardgame.sh/?q={search_term_string}', 'query-input': 'required name=search_term_string' },
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Games on Boardgame.sh',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Truth or Dare', url: 'https://boardgame.sh/truthordare' },
          { '@type': 'ListItem', position: 2, name: 'Werewolf Online', url: 'https://boardgame.sh/werewolf' },
        ],
      })}} />

      <HomePageContent />

      <footer className="site-footer">
        <p><a href="/privacy">Privacy Policy / Chính sách bảo mật</a> &nbsp;·&nbsp; © 2025 Boardgame.sh</p>
      </footer>
    </>
  );
}
