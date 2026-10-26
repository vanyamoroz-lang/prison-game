import { useEffect, useState } from 'react';
import { api } from '../api';
import { usePlayer } from '../store/playerStore';

const WEAPONS = [
  { id: 'knife', name: 'Финка', icon: '/assets/icons/knife.png' },
  { id: 'poison', name: 'Яд', icon: '/assets/icons/poison.png' },
  { id: 'pistol', name: 'Самопал', icon: '/assets/icons/gun.png' },
] as const;

type WeaponId = (typeof WEAPONS)[number]['id'];

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 99;
const PRESETS = [1, 5, 10];

const readMessage = (data: unknown): string | null => {
  if (data && typeof data === 'object' && 'message' in data) {
    const value = (data as { message?: unknown }).message;
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
};

export default function WeaponShopModal({ onClose }: { onClose: () => void }) {
  const applyPlayerData = usePlayer((s) => s.applyPlayerData);
  const fetchPlayerData = usePlayer((s) => s.fetchPlayerData);

  const [weapon, setWeapon] = useState<WeaponId>('knife');
  const [amount, setAmount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selected = WEAPONS.find((item) => item.id === weapon) ?? WEAPONS[0];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const changeAmount = (delta: number) => {
    setAmount((prev) => Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, prev + delta)));
  };

  const pickWeapon = (id: WeaponId) => {
    setWeapon(id);
    setError(null);
    setSuccess(null);
  };

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await api('/api/shop/buy-weapon', {
        method: 'POST',
        body: JSON.stringify({ weapon, amount }),
      });

      // В ответе может прийти новый баланс/инвентарь — применяем сразу,
      // а затем добираем актуальные данные игрока с сервера.
      applyPlayerData(data);
      setSuccess(readMessage(data) ?? `Куплено: ${selected.name} × ${amount}`);
      void fetchPlayerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось купить оружие');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="weapon-shop"
        role="dialog"
        aria-modal="true"
        aria-label="Покупка оружия"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="weapon-shop-close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>

        <h3 className="weapon-shop-title">Оружейка</h3>
        <p className="weapon-shop-subtitle">Чем затаримся?</p>

        <div className="weapon-shop-list">
          {WEAPONS.map((item) => (
            <button
              key={item.id}
              className={`weapon-option ${weapon === item.id ? 'active' : ''}`}
              onClick={() => pickWeapon(item.id)}
              type="button"
            >
              <img className="weapon-option-icon" src={item.icon} alt="" />
              <span className="weapon-option-name">{item.name}</span>
            </button>
          ))}
        </div>

        <div className="weapon-shop-amount">
          <span className="weapon-amount-label">Количество</span>
          <div className="weapon-amount-control">
            <button
              type="button"
              className="weapon-amount-btn"
              onClick={() => changeAmount(-1)}
              disabled={amount <= MIN_AMOUNT}
              aria-label="Меньше"
            >
              −
            </button>
            <span className="weapon-amount-value">{amount}</span>
            <button
              type="button"
              className="weapon-amount-btn"
              onClick={() => changeAmount(1)}
              disabled={amount >= MAX_AMOUNT}
              aria-label="Больше"
            >
              +
            </button>
          </div>
        </div>

        <div className="weapon-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`weapon-preset ${amount === preset ? 'active' : ''}`}
              onClick={() => setAmount(preset)}
            >
              ×{preset}
            </button>
          ))}
        </div>

        {error && <div className="weapon-shop-message error">{error}</div>}
        {success && <div className="weapon-shop-message success">{success}</div>}

        <button type="button" className="weapon-shop-buy" onClick={buy} disabled={busy}>
          {busy ? 'Покупаем...' : `Купить ${selected.name} × ${amount}`}
        </button>
      </div>
    </div>
  );
}
