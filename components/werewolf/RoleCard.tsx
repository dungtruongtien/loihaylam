'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Props {
  role: string;
  compact?: boolean;
  customDesc?: string | null;
}

const ROLE_META: Record<string, { icon: string; color: string; bg: string }> = {
  wolf: { icon: '🐺', color: 'var(--wolf)', bg: 'linear-gradient(135deg,#7f1d1d,#991b1b)' },
  villager: { icon: '🏡', color: 'var(--villager)', bg: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)' },
  seer: { icon: '🔮', color: '#7c3aed', bg: 'linear-gradient(135deg,#4c1d95,#6d28d9)' },
  witch: { icon: '🧙', color: '#059669', bg: 'linear-gradient(135deg,#064e3b,#065f46)' },
  bodyguard: { icon: '🛡', color: '#d97706', bg: 'linear-gradient(135deg,#78350f,#92400e)' },
  hunter: { icon: '🏹', color: '#0369a1', bg: 'linear-gradient(135deg,#0c4a6e,#075985)' },
  host: { icon: '👑', color: '#b45309', bg: 'linear-gradient(135deg,#78350f,#b45309)' },
};

const DEFAULT_META = { icon: '🎭', color: 'var(--brand)', bg: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)' };

export default function RoleCard({ role, compact = false, customDesc }: Props) {
  const { t } = useTranslation();
  const meta = ROLE_META[role] || DEFAULT_META;
  const isKnownRole = !!ROLE_META[role];

  const roleName = isKnownRole ? t(`ww.role.${role}`) : role;
  const roleDesc = customDesc || (isKnownRole ? t(`ww.role.${role}.desc`) : '');
  const roleGoal = isKnownRole ? t(`ww.role.${role}.goal`) : t('ww.role.villager.goal');

  if (compact) {
    return (
      <div style={{
        background: meta.bg, borderRadius: 12, padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '1.8rem' }}>{meta.icon}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{roleName}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{roleGoal}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: meta.bg, borderRadius: 20, padding: '2rem',
      textAlign: 'center', maxWidth: 320, margin: '0 auto',
      boxShadow: `0 8px 32px ${meta.color}40`,
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{meta.icon}</div>
      <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
        {roleName}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: '1rem' }}>
        {roleDesc}
      </p>
      <div style={{
        background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '0.5rem 1rem',
        fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600,
      }}>
        {roleGoal}
      </div>
    </div>
  );
}
