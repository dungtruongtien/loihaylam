import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import TruthOrDareGame from '@/components/truthordare/TruthOrDareGame';

export const metadata: Metadata = {
  title: 'Truth or Dare Online — Free Card Game | Boardgame.sh',
  description: 'Play Truth or Dare free in your browser with friends. 67+ questions and challenges, no sign-up required. Perfect for parties, team building, and birthdays.',
  keywords: ['truth or dare', 'truth or dare online', 'party game', 'card game', 'team building game', 'dare questions'],
  openGraph: {
    title: 'Truth or Dare Online — Free Card Game | Boardgame.sh',
    description: '67+ truth and dare challenges. Free, no sign-up, play instantly in your browser.',
    url: 'https://boardgame.sh/truthordare',
    images: [{ url: '/cover.png' }],
  },
  alternates: { canonical: 'https://boardgame.sh/truthordare' },
};

const HOW_TO_PLAY = [
  { step: '1', title: 'Add players', desc: 'Type each player\'s name and press Add. The current player\'s name is highlighted in blue.' },
  { step: '2', title: 'Draw a card', desc: 'Press "Draw Card" (or tap the card). A random Truth or Dare challenge will flip over.' },
  { step: '3', title: 'Complete the challenge', desc: 'Answer honestly (Truth) or complete the physical/social challenge (Dare).' },
  { step: '4', title: 'Pass to next player', desc: 'Press "Next Player →" to move to the next person in rotation.' },
];

const FEATURES = [
  { icon: '🃏', title: '67+ questions', desc: 'Carefully crafted truth questions and dare challenges suitable for groups of all sizes.' },
  { icon: '✏️', title: 'Fully customizable', desc: 'Add, edit, or delete any question. Your custom deck is saved automatically on your device.' },
  { icon: '👥', title: 'Player tracker', desc: 'Track whose turn it is so nobody gets skipped — supports up to 20 players.' },
  { icon: '📴', title: 'Works offline', desc: 'Once loaded, the game works completely offline on a single shared device.' },
];

const FAQ = [
  { q: 'How many people can play Truth or Dare?', a: 'The game works with 2–20 players. Everyone takes turns on a single shared device — no separate devices needed.' },
  { q: 'Can I add my own custom questions?', a: 'Yes! Open "Manage Questions" at the bottom of the page. Add any question, assign it a type (Truth, Dare, or Penalty), and it is saved automatically in your browser.' },
  { q: 'Does the game save my custom questions between sessions?', a: 'Yes. Custom questions are stored in your browser\'s local storage and will still be there the next time you visit.' },
  { q: 'What is a Penalty card?', a: 'Penalty cards are used when a player refuses to complete their Truth or Dare. You can add your own penalty rules — e.g., finish a drink, do 10 push-ups, etc.' },
  { q: 'Is Truth or Dare free?', a: 'Completely free with no hidden costs, no account, and no ads inside the game.' },
];

export default function TruthOrDarePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Game',
          name: 'Truth or Dare — Boardgame.sh',
          description: 'Free online Truth or Dare card game. 67+ questions and challenges for groups of 2–20 players.',
          url: 'https://boardgame.sh/truthordare',
          genre: 'Party Game',
          numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 20 },
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
        <section style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)', padding: '3rem 1rem 2rem' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
              🃏 Truth or Dare
            </h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
              Draw a challenge card or answer an honest question. Free, no sign-up — play instantly with friends.
            </p>
          </div>
        </section>

        {/* Game */}
        <TruthOrDareGame />

        {/* How to play */}
        <section style={{ padding: '3rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem', marginBottom: '2rem' }}>How to Play Truth or Dare</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {HOW_TO_PLAY.map((s) => (
                <div key={s.step} className="panel" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand)', lineHeight: 1, flexShrink: 0 }}>{s.step}</span>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{s.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '3rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem', marginBottom: '2rem' }}>Why Play on Boardgame.sh?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', textAlign: 'center' }}>
              {FEATURES.map((f) => (
                <div key={f.title} className="panel">
                  <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>{f.icon}</div>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{f.desc}</p>
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
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Looking for another game?</p>
            <Link href="/werewolf" className="btn ghost">🐺 Try Werewolf Online →</Link>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <p><Link href="/privacy">Privacy Policy</Link> &nbsp;·&nbsp; © 2025 Boardgame.sh</p>
      </footer>
    </>
  );
}
