import '../styles/yard.css';
import { useState, useEffect, useCallback, useRef }  from 'react';
import { api } from '../api';
import { usePlayer } from '../store/playerStore';
import GameChoiceModal from './gambling/GameChoiceModal';

const ICON_CIGARETTE = '/assets/icons/sbor_smoke.png';

interface Slot {
  active: boolean;
  nextSpawnAt: number | null; // Unix timestamp, секунды
}

interface YardState {
  slots: Record<string, Slot>;
}

const SLOT_IDS = ['1', '2', '3', '4'];

// Позиции слотов в процентах от сцены. Подберите под картинку двора.
const SLOT_POS: Record<string, { left: string; top: string }> = {
  '1': { left: '18%', top: '59%' },
  '2': { left: '51%', top: '50%' },
  '3': { left: '30%', top: '65%' },
  '4': { left: '65%', top: '55%' },
};

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function YardScene() {
  const [showChoice, setShowChoice] = useState(false);
  const [yard, setYard] = useState<YardState | null>(null);
  const [now, setNow] = useState(() => Date.now() / 1000);
  const [busy, setBusy] = useState<string | null>(null);
  const lastRefresh = useRef(0);

 const load = useCallback(async () => {
    lastRefresh.current = Date.now();
    try {
      const data: YardState = await api('/api/yard');
      setYard(data);
    } catch (err) {
      console.error(err);
    }
  }, []); 

  // Первичная загрузка двора
  useEffect(() => {
    load();
  }, [load]);

   // Тик раз в секунду для таймеров
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(t);
  }, []);

  // Если таймер дошёл до нуля, просим сервер обновить состояние.
  useEffect(() => {
    if (!yard) return;
    const expired = Object.values(yard.slots).some(
      (s) => !s.active && s.nextSpawnAt !== null && s.nextSpawnAt <= now
    );
    if (expired && Date.now() - lastRefresh.current > 2000) {
      load();
    }
  }, [now, yard, load]);
  
  const collect = async (slotId: string) => {
    if (busy) return;
    setBusy(slotId);
    try {
      const data = await api('/api/yard/collect', {
        method: 'POST',
        body: JSON.stringify({ slotId }),
      });
      setYard(data.yard_state);
      usePlayer.setState({ cigarettes: data.cigarettes }); // TopBar обновится сам
    } catch (err) {
      console.error(err);
      load();
    } finally {
      setBusy(null);
    }
  };
 
return (
    <>
      <div className="yard">
        {SLOT_IDS.map((id) => {
          const slot = yard?.slots[id];
          const remaining =
            slot && !slot.active && slot.nextSpawnAt
              ? Math.max(0, Math.ceil(slot.nextSpawnAt - now))
              : 0;

          if (slot?.active) {
            return (
              <button
                key={id}
                className="yard-slot"
                style={SLOT_POS[id]}
                disabled={busy === id}
                onClick={() => collect(id)}
                aria-label="Собрать сигарету"
              >
                <img src={ICON_CIGARETTE} alt="" className="yard-cigarette" />
              </button>
            );
          }

          return (
            <div key={id} className="yard-timer" style={SLOT_POS[id]}>
              {formatTime(remaining)}
            </div>
          );
        })}
      </div>
      <button
        className="npc-catala-hotspot"
        onClick={() => setShowChoice(true)}
        aria-label="Катала"
      />
      <img
        className="npc-icon-cards"
        src="/assets/icons/dvorKatala.png"
        alt=""
        onClick={() => setShowChoice(true)}
      />
      {showChoice && <GameChoiceModal onClose={() => setShowChoice(false)} />}
    </>
  );
}
