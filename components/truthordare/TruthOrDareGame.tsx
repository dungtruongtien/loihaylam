'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { DEFAULT_CARDS, type Card } from '@/lib/truthordare/questions';
import { useTranslation } from '@/lib/i18n/useTranslation';

const STORAGE_KEY = 'loihaylam_questions';

function loadCards(): Card[] {
  if (typeof window === 'undefined') return [...DEFAULT_CARDS];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
    }
  } catch { /* ignore */ }
  return [...DEFAULT_CARDS];
}

export default function TruthOrDareGame() {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [remaining, setRemaining] = useState<Card[]>([]);
  const [current, setCurrent] = useState<Card | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [cardStyle, setCardStyle] = useState<string>('');
  const [players, setPlayers] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState('');
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [showManager, setShowManager] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [newType, setNewType] = useState<Card['type']>('truth');
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const flipSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loaded = loadCards();
    setCards(loaded);
    setRemaining([...loaded]);
  }, []);

  const save = useCallback((updated: Card[]) => {
    setCards(updated);
    setRemaining([...updated]);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  }, []);

  const getNextCard = useCallback((deck: Card[], allCards: Card[]): [Card, Card[]] => {
    let d = deck.length > 0 ? [...deck] : [...allCards];
    const idx = Math.floor(Math.random() * d.length);
    const card = d[idx];
    d.splice(idx, 1);
    return [card, d];
  }, []);

  const handleDraw = useCallback(() => {
    clickSoundRef.current?.play().catch(() => {});
    if (flipped) {
      setFlipped(false);
      setCardStyle('');
      setTimeout(() => {
        const [card, newRemaining] = getNextCard(remaining, cards);
        setCurrent(card);
        setRemaining(newRemaining);
        setCardStyle(card.type === 'dare' ? 'dare' : card.type);
        setTimeout(() => setFlipped(true), 50);
        flipSoundRef.current?.play().catch(() => {});
      }, 300);
    } else {
      const [card, newRemaining] = getNextCard(remaining, cards);
      setCurrent(card);
      setRemaining(newRemaining);
      setCardStyle(card.type === 'dare' ? 'dare' : card.type);
      setTimeout(() => setFlipped(true), 50);
      flipSoundRef.current?.play().catch(() => {});
    }
  }, [flipped, remaining, cards, getNextCard]);

  const addPlayer = () => {
    const name = playerInput.trim();
    if (!name || players.length >= 20) return;
    setPlayers([...players, name]);
    setPlayerInput('');
  };

  const nextPlayer = () => {
    if (!players.length) return;
    setCurrentPlayerIdx((i) => (i + 1) % players.length);
  };

  const addQuestion = () => {
    const text = newQ.trim();
    if (!text) { alert(t('td.enterQuestion')); return; }
    if (cards.length >= 100) { alert(t('td.maxQuestions')); return; }
    save([...cards, { type: newType, content: text }]);
    setNewQ('');
  };

  const deleteQuestion = (idx: number) => {
    if (cards.length <= 10) { alert(t('td.minQuestions')); return; }
    const updated = cards.filter((_, i) => i !== idx);
    save(updated);
  };

  const updateQuestion = (idx: number, content: string) => {
    const updated = cards.map((c, i) => i === idx ? { ...c, content } : c);
    save(updated);
  };

  const updateType = (idx: number, type: Card['type']) => {
    const updated = cards.map((c, i) => i === idx ? { ...c, type } : c);
    save(updated);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: 520, margin: '0 auto' }}>
      {/* Audio elements */}
      <audio ref={clickSoundRef} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" preload="none" />
      <audio ref={flipSoundRef} src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3" preload="none" />

      {/* Player tracker */}
      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: players.length > 0 ? '0.75rem' : 0, flexWrap: 'wrap' }}>
          {players.map((p, i) => (
            <span key={i} style={{
              padding: '0.3rem 0.8rem',
              borderRadius: 999,
              background: i === currentPlayerIdx ? 'var(--brand)' : 'var(--panel2)',
              color: i === currentPlayerIdx ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}>{p}</span>
          ))}
        </div>
        {players.length > 0 && (
          <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--brand)' }}>
            {players[currentPlayerIdx]}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            className="input"
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder={t('td.playerNamePlaceholder')}
            style={{ flex: 1 }}
          />
          <button className="btn primary sm" onClick={addPlayer}>{t('td.addPlayer')}</button>
          {players.length > 0 && (
            <button className="btn ghost sm" onClick={nextPlayer}>{t('td.nextPlayer')}</button>
          )}
        </div>
      </div>

      {/* Card centred on screen */}
      <div style={{
        minHeight: 'calc(100svh - 340px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '1rem 0',
      }}>
        {/* Game card */}
        <div style={{ perspective: 1200, width: '100%', maxWidth: 340 }}>
          <div
            onClick={handleDraw}
            style={{
              position: 'relative',
              width: '100%',
              height: 420,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.7s cubic-bezier(.4,2,.55,.44)',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              cursor: 'pointer',
            }}>
            {/* Front */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, var(--panel) 0%, var(--panel2) 100%)',
              border: '2px dashed var(--border)', borderRadius: 24,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎴</span>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('td.flipPrompt')}</p>
            </div>
            {/* Back */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 24,
              background: cardStyle === 'dare'
                ? 'linear-gradient(135deg, var(--dare) 0%, var(--dare-dark) 100%)'
                : cardStyle === 'penalty'
                  ? 'linear-gradient(135deg, var(--penalty) 0%, var(--penalty-dark) 100%)'
                  : 'linear-gradient(135deg, var(--truth) 0%, var(--truth-dark) 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 2rem',
              gap: '1rem',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                {cardStyle === 'dare' ? t('td.typeDare') : cardStyle === 'penalty' ? t('td.typePenalty') : t('td.typeTruth')}
              </span>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.65, color: '#fff' }}>
                {current?.content}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', width: '100%', maxWidth: 340 }}>
          <button className="btn ghost" onClick={() => setCardStyle('truth')}
            style={{ flex: 1, borderColor: 'var(--truth)', color: 'var(--truth)', padding: '0.75rem 0', fontSize: '0.9rem' }}>
            {t('td.doIt')}
          </button>
          <button className="btn primary" onClick={handleDraw}
            style={{ flex: 1, padding: '0.75rem 0', fontSize: '0.9rem' }}>
            {t('td.pickCard')}
          </button>
          <button className="btn ghost" onClick={() => setCardStyle('penalty')}
            style={{ flex: 1, borderColor: 'var(--penalty)', color: 'var(--penalty)', padding: '0.75rem 0', fontSize: '0.9rem' }}>
            {t('td.penalty')}
          </button>
        </div>
      </div>

      {/* Question manager */}
      <div style={{ marginTop: '1.5rem' }}>
        <button className="btn ghost full" onClick={() => setShowManager(!showManager)} style={{ marginBottom: '1rem' }}>
          {t('td.manageQuestions')} {showManager ? '▲' : '▼'}
        </button>
        {showManager && (
          <div className="panel">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input className="input" value={newQ} onChange={(e) => setNewQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
                placeholder={t('td.newQuestionPlaceholder')} style={{ flex: 1, minWidth: 200 }} />
              <select className="select" value={newType} onChange={(e) => setNewType(e.target.value as Card['type'])} style={{ width: 120 }}>
                <option value="truth">{t('td.typeTruth')}</option>
                <option value="dare">{t('td.typeDare')}</option>
                <option value="penalty">{t('td.typePenalty')}</option>
              </select>
              <button className="btn primary sm" onClick={addQuestion}>{t('td.addQuestion')}</button>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 400, overflowY: 'auto' }}>
              {cards.map((q, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input className="input" style={{ flex: 1 }} defaultValue={q.content}
                    onBlur={(e) => updateQuestion(i, e.target.value)} />
                  <select className="select" style={{ width: 100 }} value={q.type} onChange={(e) => updateType(i, e.target.value as Card['type'])}>
                    <option value="truth">{t('td.typeTruth')}</option>
                    <option value="dare">{t('td.typeDare')}</option>
                    <option value="penalty">{t('td.typePenalty')}</option>
                  </select>
                  <button className="btn danger sm" onClick={() => deleteQuestion(i)}>{t('td.delete')}</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
