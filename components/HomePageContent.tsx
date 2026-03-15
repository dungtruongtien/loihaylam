'use client';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function HomePageContent() {
  const { t } = useTranslation();

  const features = [
    { icon: '🆓', titleKey: 'home.features.free.title', descKey: 'home.features.free.desc' },
    { icon: '🚀', titleKey: 'home.features.noSignup.title', descKey: 'home.features.noSignup.desc' },
    { icon: '📱', titleKey: 'home.features.mobile.title', descKey: 'home.features.mobile.desc' },
    { icon: '🌐', titleKey: 'home.features.multi.title', descKey: 'home.features.multi.desc' },
  ];

  const todFeatures = ['home.tod.feature1', 'home.tod.feature2', 'home.tod.feature3', 'home.tod.feature4'];
  const wwFeatures = ['home.ww.feature1', 'home.ww.feature2', 'home.ww.feature3', 'home.ww.feature4'];

  const faqItems = [
    { q: 'home.faq.q1', a: 'home.faq.a1' },
    { q: 'home.faq.q2', a: 'home.faq.a2' },
    { q: 'home.faq.q3', a: 'home.faq.a3' },
    { q: 'home.faq.q4', a: 'home.faq.a4' },
    { q: 'home.faq.q5', a: 'home.faq.a5' },
  ];

  return (
    <main>
      {/* ── Hero ── */}
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
            <Link href="/werewolf" className="btn ghost">{t('home.hero.ctaWolf')}</Link>
          </div>
        </div>
      </section>

      {/* ── Game cards ── */}
      <section style={{ padding: '3rem 1rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
            {[
              { href: '/truthordare', icon: '🃏', nameKey: 'game.truthordare.name', descKey: 'game.truthordare.desc' },
              { href: '/werewolf', icon: '🐺', nameKey: 'game.werewolf.name', descKey: 'game.werewolf.desc' },
            ].map((g) => (
              <Link key={g.href} href={g.href} style={{ textDecoration: 'none', display: 'flex' }}>
                <div className="panel" style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, border-color 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                  width: '100%',
                }}
                  onMouseEnter={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-4px)'; d.style.borderColor = 'var(--brand)'; }}
                  onMouseLeave={(e) => { const d = e.currentTarget as HTMLDivElement; d.style.transform = ''; d.style.borderColor = ''; }}
                >
                  <div style={{ fontSize: '3rem' }}>{g.icon}</div>
                  <div style={{ flex: 1 }}>
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

      {/* ── Features ── */}
      <section style={{ padding: '3rem 1rem', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem', marginBottom: '2rem' }}>
            {t('home.features.title')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
            {features.map((f) => (
              <div key={f.titleKey} className="panel" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>{t(f.titleKey)}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Truth or Dare detail ── */}
      <section style={{ padding: '3rem 1rem', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--truth)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{t('home.tod.badge')}</p>
              <h2 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '1rem', lineHeight: 1.3 }}>
                {t('home.tod.title')}
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '1.25rem' }}>
                {t('home.tod.desc')}
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {todFeatures.map((key) => (
                  <li key={key} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--truth)' }}>✓</span> {t(key)}
                  </li>
                ))}
              </ul>
              <Link href="/truthordare" className="btn primary">{t('home.tod.cta')}</Link>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', borderRadius: 20, padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🃏</div>
              <div style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 12, padding: '1rem', marginBottom: '0.75rem' }}>
                <p style={{ fontWeight: 700, color: '#15803d' }}>{t('home.tod.cardTruth')}</p>
                <p style={{ color: '#166534', fontSize: '0.9rem', marginTop: '0.3rem' }}>{t('home.tod.cardTruthSample')}</p>
              </div>
              <div style={{ background: 'rgba(219,39,119,0.1)', border: '1px solid rgba(219,39,119,0.3)', borderRadius: 12, padding: '1rem' }}>
                <p style={{ fontWeight: 700, color: '#be185d' }}>{t('home.tod.cardDare')}</p>
                <p style={{ color: '#9d174d', fontSize: '0.9rem', marginTop: '0.3rem' }}>{t('home.tod.cardDareSample')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Werewolf detail ── */}
      <section style={{ padding: '3rem 1rem', borderTop: '1px solid var(--border)', background: '#fef2f2' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)', borderRadius: 20, padding: '2rem', textAlign: 'center', order: 1 }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐺</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { roleKey: 'home.ww.wolfRole', descKey: 'home.ww.wolfDesc', color: '#b91c1c' },
                  { roleKey: 'home.ww.villagerRole', descKey: 'home.ww.villagerDesc', color: '#1d4ed8' },
                ].map((r) => (
                  <div key={r.roleKey} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '0.75rem 1rem', textAlign: 'left' }}>
                    <p style={{ fontWeight: 700, color: r.color, marginBottom: '0.2rem' }}>{t(r.roleKey)}</p>
                    <p style={{ color: '#4e6480', fontSize: '0.85rem' }}>{t(r.descKey)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ order: 2 }}>
              <p style={{ color: 'var(--wolf)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{t('home.ww.badge')}</p>
              <h2 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '1rem', lineHeight: 1.3 }}>
                {t('home.ww.title')}
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '1.25rem' }}>
                {t('home.ww.desc')}
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {wwFeatures.map((key) => (
                  <li key={key} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--wolf)' }}>✓</span> {t(key)}
                  </li>
                ))}
              </ul>
              <Link href="/werewolf" className="btn primary" style={{ background: 'var(--wolf)' }}>{t('home.ww.cta')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '3rem 1rem', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 680 }}>
          <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem', marginBottom: '2rem' }}>
            {t('home.faq.title')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqItems.map((item) => (
              <div key={item.q} className="panel">
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{t(item.q)}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7 }}>{t(item.a)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
