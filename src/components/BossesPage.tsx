import { useCallback, useEffect, useState } from 'react';
import BossLobby from './BossLobby'; 
import type { BossDetails } from './BossLobby';
import BossFightScene from './BossFightScene';
import BossResultScene from './BossResultScene'; // <--- ДОБАВИТЬ ИМПОРТ
import { usePlayer } from '../store/playerStore';
import type { ActiveBossFight, BossFightReward, ServerBoss } from './bossTypes';
import '../styles/bosses.css';

export interface BossReward {
  cigarettes: number;
  reputation: number;
  keys: number;
}

export interface ComboSolver {
  name: string;
  avatar: string;
}

export interface Boss {
  id: string;
  name: string;
  image: string;
  reward: BossReward;
  combos: {
    common: ComboSolver | null;
    rare: ComboSolver | null;
    epic: ComboSolver | null;
  };
  wins: number;
  comboStats: {
    common: number;
    rare: number;
    epic: number;
  };
}

const TABS = [
  { id: 'common', title: 'Общие' },
  { id: 'solo', title: 'Соло' },
  { id: 'secret', title: 'Засекречено' },
] as const;

const COMBO_TITLES = {
  common: 'Обычное комбо',
  rare: 'Редкое комбо',
  epic: 'Эпическое комбо',
} as const;

// Сервер не отдаёт отдельный эндпоинт «результат просмотрен/получен»,
// поэтому запоминаем показ результата в рамках вкладки. Это убирает
// повторный показ одного и того же результата при перезаходе на страницу.
const RESULT_SEEN_KEY = 'bossResultSeen';

const hasSeenBossResult = () => {
  try {
    return sessionStorage.getItem(RESULT_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const markBossResultSeen = () => {
  try {
    sessionStorage.setItem(RESULT_SEEN_KEY, '1');
  } catch {
    // sessionStorage может быть недоступен (приватный режим) — не критично
  }
};

const clearBossResultSeen = () => {
  try {
    sessionStorage.removeItem(RESULT_SEEN_KEY);
  } catch {
    // ignore
  }
};

function BossCard({ boss, onAttack }: { boss: Boss; onAttack: (id: string) => void }) {
  const r = boss.reward;

  return (
    <article className="boss-card">
      {/* Тёмное окно слева на панели */}
      <div className="boss-card__portrait">
        <img className="boss-card__avatar" src={boss.image} alt={boss.name} loading="lazy" />
      </div>

      {/* Пергамент «НАГРАДА» в центре панели */}
      <div className="boss-card__rewards">
        <div className="boss-card__reward-row">
          <span className="boss-card__reward-icon">🚬</span>
          <span>{r.cigarettes.toLocaleString('ru-RU')}</span>
        </div>
        <div className="boss-card__reward-row">
          <span className="boss-card__reward-icon">🤘</span>
          <span>{r.reputation.toLocaleString('ru-RU')}</span>
        </div>
        <div className="boss-card__reward-row">
          <span className="boss-card__reward-icon">🗝️</span>
          <span>{r.keys.toLocaleString('ru-RU')}</span>
        </div>
      </div>

      {/* Металлическая часть справа: имя, комбо, статистика, кнопка */}
      <div className="boss-card__side">
        <div className="boss-card__name" title={boss.name}>{boss.name}</div>

        <div className="boss-card__combos">
          {(['common', 'rare', 'epic'] as const).map((tier) => (
            <div key={tier} className={`combo-frame combo-frame--${tier}`} title={COMBO_TITLES[tier]}>
              <div className="combo-empty" />
            </div>
          ))}
        </div>

        <div className="boss-card__stats">
          <span className="boss-card__stat"><b>{boss.wins}</b> побед</span>
          <span className="boss-card__stat" title="Обычные комбо">
            <span className="skull skull--common">💀</span>{boss.comboStats.common}
          </span>
          <span className="boss-card__stat" title="Редкие комбо">
            <span className="skull skull--rare">💀</span>{boss.comboStats.rare}
          </span>
          <span className="boss-card__stat" title="Эпические комбо">
            <span className="skull skull--epic">💀</span>{boss.comboStats.epic}
          </span>
        </div>

        <button className="boss-card__attack" type="button" onClick={() => onAttack(boss.id)}>
          Атаковать
        </button>
      </div>
    </article>
  );
}

export default function BossesPage() {
  const fetchPlayerData = usePlayer((s) => s.fetchPlayerData);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('common');
  const [serverBosses, setServerBosses] = useState<ServerBoss[]>([]);
  const [loading, setLoading] = useState(true);

  const [lobbyBoss, setLobbyBoss] = useState<BossDetails | null>(null);
  const [activeFight, setActiveFight] = useState<{ fight: ActiveBossFight; mode: string } | null>(null);
  const [loadingLobby, setLoadingLobby] = useState(false);
  
  // ДОБАВЛЯЕМ СОСТОЯНИЕ ДЛЯ РЕЗУЛЬТАТА БОЯ
  const [fightResult, setFightResult] = useState<{
    result: 'win' | 'lose';
    reward?: BossFightReward;
    bossName: string;
  } | null>(null);

  // Витрину грузим отдельной функцией: её нужно обновлять и после результата боя,
  // и при возврате на страницу, иначе остаётся пустой экран.
  const loadShowcase = useCallback(async () => {
    try {
      const res = await fetch('/api/bosses');
      if (!res.ok) throw new Error('Не удалось загрузить список боссов');
      const data = await res.json();
      setServerBosses(Array.isArray(data.bosses) ? data.bosses : []);
    } catch (err) {
      console.error('Ошибка загрузки витрины боссов:', err);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function initPage() {
      try {
        const activeRes = await fetch('/api/bosses/active');
        const activeData = await activeRes.json();

        if (!alive) return;

        // 1. Если есть активный бой — открываем его
        if (activeData.active) {
          // Начался новый бой — следующий результат нужно показать заново
          clearBossResultSeen();
          setActiveFight({
            fight: {
              bossId: activeData.bossId,
              name: activeData.name,
              img_boss: activeData.img_boss,
              currentHp: activeData.currentHp,
              maxHp: activeData.maxHp,
              endTime: activeData.endTime,
              serverTime: activeData.serverTime,
              inventory: activeData.inventory,
            },
            mode: activeData.mode || 'pazan',
          });
          setLoading(false);
          // Список грузим в фоне, чтобы он был готов к возврату с боя
          void loadShowcase();
          return;
        }

        // 2. Если боя нет, но есть результат — показываем его только один раз
        if (activeData.result) {
          if (!hasSeenBossResult()) {
            markBossResultSeen();
            setFightResult({
              result: activeData.result, // 'win' или 'lose'
              bossName: activeData.bossName || 'Босс',
              reward: activeData.reward || undefined,
            });
          }
        } else {
          // Сервер уже забыл результат — снимаем локальную отметку
          clearBossResultSeen();
        }

        // 3. Витрину грузим ВСЕГДА, даже если сверху показан результат.
        // Это и лечит пустую страницу после «Забрать награду».
        await loadShowcase();
      } catch (err) {
        console.error(err);
        if (alive) await loadShowcase();
      } finally {
        if (alive) setLoading(false);
      }
    }

    void initPage();
    return () => {
      alive = false;
    };
  }, [loadShowcase]);

  const handleRefresh = async () => {
    setLoading(true);
    await loadShowcase();
    setLoading(false);
  };

  const handleAttackClick = async (bossId: string) => {
    setLoadingLobby(true);
    try {
      const res = await fetch(`/api/bosses/${bossId}`);
      if (!res.ok) throw new Error('Ошибка загрузки деталей');
      const data: BossDetails = await res.json();
      setLobbyBoss(data);
    } catch {
      alert('Не удалось получить данные босса');
    } finally {
      setLoadingLobby(false);
    }
  };

  const formattedBosses: Boss[] = serverBosses.map((b) => {
    let totalKeys = 0;
    const keysDrop = b.reward?.keys_drop;
    if (keysDrop) {
      totalKeys = Object.values(keysDrop).reduce<number>((sum, val) => sum + Number(val), 0);
    }
    return {
      id: String(b.id),
      name: b.name,
      image: b.img_boss,
      reward: {
        cigarettes: b.reward?.cigarettes || 0,
        reputation: b.reward?.reputation || 0,
        keys: totalKeys,
      },
      combos: { common: null, rare: null, epic: null },
      wins: 0,
      comboStats: { common: 0, rare: 0, epic: 0 },
    };
  });

  // 0. ЭКРАН РЕЗУЛЬТАТА БОЯ
  if (fightResult) {
    return (
      <BossResultScene 
        result={fightResult.result}
        bossName={fightResult.bossName}
        reward={fightResult.reward}
        onClose={() => {
          setFightResult(null);
          // Возвращаемся на витрину: обязательно перезапрашиваем список,
          // иначе после «Забрать награду» страница будет пустой.
          if (serverBosses.length === 0) setLoading(true);
          void loadShowcase().finally(() => setLoading(false));
          // После боя обновляем баланс/авторитет в верхней панели
          void fetchPlayerData();
        }}
      />
    );
  }

  // 1. Сцена боя
  if (activeFight) {
    return (
      <BossFightScene 
        fight={activeFight.fight} 
        mode={activeFight.mode} 
        onClose={(result, reward) => {
          // Результат уже показан локально — не даём серверу показать его ещё раз
          markBossResultSeen();
          setActiveFight(null);
          setFightResult({
            result,
            reward,
            bossName: activeFight.fight.name
          });
        }} 
      />
    );
  }

  // 2. Предбанник
  if (lobbyBoss) {
    return (
      <BossLobby 
        boss={lobbyBoss} 
        onClose={() => setLobbyBoss(null)} 
        onFightSuccess={(fightData, mode) => {
          // Стартовал новый бой — разрешаем показать его результат
          clearBossResultSeen();
          setLobbyBoss(null);
          setActiveFight({ 
            fight: { 
              ...fightData, 
              name: lobbyBoss.name,
              img_boss: lobbyBoss.img_boss
            }, 
            mode 
          });
        }} 
      />
    );
  }

  // 3. Витрина
  if (loading) return <div className="bosses-loading">Загрузка витрины...</div>;

  return (
    <div className="bosses-page">
      {loadingLobby && <div className="loader">Загрузка данных босса...</div>}
      
      <div className="bosses-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`bosses-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.title}
          </button>
        ))}
      </div>
      <div className="bosses-list">
        {formattedBosses.length === 0 ? (
          <div className="bosses-empty">
            <div>Список боссов пуст</div>
            <button className="bosses-refresh-btn" type="button" onClick={handleRefresh}>
              Обновить
            </button>
          </div>
        ) : (
          formattedBosses.map((b) => (
            <BossCard key={b.id} boss={b} onAttack={handleAttackClick} />
          ))
        )}
      </div>
    </div>
  );
}