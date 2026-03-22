'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n/useTranslation';

// Lazy-load everything below the fold — reduces initial DOM size significantly
const HomeBelowFold = dynamic(() => import('./HomeBelowFold'), { ssr: false });

export default function HomePageContent() {
  const { t } = useTranslation();

  return (
    <main>
      {/* ── Hero (above fold — eager) ── */}
      <section style={{ background: 'linear-gradient(160deg, #dbeafe 0%, #eff6ff 60%, #fce7f3 100%)', padding: '4rem 1rem 3rem', textAlign: 'center' }}>
        <div className="container">
          <p style={{ color: 'var(--brand)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            {t('home.hero.badge')}
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem' }}>
            {t('home.hero.title1')}<br />
            <span style={{ color: 'var(--brand)' }}>{t('home.hero.titleHighlight')}</span>{' '}
            {t('home.hero.title2')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 540, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            {t('home.hero.subtitle')}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/truthordare" className="btn primary">{t('home.hero.ctaTod')}</Link>
            <Link href="/werewolf" className="btn wolf">{t('home.hero.ctaWolf')}</Link>
          </div>
        </div>
      </section>

      {/* ── Game cards (above fold — eager) ── */}
      <section style={{ padding: '3rem 1rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
            {[
              { href: '/truthordare', icon: '🃏', nameKey: 'game.truthordare.name', descKey: 'game.truthordare.desc', btnClass: 'primary', hoverColor: 'var(--brand)' },
              { href: '/werewolf', icon: '🐺', nameKey: 'game.werewolf.name', descKey: 'game.werewolf.desc', btnClass: 'wolf', hoverColor: '#7c3aed' },
            ].map((g) => (
              <Link key={g.href} href={g.href} style={{ textDecoration: 'none', display: 'flex' }}>
                <div className="panel" style={{ cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}
                  onMouseEnter={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-4px)'; d.style.borderColor = g.hoverColor; }}
                  onMouseLeave={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = ''; d.style.borderColor = ''; }}
                >
                  <div style={{ fontSize: '3rem' }}>{g.icon}</div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.4rem' }}>{t(g.nameKey)}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t(g.descKey)}</p>
                  </div>
                  <span className={`btn ${g.btnClass} sm`} style={{ alignSelf: 'flex-start' }}>{t('home.playNow')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Below fold (lazy-loaded after hydration) ── */}
      <HomeBelowFold />
    </main>
  );
}
