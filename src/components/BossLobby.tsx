import { useState } from 'react';
import type { BossFightState } from './bossTypes';
import '../styles/BossLobby.css'; 

export interface BossDetails {
  id: number;
  name: string;
  img_boss: string;
  hp: number;
  reward?: {
    cigarettes?: number;
    reputation?: number;
    keys_drop?: Record<string, number>;
  };
  stats: {
    kills_today: number;
    daily_limit: number;
    attempts_left: number;
    boss_total_kills: number;
  };
  keys: Record<string, { needed: number; have: number }>;
  can_fight: boolean;
  available_modes: string[];
}

interface Props {
  boss: BossDetails;
  onClose: () => void;
  onFightSuccess: (fightData: BossFightState, mode: string) => void; 
}

const MODE_NAMES: Record<string, string> = {
  pazan: 'Пацанский',
  brat: 'Блатной',
  avtoritet: 'Авторитетный',
  solo: 'В одного',
};

export default function BossLobby({ boss, onClose, onFightSuccess }: Props) {
  const [selectedMode, setSelectedMode] = useState(boss.available_modes[0] || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const missingKeys = Object.values(boss.keys).some(k => k.have < k.needed);
  const cantFight = !boss.can_fight || missingKeys || boss.stats.attempts_left <= 0;

  let rewardKeys = 0;
  if (boss.reward?.keys_drop) {
    rewardKeys = Object.values(boss.reward.keys_drop).reduce((sum, val) => sum + Number(val), 0);
  }

  const handleAttack = async () => {
    if (cantFight) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/bosses/${boss.id}/attack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при нападении');
      }

      onFightSuccess(data.fight, selectedMode);
      
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка при нападении');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lobby-container">
      <button className="lobby-close-btn" onClick={onClose}>✖</button>
      
      <div className="lobby-header">
        <h2>{boss.name}</h2>
      </div>

      <div className="lobby-content">
        <div className="lobby-left">
          <div className="door-frame">
            <img src={boss.img_boss} alt={boss.name} className="boss-photo" />
          </div>

          {boss.reward && (
            <div className="reward-board">
              <h3>· НАГРАДА ·</h3>
              {(boss.reward.cigarettes || boss.reward.reputation) && (
                <div className="reward-row">
                  {boss.reward.cigarettes ? <span>🚬 {boss.reward.cigarettes}</span> : null}
                  {boss.reward.reputation ? <span>🤘 {boss.reward.reputation.toLocaleString('ru-RU')}</span> : null}
                </div>
              )}
              {rewardKeys > 0 && (
                <div className="reward-row"><span>🗝️ {rewardKeys}</span></div>
              )}
            </div>
          )}
        </div>

        <div className="lobby-right">
          <div className="modes-board">
            <h3>РЕЖИМ БОЯ</h3>
            
            <div className="modes-list">
              {boss.available_modes.map((mode) => (
                <div 
                  key={mode} 
                  className={`mode-item ${selectedMode === mode ? 'selected' : ''}`}
                  onClick={() => setSelectedMode(mode)}
                >
                  <div className="mode-icon">
                    {mode === 'solo' ? '💀' : '🍲'}
                  </div>
                  <div className="mode-info">
                    <span className="mode-name">{MODE_NAMES[mode] || mode}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            className="attack-btn" 
            disabled={cantFight || isLoading}
            onClick={handleAttack}
          >
            {isLoading ? 'Загрузка...' : cantFight ? 'НЕЛЬЗЯ' : 'Атаковать'}
          </button>
          
          {(errorMsg || cantFight) && (
            <div className="error-text">
              {errorMsg || (missingKeys ? 'Не хватает ключей!' : boss.stats.attempts_left <= 0 ? 'Лимит попыток исчерпан!' : 'Напасть нельзя!')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}