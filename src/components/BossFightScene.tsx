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
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCloseRef = useRef(onClose);
  const closedRef = useRef(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const finishFight = (result: 'win' | 'lose', reward?: BossFightReward) => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose(result, reward);
  };

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
    // Пока летит запрос на выход — не закрываем сцену сами
    if (timeLeft > 0 || closedRef.current || leavingRef.current) return;
    closedRef.current = true;
    onCloseRef.current('lose');
  }, [timeLeft]);

  // Escape закрывает подтверждение сдачи
  useEffect(() => {
    if (!leaveConfirmOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !leavingRef.current) setLeaveConfirmOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [leaveConfirmOpen]);

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
        finishFight('win', data.reward);
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

  // === СДАТЬСЯ ===
  const openLeaveConfirm = () => {
    if (isLeaving || leavingRef.current || isAttacking || closedRef.current) return;
    setLeaveError(null);
    setLeaveConfirmOpen(true);
  };

  const closeLeaveConfirm = () => {
    if (leavingRef.current) return;
    setLeaveError(null);
    setLeaveConfirmOpen(false);
  };

  const handleLeave = async () => {
    if (leavingRef.current || closedRef.current) return;

    setIsLeaving(true);
    leavingRef.current = true;
    setLeaveError(null);

    try {
      const res = await fetch('/api/bosses/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data: { error?: string; message?: string; success?: boolean } = await res
        .json()
        .catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось сдаться');
      }

      // Только после успешного ответа сервера показываем поражение
      setLeaveConfirmOpen(false);
      finishFight('lose');
    } catch (err) {
      setLeaveError(err instanceof Error ? err.message : 'Не удалось сдаться');
    } finally {
      setIsLeaving(false);
      leavingRef.current = false;
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
            onClick={openLeaveConfirm} 
            title="Сдаться (нужно подтверждение)"
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openLeaveConfirm();
              }
            }}
            style={{
              marginLeft: 'auto',
              background: '#500',
              borderColor: '#a00',
              opacity: isLeaving ? 0.6 : 1,
              cursor: isLeaving ? 'wait' : 'pointer',
            }}
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

      {leaveConfirmOpen && (
        <div className="fight-confirm-overlay" onClick={closeLeaveConfirm}>
          <div
            className="fight-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fight-leave-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="fight-confirm__icon">🏳️</div>
            <h3 className="fight-confirm__title" id="fight-leave-title">
              Сдаться?
            </h3>
            <p className="fight-confirm__text">
              Бой будет засчитан как поражение. Точно сдаёмся?
            </p>

            {leaveError && <div className="fight-confirm__error">{leaveError}</div>}

            <div className="fight-confirm__actions">
              <button
                type="button"
                className="fight-confirm__btn fight-confirm__btn--danger"
                onClick={handleLeave}
                disabled={isLeaving}
              >
                {isLeaving ? 'Сдаёмся...' : 'Да, сдаться'}
              </button>
              <button
                type="button"
                className="fight-confirm__btn"
                onClick={closeLeaveConfirm}
                disabled={isLeaving}
              >
                Остаться
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}