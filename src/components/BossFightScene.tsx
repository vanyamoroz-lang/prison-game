import { useState, useEffect, useRef } from 'react';
import '../styles/BossFightScene.css';

interface Props {
  fight: {
    bossId: number;
    name: string;
    img_boss: string;
    currentHp: number;
    maxHp: number;
    endTime: number;
    serverTime: number;
    inventory?: { knife: number; poison: number; pistol: number }; // <--- Добавили
  };
  mode: string;
  onClose: (result: 'win' | 'lose', reward?: any) => void; // <--- Изменили сигнатуру
}

export default function BossFightScene({ fight, mode, onClose }: Props) {
  const [currentHp, setCurrentHp] = useState(fight.currentHp);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [inventory, setInventory] = useState(
    fight.inventory || { knife: 0, poison: 0, pistol: 0 }
  );
  const [isAttacking, setIsAttacking] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // === ТАЙМЕР ===
  useEffect(() => {
    const initial = Math.max(0, Math.floor((fight.endTime - fight.serverTime) / 1000));
    setTimeLeft(initial);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onClose('lose'); // <--- Передаем поражение
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fight.endTime, fight.serverTime, onClose]);

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
    if (inventory[weapon] <= 0) return; // Нет оружия — не бьем

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
        // Босс убит
        onClose('win', data.reward);
      } else {
        // Босс жив, обновляем HP и инвентарь
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
            🔪 <span className="slot-count">{inventory.knife}</span>
          </div>
          {/* Пистолет */}
          <div 
            className="slot" 
            onClick={() => handleHit('pistol')} 
            style={{ opacity: inventory.pistol > 0 ? 1 : 0.3, cursor: inventory.pistol > 0 ? 'pointer' : 'not-allowed' }}
            title="Выстрел из самопала"
          >
            🔫 <span className="slot-count">{inventory.pistol}</span>
          </div>
          {/* Яд */}
          <div 
            className="slot" 
            onClick={() => handleHit('poison')} 
            style={{ opacity: inventory.poison > 0 ? 1 : 0.3, cursor: inventory.poison > 0 ? 'pointer' : 'not-allowed' }}
            title="Удар ядом"
          >
            💣 <span className="slot-count">{inventory.poison}</span>
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