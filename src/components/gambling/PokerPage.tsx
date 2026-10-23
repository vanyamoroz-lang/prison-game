import { useState, useEffect } from 'react';
import { api } from '../../api';
import '../../styles/poker.css';

const TABLE_BG = '/assets/gambling/pokerTable.png';
const ICON_SOAP = '/assets/icons/soap.png';
const ICON_CHIP = '/assets/icons/pokerChip.png';
const ICON_MATCH = '/assets/icons/matches.png';

type PlayCurrency = 'soap' | 'chip';

interface PokerState {
  level: number;
  progress: number;          // 0..100 — заполнение шкалы до следующего уровня
  balance: {
    chips: number;           // фишки
    matches: number;         // спички
  };
}

interface PlayResult extends PokerState {
  message: string;
  win: boolean;
  rewardType?: 'chips' | 'matches' | 'money';
  rewardAmount?: number;
}

interface Props {
  onExit: () => void;
}

export default function PokerPage({ onExit }: Props) {
  const [state, setState] = useState<PokerState | null>(null);
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState<PlayResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

 
  useEffect(() => {
    api('/api/poker')
      .then((data: PokerState) => setState(data))
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handlePlay = async (currency: PlayCurrency) => {
    if (playing) return;
    setPlaying(true);
    setLastResult(null);
    setMessage('Раздача...');
    try {
      const data: PlayResult = await api('/api/poker/play', {
        method: 'POST',
        body: JSON.stringify({ currency }),
      });
      setState({ level: data.level, progress: data.progress, balance: data.balance });
      setMessage(data.message);
      setLastResult(data);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setPlaying(false);
    }
  };

  if (loading) return <div className="poker-loading">Загрузка стола...</div>;

  return (
    <div className="poker-page">
      <img className="poker-bg" src={TABLE_BG} alt="Покерный стол" />

      <button className="poker-btn-back" onClick={onExit}>← Выйти</button>

      {/* Шкала уровня слева */}
      <div className="poker-level">
        <div className="poker-level-label">Ур. {state?.level ?? 1}</div>
        <div className="poker-level-bar">
          <div
            className="poker-level-fill"
            style={{ height: `${state?.progress ?? 0}%` }}
          />
        </div>
        <div className="poker-level-percent">{Math.floor(state?.progress ?? 0)}%</div>
      </div>

      {/* Баланс сверху справа */}
      <div className="poker-balance">
        <div className="poker-balance-item">
          <img src={ICON_CHIP} alt="Фишки" />
          <span>{state?.balance.chips ?? 0}</span>
        </div>
        <div className="poker-balance-item">
          <img src={ICON_MATCH} alt="Спички" />
          <span>{state?.balance.matches ?? 0}</span>
        </div>
      </div>

      {/* Результат раздачи */}
      <div className="poker-message">
        <div className="poker-message-text">{message}</div>
        {lastResult?.win && lastResult.rewardType && (
          <div className="poker-reward">
            Награда: +{lastResult.rewardAmount} {
              lastResult.rewardType === 'chips' ? 'фишек' :
              lastResult.rewardType === 'matches' ? 'спичек' : 'денег'
            }
          </div>
        )}
      </div>

      {/* Кнопки игры внизу */}
      <div className="poker-actions">
        <button
          className="poker-play-btn"
          disabled={playing}
          onClick={() => handlePlay('soap')}
        >
          Играть 15 <img src={ICON_SOAP} alt="мыло" />
        </button>
        <button
          className="poker-play-btn"
          disabled={playing}
          onClick={() => handlePlay('chip')}
        >
          Играть 1 <img src={ICON_CHIP} alt="фишка" />
        </button>
      </div>
    </div>
  );
}