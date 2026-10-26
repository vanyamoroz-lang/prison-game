import { useState, useEffect, useRef } from 'react';
import type { ActiveBossFight, BossFightReward, BossWeaponInventory } from './bossTypes';
import '../styles/BossFightScene.css';

interface Props {
  fight: ActiveBossFight;
  mode: string;
  onClose: (result: 'win' | 'lose', reward?: BossFightReward) => void;
}

export default function BossFightScene({ fight, onClose }: Props) {
  const [currentHp, setCurrentHp] = useState(fight.currentHp);
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    Math.max(0, Math.floor((fight.endTime - fight.serverTime) / 1000))
  );
  const [inventory, setInventory] = useState<BossWeaponInventory>(
    fight.inventory || { knife: 0, poison: 0, pistol: 0 }
  );
  const [isAttacking, setIsAttacking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // === ТАЙМЕР ===
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0) onCloseRef.current('lose');
  }, [timeLeft]);

  const hpPercent = (currentHp / fight.maxHp) * 100;

  let phaseSuffix = 'good';
  if (hpPercent <= 66 && hpPercent > 33) phaseSuffix = 'bad';
  if (hpPercent <= 33) phaseSuffix = 'terrible';

  const basePath = fight.img_boss.replace(/\.[^/.]+$/, ""); 
  const currentBossImage = `${basePath}_${phaseSuffix}.webp`;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // === УДАР ЧЕРЕЗ СЕРВЕР ===
  const handleHit = async (weapon: 'knife' | 'poison' | 'pistol') => {
    if (isAttacking) return;
    if (inventory[weapon] <= 0) return;

    setIsAttacking(true);

    try {
      const res = await fetch('/api/bosses/hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weapon }),
        credentials: 'include'
      });
      const data = await res.json();

      if (data.success) {
        onClose('win', data.reward);
      } else {
        setCurrentHp(data.currentHp);
        setInventory((prev) => ({
          ...prev,
          [weapon]: Math.max(0, prev[weapon] - 1)
        }));
      }
    } catch (err) {
      console.error('Ошибка удара:', err);
    } finally {
      setIsAttacking(false);
    }
  };

  return (
    <div className="fight-scene">
      <div className="fight-top-panel">
        <div className="boss-name-tag">{fight.name}</div>
        
        <div className="hp-bar-container">
          <div 
            className="hp-bar-fill" 
            style={{ 
              width: `${hpPercent}%`,
              background: phaseSuffix === 'good' ? 'linear-gradient(180deg, #ff0000 0%, #990000 100%)' 
                        : phaseSuffix === 'bad' ? 'linear-gradient(180deg, #ff8800 0%, #aa4400 100%)' 
                        : 'linear-gradient(180deg, #880000 0%, #440000 100%)'
            }}
          >
            <span className="hp-text">{currentHp.toLocaleString('ru-RU')} / {fight.maxHp.toLocaleString('ru-RU')}</span>
          </div>
        </div>

        <div className="fight-timer">
          ⏳ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="fight-arena">
        <div className="arena-bg"></div>
        <img src={currentBossImage} alt={fight.name} className="boss-sprite" />
      </div>

      <div className="fight-bottom-panel">
        <div className="weapon-slots">
          {/* Нож */}
          <div 
            className="slot" 
            onClick={() => handleHit('knife')} 
            style={{ opacity: inventory.knife > 0 ? 1 : 0.3, cursor: inventory.knife > 0 ? 'pointer' : 'not-allowed' }}
            title="Удар финкой"
          >
            <img src="/assets/icons/knife.png" alt="knife" className="slot-icon" />
            <span className="slot-count">{inventory.knife}</span>
          </div>
          {/* Пистолет */}
          <div 
            className="slot" 
            onClick={() => handleHit('pistol')} 
            style={{ opacity: inventory.pistol > 0 ? 1 : 0.3, cursor: inventory.pistol > 0 ? 'pointer' : 'not-allowed' }}
            title="Выстрел из самопала"
          >
            <img src="/assets/icons/gun.png" alt="gun" className="slot-icon" />
            <span className="slot-count">{inventory.pistol}</span>
          </div>
          {/* Яд */}
          <div 
            className="slot" 
            onClick={() => handleHit('poison')} 
            style={{ opacity: inventory.poison > 0 ? 1 : 0.3, cursor: inventory.poison > 0 ? 'pointer' : 'not-allowed' }}
            title="Удар ядом"
          >
            <img src="/assets/icons/poison.png" alt="poison" className="slot-icon" />
            <span className="slot-count">{inventory.poison}</span>
          </div>
          {/* Кнопка сдаться */}
          <div 
            className="slot" 
            onClick={() => onClose('lose')} 
            title="Сдаться"
            style={{ marginLeft: 'auto', background: '#500', borderColor: '#a00' }}
          >
            🏳️
          </div>
        </div>

        <div className="talents-panel">
          <div className="player-info">
            <span>Твой профиль</span>
          </div>
          <div className="talents-bar">
            <span>ТАЛАНТЫ</span>
            <div className="progress-bar"></div>
            <span>3477 ОЧКОВ</span>
          </div>
        </div>
      </div>
    </div>
  );
}