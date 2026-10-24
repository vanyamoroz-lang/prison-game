import { useState } from 'react';
import '../styles/BossFightScene.css';

interface Props {
  fight: {
    bossId: number;
    name: string;
    img_boss: string;
    currentHp: number;
    maxHp: number;
  };
  mode: string;
  onClose: () => void;
}

export default function BossFightScene({ fight, mode, onClose }: Props) {
  const [currentHp, setCurrentHp] = useState(fight.currentHp);
  
  const hpPercent = (currentHp / fight.maxHp) * 100;

  // === ЛОГИКА ВЫБОРА АССЕТА ===
  let phaseSuffix = 'good';
  if (hpPercent <= 66 && hpPercent > 33) phaseSuffix = 'bad';
  if (hpPercent <= 33) phaseSuffix = 'terrible';

  const basePath = fight.img_boss.replace(/\.[^/.]+$/, ""); 
  const currentBossImage = `${basePath}_${phaseSuffix}.webp`;

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
      {/* ВЕРХНЯЯ ПАНЕЛЬ С ХП */}
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
      </div>

      {/* АРЕНА С БОССОМ */}
      <div className="fight-arena">
        <div className="arena-bg"></div>
        <img src={currentBossImage} alt={fight.name} className="boss-sprite" />
      </div>

      {/* НИЖНЯЯ ПАНЕЛЬ С КНОПКАМИ (ВОТ ОНА!) */}
      <div className="fight-bottom-panel">
        
        {/* Слоты с оружием */}
        <div className="weapon-slots">
          <div className="slot" onClick={() => handleHit(100)} title="Удар 100">🔪</div>
          <div className="slot" onClick={() => handleHit(200)} title="Удар 200">🔫</div>
          <div className="slot" onClick={() => handleHit(300)} title="Удар 300">💣</div>
          <div className="slot">🗝️</div>
          <div className="slot">💀</div>
          <div className="slot">🛡️</div>
        </div>

        {/* Панель талантов */}
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