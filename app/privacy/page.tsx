import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Broadgame.app.',
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="container" style={{ padding: '3rem 1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Privacy Policy</h1>
        <div style={{ color: 'var(--text-muted)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p>Last updated: March 2025</p>
          <p>This site uses Google AdSense to display ads. AdSense may collect cookies to serve personalized ads. We do not collect or store any personal information beyond what is required for the game session (player names, stored only temporarily in server memory and SQLite).</p>
          <p>Player names and game room data are deleted after the game session ends. We do not require account registration.</p>
          <p>For questions, contact us at the GitHub repository.</p>
        </div>
        <Link href="/" style={{ display: 'inline-block', marginTop: '2rem' }}>← Back to games</Link>
      </main>
      <footer className="site-footer">
        <p>© 2025 Broadgame.app</p>
      </footer>
    </>
  );
}
