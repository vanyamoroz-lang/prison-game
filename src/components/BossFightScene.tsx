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
    serverTime: number; // <--- ДОБАВИЛИ СЕРВЕРНОЕ ВРЕМЯ
  };
  mode: string;
  onClose: () => void;
}

export default function BossFightScene({ fight, mode, onClose }: Props) {
  const [currentHp, setCurrentHp] = useState(fight.currentHp);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // === ЛОГИКА ТАЙМЕРА (НА ОСНОВЕ ВРЕМЕНИ СЕРВЕРА) ===
  useEffect(() => {
    // Считаем начальное оставшееся время: (конец боя - серверное время) / 1000
    const initial = Math.max(0, Math.floor((fight.endTime - fight.serverTime) / 1000));
    setTimeLeft(initial);

    // Запускаем интервал, который просто уменьшает число каждую секунду
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          alert('Время вышло! Вы проиграли.');
          onClose();
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

  const handleHit = (damage: number) => {
    const newHp = Math.max(0, currentHp - damage);
    setCurrentHp(newHp);
    
    if (newHp === 0) {
      alert("Босс повержен!");
      onClose();
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

        {/* ТАЙМЕР БОЯ */}
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
          <div className="slot" onClick={() => handleHit(100)} title="Удар 100">🔪</div>
          <div className="slot" onClick={() => handleHit(200)} title="Удар 200">🔫</div>
          <div className="slot" onClick={() => handleHit(300)} title="Удар 300">💣</div>
          <div className="slot">🗝️</div>
          <div className="slot">💀</div>
          <div className="slot">🛡️</div>
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