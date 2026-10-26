import type { BossFightReward } from './bossTypes';
import '../styles/BossResultScene.css';

interface Props {
  result: 'win' | 'lose';
  bossName: string;
  reward?: BossFightReward;
  onClose: () => void;
}

export default function BossResultScene({ result, bossName, reward, onClose }: Props) {
  const isWin = result === 'win';

  return (
    <div className={`result-scene ${isWin ? 'win' : 'lose'}`}>
      <div className="result-content">
        <h1 className="result-title">
          {isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
        </h1>
        
        <div className="result-subtitle">
          {isWin ? `Вы одолели ${bossName}` : `Вы не смогли одолеть ${bossName}`}
        </div>

        {isWin && reward && (
          <div className="result-rewards">
            <div className="reward-row">🚬 Сигареты: +{reward.cigarettes || 0}</div>
            <div className="reward-row">🤘 Авторитет: +{reward.reputation || 0}</div>
            {reward.keys_drop && Object.entries(reward.keys_drop).map(([keyId, amount]) => (
              <div key={keyId} className="reward-row">🗝️ Ключ (ID: {keyId}): +{amount}</div>
            ))}
          </div>
        )}

        <button className="result-btn" onClick={onClose}>
          {isWin ? 'Забрать награду' : 'Вернуться'}
        </button>
      </div>
    </div>
  );
}