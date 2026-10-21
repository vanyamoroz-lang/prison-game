import { useState } from 'react';
import { CATALA_COMBOS } from '../../data/catalaCombos';

interface CatalaState {
  level: number;
  xp: number;        // текущий опыт для полоски
  xpToNext: number;
  lastWinner: { name: string; avatar: string } | null;
  shulmovkiLeft: number;
  shulmovkiMax: number;
}

interface CardData { rank: string; suit: string; faceDown?: boolean }

export default function CatalaPage() {
  const [state] = useState<CatalaState>({
    level: 106, xp: 60, xpToNext: 100,
    lastWinner: { name: 'Игрок', avatar: '/assets/placeholder-avatar.png' },
    shulmovkiLeft: 7, shulmovkiMax: 7,
  });

  const [started, setStarted] = useState(false);
  const [playerCards, setPlayerCards] = useState<CardData[]>([]);
  const [resultModal, setResultModal] = useState<null | { reward: string }>(null);

  const handlePlay = async () => {
    // TODO: const res = await api.post('/catala/play');
    // setPlayerCards(res.cards); setStarted(true);
    setStarted(true);
    setPlayerCards([
      { rank: '8', suit: 'hearts' },
      { rank: '7', suit: 'hearts' },
    ]);
  };

  const handleReveal = async () => {
    // TODO: const res = await api.post('/catala/reveal');
    setResultModal({ reward: '10 000 ₽' });
  };

  return (
    <div className="catala-page">
      <div className="catala-level-bar">
        <div className="level-label">{state.level} ур.</div>
        <div className="level-track">
          <div className="level-fill" style={{ height: `${(state.xp / state.xpToNext) * 100}%` }} />
        </div>
      </div>

      <div className="catala-table">
        <div className="table-slot table-slot--dealer" />
        <div className="table-slot table-slot--dealer" />
        <div className="table-slot table-slot--deck" />
        {playerCards.map((c, i) => (
          <div key={i} className="table-slot table-slot--player">
            <img src={`/assets/cards/${c.rank}_${c.suit}.png`} alt="" />
          </div>
        ))}
        {!started && (
          <button className="catala-play-btn" onClick={handlePlay}>Играть</button>
        )}
        {started && (
          <div className="catala-reveal-block">
            <div className="shulmovki">Шульмовок {state.shulmovkiLeft} / {state.shulmovkiMax}</div>
            <button className="catala-reveal-btn" onClick={handleReveal}>Вскрыться</button>
          </div>
        )}
      </div>

      <div className="catala-side">
        <div className="catala-winner">
          <img src={state.lastWinner?.avatar} alt="" />
          <div>Сорвал куш!</div>
        </div>
        <div className="catala-combos">
          {CATALA_COMBOS.map((c) => (
            <div key={c.key} className="combo-row">
              <span className="combo-cards">{c.label}</span>
              <span className="combo-reward">{c.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {resultModal && (
        <div className="modal-overlay">
          <div className="result-modal">
            <div>Победа!</div>
            <div>{resultModal.reward}</div>
            <button onClick={() => { setResultModal(null); setStarted(false); }}>Ништяк</button>
          </div>
        </div>
      )}
    </div>
  );
}