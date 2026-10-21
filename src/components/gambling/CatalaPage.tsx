import { useState, useEffect } from 'react';
import { api } from "../../api";
import "../../styles/catala.css";

interface CardData { rank: number; suit: number }

interface GameState {
  active: boolean;
  hand?: CardData[];
  swapsLeft?: number;
}

export default function CatalaPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState('');
  const [rewardInfo, setRewardInfo] = useState<{ type: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const getRankName = (rank: number) => {
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    if (rank === 14) return 'A';
    return rank.toString();
  };
  const getSuitSymbol = (suit: number) => ['♣', '♦', '♥', '♠'][suit] || '?';
  const isRed = (suit: number) => suit === 1 || suit === 2;

  useEffect(() => {
    api('/api/pairgame')
      .then((data: GameState) => setGameState(data))
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    setMessage('Раздача...');
    setRewardInfo(null);
    try {
      const data = await api('/api/pairgame/start', { method: 'POST' });
      setGameState({ active: true, ...data });
      setMessage('Выбери карту для замены или вскройся!');
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const handleSwap = async (index: number) => {
    if (!gameState || !gameState.swapsLeft || gameState.swapsLeft <= 0) return;
    try {
      const data = await api('/api/pairgame/swap', {
        method: 'POST',
        body: JSON.stringify({ position: index }),
      });
      setGameState((prev) => prev ? { ...prev, ...data } : null);
      if (data.swapsLeft === 0) setMessage('Попытки кончились. Пора вскрываться!');
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const handleFinish = async () => {
    setMessage('Загрузка...');
    try {
      const data = await api('/api/pairgame/finish', { method: 'POST' });
      setGameState({ active: false, hand: data.hand });
      setMessage(data.message);
      setRewardInfo({ type: data.rewardType, amount: data.rewardAmount });
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  if (loading) return <div className="catala-loading">Загрузка стола...</div>;

  return (
    <div className="catala-page">
      <img className="catala-bg" src="/assets/bg/catala-table.png" alt="Стол" />

      <button className="catala-btn-back" onClick={() => console.log('Назад')}>← Выйти</button>

      <div className="catala-table">
        {/* Карты дилера (слева) */}
        <div className="table-slot table-slot--dealer-1" />
        <div className="table-slot table-slot--dealer-2" />

        {/* Колода (в центре) */}
        <div className="table-slot table-slot--deck" />

        {/* Карты игрока (справа). Класс формируется динамически (player-0, player-1) */}
        {gameState?.active && gameState.hand?.map((card, i) => (
          <div 
            key={i} 
            className={`table-slot table-slot--player-${i} pg-card ${isRed(card.suit) ? 'red' : 'black'}`}
            onClick={() => handleSwap(i)}
            style={{ cursor: gameState.swapsLeft && gameState.swapsLeft > 0 ? 'pointer' : 'default' }}
          >
            <div className="pg-card-value">{getRankName(card.rank)}</div>
            <div className="pg-card-suit">{getSuitSymbol(card.suit)}</div>
          </div>
        ))}

        {/* UI Взаимодействия */}
        {!gameState?.active ? (
          <button className="catala-play-btn" onClick={handleStart}>Начать игру</button>
        ) : (
          <div className="catala-reveal-block">
            <div className="shulmovki">Шульмовок: {gameState.swapsLeft}</div>
            <button className="catala-reveal-btn" onClick={handleFinish}>Вскрыться</button>
          </div>
        )}
      </div>

      <div className="catala-message">
        <div className="catala-message-text">{message}</div>
        {rewardInfo && (
          <div className="catala-reward">
            Награда: {rewardInfo.type === 'money' ? 'Деньги' : 'Сигареты'} +{rewardInfo.amount}
          </div>
        )}
      </div>
    </div>
  );
}