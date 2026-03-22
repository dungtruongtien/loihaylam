'use client';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function SiteHeader() {
  const { t, lang, setLang } = useTranslation();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <span className="logo">🎲</span>
          <span>Broadgame.app</span>
        </Link>
        <nav className="nav">
          <Link href="/" className="nav-link">{t('nav.games')}</Link>
          <button className="lang-btn" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
            {t('lang.toggle')}
          </button>
        </nav>
      </div>
    </header>
  );
}
