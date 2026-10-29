import { useState, useEffect } from 'react';
import { api } from '../../api';
import { usePlayer } from '../../store/playerStore';
import '../../styles/poker.css';

const TABLE_BG = '/assets/gambling/pokerTable.png';
//const ICON_CHIP = '/assets/icons/pokerChip.png';
//const ICON_MATCH = '/assets/icons/matches.png';

// ---------- Типы ----------
interface Card {
  rank: string;
  suit: string;
  red: boolean;
}

interface PokerData {
  active?: boolean;
  hand?: unknown[];
  swapsLeft?: number;
  next_swaps_left?: number;
  level?: number;
  exp?: number;
  exp_in_level?: number;
  exp_to_next_level?: number;
  games_to_next_level?: number;
  combo?: string;
  combo_name?: string;
  prize?: number;
  rewardType?: string;
  finished?: boolean;
  exp_gained?: number;
  reward?: { type: string; amount: number };
  cigarettes?: number;
  reputation?: number;
  message?: string;
  error?: string;
}


interface Props {
  onExit: () => void;
}

// ---------- Утилиты ----------
const SUITS: Record<string, string> = {
  s: '♠', spades: '♠', spade: '♠', '♠': '♠',
  h: '♥', hearts: '♥', heart: '♥', '♥': '♥',
  d: '♦', diamonds: '♦', diamond: '♦', '♦': '♦',
  c: '♣', clubs: '♣', club: '♣', '♣': '♣',
};

const RANKS: Record<string, string> = {
  '11': 'J', '12': 'Q', '13': 'K', '14': 'A', '1': 'A',
  t: '10', j: 'J', q: 'Q', k: 'K', a: 'A',
  jack: 'J', queen: 'Q', king: 'K', ace: 'A',
};

const normRank = (r: unknown): string => {
  const s = String(r ?? '').trim();
  return RANKS[s.toLowerCase()] ?? s.toUpperCase();
};

const normSuit = (s: unknown): string => {
  const str = String(s ?? '').trim();
  return SUITS[str.toLowerCase()] ?? (str || '?');
};

/** Карта может прийти строкой ("AS", "10h", "K♠") или объектом ({ rank, suit }). */
const parseCard = (raw: unknown): Card => {
  let rank = '?';
  let suit = '?';

  if (typeof raw === 'string') {
    const m = raw.trim().match(/^(10|1[1-4]|[2-9TJQKA])\s*(.+)$/i);
    if (m) {
      rank = normRank(m[1]);
      suit = normSuit(m[2]);
    }
  } else if (raw !== null && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    rank = normRank(o.rank ?? o.value ?? o.r);
    suit = normSuit(o.suit ?? o.s);
  }

  return { rank, suit, red: suit === '♥' || suit === '♦' };
};

const REWARD_NAMES: Record<string, string> = {
  cigarettes: 'сигарет',
  reputation: 'авторитета',
  rubles: 'рублей',
  coins: 'монет',
  energy: 'энергии',
};

const rewardName = (t?: string): string => (t ? REWARD_NAMES[t] ?? t : '');

const errText = (e: unknown, fallback: string): string =>
  e instanceof Error ? e.message : fallback;

/** Типизированный вызов API покера */
const pokerApi = async (url: string, body?: unknown): Promise<PokerData> => {
  let init: RequestInit | undefined;
  if (body !== undefined) {
    init = { method: 'POST', body: JSON.stringify(body) };
  } else if (url !== '/api/poker') {
    init = { method: 'POST' };
  }

  const call = api as unknown as (u: string, i?: RequestInit) => Promise<unknown>;
  const resp = await call(url, init);
  return (resp ?? {}) as PokerData;
};

// ---------- Компонент ----------
export default function PokerPage({ onExit }: Props) {
  const applyPlayerData = usePlayer((s) => s.applyPlayerData);
  const fetchPlayerData = usePlayer((s) => s.fetchPlayerData);

  const [data, setData] = useState<PokerData | null>(null);
  const [active, setActive] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  /** Сливаем ответ сервера с текущим состоянием */
  const merge = (resp: PokerData) =>
    setData((prev: PokerData | null) => ({ ...(prev ?? {}), ...resp }));

  // Загрузка состояния стола
  useEffect(() => {
    pokerApi('/api/poker')
      .then((resp: PokerData) => {
        setData((prev: PokerData | null) => ({ ...(prev ?? {}), ...resp }));
        setActive(!!resp.active);
      })
      .catch((e: unknown) => setError(errText(e, 'Не удалось загрузить стол')))
      .finally(() => setLoading(false));
  }, []);

  const onFinished = (resp: PokerData) => {
    setActive(false);
    setFinished(true);
    applyPlayerData(resp); // сигареты / авторитет в верхнюю панель
    void fetchPlayerData();
  };

  // Раздача
  const handleStart = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setFinished(false);
    try {
      const resp = await pokerApi('/api/poker/start');
      setData((prev: PokerData | null) => ({
        ...(prev ?? {}),
        ...resp,
        reward: undefined,
        exp_gained: undefined,
        finished: false,
      }));
      setActive(true);
      applyPlayerData(resp); // списание сигарет за вход
    } catch (e: unknown) {
      setError(errText(e, 'Не удалось начать игру'));
    } finally {
      setBusy(false);
    }
  };

  // Замена карты
  const handleChange = async (cardIndex: number) => {
    if (busy || !active || (data?.swapsLeft ?? 0) <= 0) return;
    setBusy(true);
    setError('');
    try {
      const resp = await pokerApi('/api/poker/change', { cardIndex });
      merge(resp);
      if (resp.finished) onFinished(resp);
    } catch (e: unknown) {
      setError(errText(e, 'Не удалось заменить карту'));
    } finally {
      setBusy(false);
    }
  };

  // Забрать выигрыш
  const handleFinish = async () => {
    if (busy || !active) return;
    setBusy(true);
    setError('');
    try {
      const resp = await pokerApi('/api/poker/finish');
      merge(resp);
      onFinished(resp);
    } catch (e: unknown) {
      setError(errText(e, 'Не удалось завершить игру'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="poker-loading">Загрузка стола...</div>;

  // Уровень
  const level = data?.level ?? 1;
  const inLevel = data?.exp_in_level ?? 0;
  const toNext = data?.exp_to_next_level ?? 0;
  const total = inLevel + toNext;
  const progress = total > 0 ? Math.min(100, (inLevel / total) * 100) : 0;

  const hand: Card[] = Array.isArray(data?.hand) ? data!.hand!.map(parseCard) : [];
  const swapsLeft = data?.swapsLeft ?? 0;
  const canSwap = active && !busy && swapsLeft > 0;

  return (
    <div className="poker-page">
      <img className="poker-bg" src={TABLE_BG} alt="" />

      <button className="poker-btn-back" onClick={onExit}>← Выйти</button>

      {/* Уровень */}
      <div className="poker-level">
        <div className="poker-level-label">Ур. {level}</div>
        <div className="poker-level-bar">
          <div className="poker-level-fill" style={{ height: `${progress}%` }} />
        </div>
        <div className="poker-level-percent">{Math.floor(progress)}%</div>
        {data?.games_to_next_level != null && (
          <div className="poker-level-hint">ещё {data.games_to_next_level} игр</div>
        )}
      </div>

      {/* Комбинация */}
      {hand.length > 0 && (
        <div className="poker-combo">
          <div className="poker-combo-name">{data?.combo_name ?? '—'}</div>
          {data?.prize != null && (
            <div className="poker-combo-prize">
              {finished ? 'Выигрыш' : 'Сейчас'}: {data.prize} {rewardName(data.rewardType)}
            </div>
          )}
        </div>
      )}

      {/* Карты */}
      <div className="poker-hand">
        {hand.map((c: Card, i: number) => (
          <button
            key={`${i}-${c.rank}${c.suit}`}
            className={`poker-card ${c.red ? 'red' : ''} ${canSwap ? 'swappable' : ''}`}
            disabled={!canSwap}
            onClick={() => handleChange(i)}
            title={canSwap ? 'Заменить карту' : ''}
          >
            <span className="poker-card-corner">
              {c.rank}
              <br />
              {c.suit}
            </span>
            <span className="poker-card-suit">{c.suit}</span>
          </button>
        ))}
      </div>

      {/* Сообщения */}
      <div className="poker-message">
        {error && <div className="poker-error">{error}</div>}

        {!error && active && (
          <div className="poker-message-text">
            Нажми на карту, чтобы заменить. Замен осталось: <b>{swapsLeft}</b>
          </div>
        )}

        {!error && finished && (
          <div className="poker-reward">
            {data?.reward && data.reward.amount > 0
              ? `Награда: +${data.reward.amount} ${rewardName(data.reward.type)}`
              : 'Без выигрыша'}
            {data?.exp_gained ? ` · +${data.exp_gained} опыта` : ''}
          </div>
        )}


      </div>

      {/* Кнопки */}
      <div className="poker-actions">
        {active ? (
          <button className="poker-play-btn" disabled={busy} onClick={handleFinish}>
            Забрать
          </button>
        ) : (
          <button className="poker-play-btn" disabled={busy} onClick={handleStart}>
            {finished ? 'Ещё раз' : 'Раздать'}
          </button>
        )}
      </div>
    </div>
  );
}