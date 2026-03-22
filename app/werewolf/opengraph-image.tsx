import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Werewolf Online — Free Multiplayer Game | Broadgame.app';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: '#1a1a1a',
          padding: '60px',
        }}
      >
        <div style={{ fontSize: 96, marginBottom: 20 }}>🐺</div>
        <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: '-2px', marginBottom: 16 }}>
          Werewolf Online
        </div>
        <div style={{ fontSize: 30, opacity: 0.8, textAlign: 'center', maxWidth: 700 }}>
          Secret roles · Social deduction · Free multiplayer
        </div>
        <div style={{ fontSize: 22, opacity: 0.6, marginTop: 24 }}>
          broadgame.app/werewolf — No sign-up needed
        </div>
      </div>
    ),
    { ...size }
  );
}
