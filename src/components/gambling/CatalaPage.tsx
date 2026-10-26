import { useEffect, useState } from 'react';
import { api } from '../../api';
import { usePlayer } from '../../store/playerStore';
import '../../styles/catala.css';

interface CardData {
  rank: number;
  suit: number;
}

interface GameState {
  active: boolean;
  hand?: CardData[];
  swapsLeft?: number;
}

interface FinishResult {
  win: boolean;
  rewardType: string | null;
  rewardAmount: number;
  combo: string | null;
  message: string;
}

const REWARD_META: Record<string, { title: string; icon: string }> = {
  rubles: { title: 'рублей', icon: '₽' },
  cigarettes: { title: 'сигарет', icon: '/assets/icons/smoke1.png' }
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const CIGARETTE_ICON = '/assets/icons/smoke1.png';

// Строки сверху вниз, как на картинке. Последняя строка (рубашки) — скрытая комбинация.
const COMBO_ROWS: { key: string; label: string; reward: number | null }[] = [
  { key: 'A',    label: 'A',  reward: 2500 },
  { key: 'K',    label: 'K',  reward: 2000 },
  { key: 'Q',    label: 'Q',  reward: 1500 },
  { key: 'J',    label: 'J',  reward: 1000 },
  { key: '10',   label: '10', reward: 800 },
  { key: '9',    label: '9',  reward: 700 },
  { key: '8',    label: '8',  reward: 500 },
  { key: '7',    label: '7',  reward: 300 },
  { key: 'back', label: '',   reward: 100 },
];

// Положение строк в процентах от высоты фона
const ROW_TOP_START = 26;
const ROW_STEP = 8.3;

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const toStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

/**
 * Сервер может называть поля по-разному, поэтому поддерживаем
 * несколько вариантов + вложенный объект reward.
 */
const parseFinishResult = (raw: unknown): FinishResult => {
  const data = asRecord(raw);
  if (!data) {
    return { win: false, rewardType: null, rewardAmount: 0, combo: null, message: '' };
  }

  const reward = asRecord(data.reward) ?? {};
  const rewardType =
    toStringOrNull(data.rewardType) ??
    toStringOrNull(data.reward_type) ??
    toStringOrNull(reward.type) ??
    toStringOrNull(data.prizeType) ??
    toStringOrNull(data.prize_type);

  const rewardAmount =
    toNumber(data.rewardAmount) ??
    toNumber(data.reward_amount) ??
    toNumber(reward.amount) ??
    toNumber(data.prizeAmount) ??
    toNumber(data.prize_amount) ??
    0;

  const message =
    toStringOrNull(data.message) ??
    toStringOrNull(data.msg) ??
    toStringOrNull(data.resultMessage) ??
    '';

  const winFlag = data.win ?? data.isWin ?? data.is_win ?? data.success;
  const winFromMessage = /выигр|побед|забрал|наград/i.test(message);
  const win = typeof winFlag === 'boolean' ? winFlag : rewardAmount > 0 || winFromMessage;

  const combo =
    toStringOrNull(data.combo) ??
    toStringOrNull(data.combination) ??
    toStringOrNull(data.comboLabel) ??
    toStringOrNull(data.combo_label) ??
    toStringOrNull(data.hand_name);

  return {
    win,
    rewardType,
    rewardAmount,
    combo,
    message,
  };
};

const getRewardMeta = (type: string | null) =>
  type ? REWARD_META[type] ?? { title: type, icon: '🎁' } : null;

const renderRewardIcon = (icon: string) =>
  icon.startsWith('/') ? (
    <img src={icon} alt="" className="catala-reward-img" />
  ) : (
    <span>{icon}</span>
  );

export default function CatalaPage() {
  const setLocation = usePlayer((s) => s.setLocation);
  const fetchPlayerData = usePlayer((s) => s.fetchPlayerData);
  const applyPlayerData = usePlayer((s) => s.applyPlayerData);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<FinishResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const getRankName = (rank: number) => {
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    if (rank === 14) return 'A';
    return rank.toString();
  };
  const getSuitSymbol = (suit: number) => ['♣', '♦', '♥', '♠'][suit] || '?';
  const isRed = (suit: number) => suit === 1 || suit === 2;

  useEffect(() => {
    api('/api/pairgame')
      .then((data: GameState) => setGameState(data))
      .catch((err: unknown) =>
        setMessage(err instanceof Error ? err.message : 'Не удалось загрузить стол')
      )
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    if (busy) return;
    setBusy(true);
    setResult(null);
    setMessage('Раздача...');
    try {
      const data = await api('/api/pairgame/start', { method: 'POST' });
      setGameState({ active: true, hand: data.hand, swapsLeft: data.swapsLeft });
      setMessage('Выбери карту для замены или вскрывайся!');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось начать игру');
    } finally {
      setBusy(false);
    }
  };

  const handleSwap = async (index: number) => {
    if (!gameState || !gameState.active || busy) return;
    if (!gameState.swapsLeft || gameState.swapsLeft <= 0) return;

    setBusy(true);
    try {
      const data = await api('/api/pairgame/swap', {
        method: 'POST',
        body: JSON.stringify({ position: index }),
      });
      setGameState((prev) => (prev ? { ...prev, ...data } : null));
      if (data.swapsLeft === 0) setMessage('Попытки кончились. Пора вскрываться!');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось заменить карту');
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('Вскрываемся...');
    try {
      const data = await api('/api/pairgame/finish', { method: 'POST' });
      const parsed = parseFinishResult(data);

      setGameState({ active: false, hand: data.hand ?? gameState?.hand });
      setMessage(parsed.message);
      setResult(parsed);

      // Если сервер вернул баланс прямо в ответе — применяем его,
      // затем добираем актуальные данные игрока для TopBar.
      applyPlayerData(data);
      void fetchPlayerData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось завершить игру');
    } finally {
      setBusy(false);
    }
  };

  const exitToYard = () => setLocation('yard');

  if (loading) return <div className="catala-loading">Загрузка стола...</div>;

  const rewardMeta = result
    ? getRewardMeta(result.rewardType) ??
      (result.rewardAmount > 0 ? { title: 'награды', icon: '🎁' } : null)
    : null;
  const showReward = Boolean(result?.win && rewardMeta && result.rewardAmount > 0);

  return (
    <div className="catala-page">
      <img className="catala-bg" src="/assets/bg/catala-table1.png" alt="Стол" />
      <div className="catala-combos" aria-hidden="true">
  {COMBO_ROWS.map((row, i) => (
    <div
      key={row.key}
      className="catala-combo-row"
      style={{ top: `${ROW_TOP_START + i * ROW_STEP}%` }}
    >
      {row.reward !== null ? (
        <>
          <span className="catala-combo-icon">{renderRewardIcon(CIGARETTE_ICON)}</span>
          <span className="catala-combo-amount">
            {row.reward.toLocaleString('ru-RU')}
          </span>
        </>
      ) : (
        <span className="catala-combo-amount catala-combo-amount--empty">—</span>
      )}
    </div>
  ))}
</div>
      <div className="catala-jackpot" role="status">
  СОРВАЛ КУШ!
</div>
      <button className="catala-btn-back" onClick={exitToYard}>
        ← Выйти
      </button>

      <div className="catala-table">
        {/* Карты дилера (слева) */}
        <div className="table-slot table-slot--dealer-1" />
        <div className="table-slot table-slot--dealer-2" />

        {/* Колода (в центре) */}
        <div className="table-slot table-slot--deck" />

        {/* Карты игрока (справа). Класс формируется динамически (player-0, player-1) */}
        {gameState?.hand?.map((card, i) => (
          <div
            key={i}
            className={`table-slot table-slot--player-${i} pg-card ${
              isRed(card.suit) ? 'red' : 'black'
            }`}
            onClick={() => handleSwap(i)}
            style={{
              cursor:
                gameState.active && gameState.swapsLeft && gameState.swapsLeft > 0 && !busy
                  ? 'pointer'
                  : 'default',
            }}
          >
            <div className="pg-card-value">{getRankName(card.rank)}</div>
            <div className="pg-card-suit">{getSuitSymbol(card.suit)}</div>
          </div>
        ))}

        {/* UI Взаимодействия */}
        {!gameState?.active ? (
          <button className="catala-play-btn" onClick={handleStart} disabled={busy}>
            {busy ? 'Раздача...' : 'Начать игру'}
          </button>
        ) : (
          <div className="catala-reveal-block">
            <div className="shulmovki">Шульмовок: {gameState.swapsLeft}</div>
            <button className="catala-reveal-btn" onClick={handleFinish} disabled={busy}>
              {busy ? '...' : 'Вскрыться'}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className="catala-message">
          <div className="catala-message-text">{message}</div>
        </div>
      )}

      {result && (
        <div className="catala-result" role="dialog" aria-modal="true" aria-label="Результат игры">
          <div className={`catala-result-card ${result.win ? 'win' : 'lose'}`}>
            <button
              className="catala-result-close"
              onClick={() => setResult(null)}
              aria-label="Посмотреть стол"
              title="Посмотреть стол"
            >
              ✕
            </button>
            <div className="catala-result-title">{result.win ? 'ВЫИГРАЛ!' : 'ПРОИГРАЛ'}</div>

            {result.combo && (
              <div className="catala-result-combo">Комбинация: {result.combo}</div>
            )}

            {showReward && rewardMeta && (
              <div className="catala-result-reward">
                <span className="catala-result-reward-icon">{renderRewardIcon(rewardMeta.icon)}</span>
                <span>
                  +{result.rewardAmount.toLocaleString('ru-RU')} {rewardMeta.title}
                </span>
              </div>
            )}

            {result.message && <div className="catala-result-message">{result.message}</div>}

            <div className="catala-result-actions">
              <button
                className="catala-result-btn catala-result-btn--primary"
                onClick={handleStart}
                disabled={busy}
              >
                {busy ? 'Раздача...' : 'Играть ещё'}
              </button>
              <button className="catala-result-btn" onClick={exitToYard}>
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


