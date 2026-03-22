import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import WerewolfGame from '@/components/werewolf/WerewolfGame';

export const metadata: Metadata = {
  title: 'Werewolf Online — Free Multiplayer Social Deduction Game | Boardgame.sh',
  description: 'Play Werewolf (Ma Sói) online free with friends. Create a room, get a secret role, discuss and vote. No sign-up, works on any device.',
  keywords: ['werewolf online multiplayer', 'play werewolf online free', 'werewolf game no download', 'ma sói online miễn phí', 'social deduction game browser', 'werewolf online', 'ma soi online'],
  openGraph: {
    title: 'Werewolf Online — Free Multiplayer Game | Boardgame.sh',
    description: 'Who is the Wolf? Discuss, deduce, and vote. Free multiplayer — no sign-up needed.',
    url: 'https://boardgame.sh/werewolf',
    images: [{ url: '/werewolf/opengraph-image', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://boardgame.sh/werewolf' },
  twitter: {
    card: 'summary_large_image',
    title: 'Werewolf Online — Free Multiplayer Game | Boardgame.sh',
    description: 'Who is the Wolf? Discuss, deduce, and vote. Free multiplayer — no sign-up needed.',
    images: ['/werewolf/opengraph-image'],
  },
};

const HOW_TO_PLAY = [
  { step: '1', title: 'Create or join a room', desc: 'The host creates a room and shares the 6-character code. Other players enter the code to join on their own devices.' },
  { step: '2', title: 'Receive your secret role', desc: 'Each player privately views their role — Wolf or Villager. Don\'t show anyone your screen!' },
  { step: '3', title: 'Night Phase', desc: 'Wolves secretly vote to eliminate a Villager. Villagers wait with eyes closed.' },
  { step: '4', title: 'Day Phase', desc: 'Everyone discusses who might be a Wolf. After the timer ends, players vote to eliminate one suspect.' },
  { step: '5', title: 'Win the game', desc: 'Villagers win by eliminating all Wolves. Wolves win when they equal or outnumber the Villagers.' },
];

const ROLES = [
  { icon: '🐺', name: 'Wolf', color: '#fca5a5', desc: 'Wolves know who their teammates are. Each night, wolves vote together to eliminate a villager. During the day, they must blend in and avoid suspicion.' },
  { icon: '🏡', name: 'Villager', color: '#93c5fd', desc: 'Villagers have no special abilities but outnumber the wolves at the start. Use logic, observation, and persuasion to identify and vote out the wolves.' },
];

const TIPS = [
  { title: 'Watch for inconsistencies', desc: 'Wolves often contradict themselves. Keep track of what everyone says across rounds.' },
  { title: 'Silence is suspicious', desc: 'Players who say little and avoid taking a stance are often trying to stay under the radar.' },
  { title: 'Wolves should act natural', desc: 'The best wolf players express genuine concern about finding wolves — without overdoing it.' },
  { title: 'Use the vote strategically', desc: 'If you\'re a villager, never vote with zero reasoning. Share your logic to build trust and rally others.' },
];

const FAQ = [
  { q: 'How many players does Werewolf need?', a: 'The game works with as few as 3 players, but the ideal experience is 6–12. More players means more chaos, more deduction, and more fun.' },
  { q: 'Do players need separate devices?', a: 'Yes — each player needs their own phone or computer so they can receive their secret role privately. The game runs on any modern browser.' },
  { q: 'How does the room code work?', a: 'The host creates a room and gets a unique 6-character code. Share it via chat, voice call, or just read it aloud. Players enter it on the join screen.' },
  { q: 'What happens if someone disconnects?', a: 'The game state is saved on the server. If a player refreshes the page or reconnects with the same player ID, they rejoin their room automatically.' },
  { q: 'Can the host change the number of wolves?', a: 'Yes. The host can adjust the wolf count and discussion timer length in the Settings panel before starting the game.' },
  { q: 'Is Werewolf free to play?', a: 'Completely free — no account, no downloads, no paywalls. Just create a room and share the code.' },
];

export default function WerewolfPage() {
  return (
    <>
      <SiteHeader />

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Game',
        name: 'Werewolf Online — Boardgame.sh',
        description: 'Free online multiplayer Werewolf game. Create a room, get secret roles, discuss and vote to eliminate wolves.',
        url: 'https://boardgame.sh/werewolf',
        genre: 'Social Deduction',
        numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 20 },
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Werewolf Online',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web Browser',
        url: 'https://boardgame.sh/werewolf',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: 'Free multiplayer Werewolf game. No download, no sign-up. Play instantly in your browser.',
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      })}} />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', padding: '3rem 1rem 2rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
            🐺 Werewolf Online
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            Free multiplayer social deduction game. Secret roles, hidden wolves, and one village to save.
          </p>
        </div>
      </section>

      <main>
        <WerewolfGame />

        {/* How to play */}
        <section style={{ padding: '3rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem', marginBottom: '2rem' }}>How to Play Werewolf</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {HOW_TO_PLAY.map((s) => (
                <div key={s.step} className="panel" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--wolf)', lineHeight: 1, flexShrink: 0 }}>{s.step}</span>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{s.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section style={{ padding: '3rem 1rem', borderTop: '1px solid var(--border)', background: '#fef2f2' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem', marginBottom: '2rem' }}>Roles Guide</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {ROLES.map((r) => (
                <div key={r.name} className="panel">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2rem' }}>{r.icon}</span>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: r.color }}>{r.name}</h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Strategy tips */}
        <section style={{ padding: '3rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem', marginBottom: '2rem' }}>Strategy Tips</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {TIPS.map((tip) => (
                <div key={tip.title} className="panel">
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>💡 {tip.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '3rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: 680 }}>
            <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem', marginBottom: '2rem' }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FAQ.map((item) => (
                <div key={item.q} className="panel">
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>{item.q}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '2.5rem 1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <div className="container">
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Looking for a different game?</p>
            <Link href="/truthordare" className="btn ghost">🃏 Try Truth or Dare →</Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p><Link href="/privacy">Privacy Policy</Link> &nbsp;·&nbsp; © 2025 Boardgame.sh</p>
      </footer>
    </>
  );
}
