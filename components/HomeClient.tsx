'use client';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

const GAMES = [
  { href: '/truthordare', icon: '🃏', nameKey: 'game.truthordare.name', descKey: 'game.truthordare.desc' },
  { href: '/werewolf', icon: '🐺', nameKey: 'game.werewolf.name', descKey: 'game.werewolf.desc' },
];

export default function HomeClient() {
  const { t } = useTranslation();
  return (
    <section style={{ padding: '3rem 1rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {GAMES.map((g) => (
            <Link key={g.href} href={g.href} style={{ textDecoration: 'none' }}>
              <div className="panel" style={{
                cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s',
                display: 'flex', flexDirection: 'column', gap: '1rem',
              }}
                onMouseEnter={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-4px)'; d.style.borderColor = 'var(--brand)'; }}
                onMouseLeave={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = ''; d.style.borderColor = ''; }}
              >
                <div style={{ fontSize: '3rem' }}>{g.icon}</div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.4rem' }}>{t(g.nameKey)}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t(g.descKey)}</p>
                </div>
                <span className="btn primary sm" style={{ alignSelf: 'flex-start' }}>{t('home.playNow')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
