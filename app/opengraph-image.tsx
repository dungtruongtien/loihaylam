import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Broadgame.app — Free Online Group Games';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: '#fff',
          padding: '60px',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 20 }}>🎲</div>
        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-2px', marginBottom: 16 }}>
          Broadgame.app
        </div>
        <div style={{ fontSize: 32, opacity: 0.9, textAlign: 'center', maxWidth: 700 }}>
          Free Online Group Games — Truth or Dare, Werewolf & more
        </div>
        <div style={{ fontSize: 22, opacity: 0.7, marginTop: 24 }}>
          No sign-up · No download · Play instantly
        </div>
      </div>
    ),
    { ...size }
  );
}
