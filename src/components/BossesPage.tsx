import { useState, useEffect } from 'react';
import BossLobby from './BossLobby'; 
import type { BossDetails } from './BossLobby';
import BossFightScene from './BossFightScene';
import BossResultScene from './BossResultScene'; // <--- ДОБАВИТЬ ИМПОРТ

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

function BossCard({ boss, onAttack }: { boss: Boss; onAttack: (id: string) => void }) {
  const r = boss.reward;
  return (
    <div className="boss-card">
      <div className="boss-left">
        <img className="boss-avatar" src={boss.image} alt="" />
        <div className="boss-name">{boss.name}</div>
        <button className="boss-attack-btn" onClick={() => onAttack(boss.id)}>Атаковать</button>
      </div>

      <div className="boss-reward">
        <div className="boss-reward-title">· Награда ·</div>
        <div className="boss-reward-row">
          🚬 {r.cigarettes} &nbsp;&nbsp; 🤘 {r.reputation.toLocaleString('ru-RU')}
        </div>
        <div className="boss-reward-row">🗝️ Ключи: {r.keys}</div>
      </div>

      <div className="boss-combos">
        {(['common', 'rare', 'epic'] as const).map((tier) => (
          <div key={tier} className={`combo-frame combo-frame--${tier}`}>
            <div className="combo-empty" />
          </div>
        ))}
      </div>

      <div className="boss-stats">
        <div className="boss-stats-row"><span>Победы:</span> <b>0</b></div>
        <div className="boss-stats-row"><span className="skull skull--common">💀</span> 0</div>
        <div className="boss-stats-row"><span className="skull skull--rare">💀</span> 0</div>
        <div className="boss-stats-row"><span className="skull skull--epic">💀</span> 0</div>
      </div>
    </div>
  );
}

export default function BossesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('common');
  const [serverBosses, setServerBosses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [lobbyBoss, setLobbyBoss] = useState<BossDetails | null>(null);
  const [activeFight, setActiveFight] = useState<{ fight: any, mode: string } | null>(null);
  const [loadingLobby, setLoadingLobby] = useState(false);
  
  // ДОБАВЛЯЕМ СОСТОЯНИЕ ДЛЯ РЕЗУЛЬТАТА БОЯ
  const [fightResult, setFightResult] = useState<{ result: 'win' | 'lose', reward?: any, bossName: string } | null>(null);

  useEffect(() => {
  async function initPage() {
    try {
      const activeRes = await fetch('/api/bosses/active');
      const activeData = await activeRes.json();
      
      // 1. Если есть активный бой — открываем его
      if (activeData.active) {
        setActiveFight({
          fight: {
            bossId: activeData.bossId,
            name: activeData.name,
            img_boss: activeData.img_boss,
            currentHp: activeData.currentHp,
            maxHp: activeData.maxHp,
            endTime: activeData.endTime,
            serverTime: activeData.serverTime,
            inventory: activeData.inventory
          },
          mode: activeData.mode || 'pazan'
        });
        setLoading(false);
        return;
      }

      // 2. ЕСЛИ БОЯ НЕТ, НО ЕСТЬ РЕЗУЛЬТАТ (прошлый бой закончился)
      if (activeData.result) {
        setFightResult({
          result: activeData.result, // 'win' или 'lose'
          bossName: activeData.bossName || 'Босс', // Если сервер присылает имя
          reward: activeData.reward || null // Если сервер присылает награду (для win)
        });
        setLoading(false);
        return;
      }

      // 3. Если ничего нет — грузим витрину
      const res = await fetch('/api/bosses');
      const data = await res.json();
      setServerBosses(data.bosses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  initPage();
}, []);;

  const handleAttackClick = async (bossId: string) => {
    setLoadingLobby(true);
    try {
      const res = await fetch(`/api/bosses/${bossId}`);
      if (!res.ok) throw new Error('Ошибка загрузки деталей');
      const data: BossDetails = await res.json();
      setLobbyBoss(data);
    } catch (err) {
      alert('Не удалось получить данные босса');
    } finally {
      setLoadingLobby(false);
    }
  };

  const formattedBosses: Boss[] = serverBosses.map((b) => {
    let totalKeys = 0;
    if (b.reward?.keys_drop) {
      totalKeys = Object.values(b.reward.keys_drop).reduce((sum: number, val: any) => sum + Number(val), 0);
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
        onClose={() => setFightResult(null)}
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
          setLobbyBoss(null);
          setActiveFight({ 
            fight: { 
              ...fightData, 
              name: lobbyBoss.name,
              img_boss: lobbyBoss.img_boss,
              inventory: fightData.inventory // <--- ДОБАВИТЬ ИНВЕНТАРЬ (если сервер его вернул)
            }, 
            mode 
          });
        }} 
      />
    );
  }

  // 3. Витрина
  if (loading) return <div>Загрузка витрины...</div>;

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
        {formattedBosses.map((b) => (
          <BossCard key={b.id} boss={b} onAttack={handleAttackClick} />
        ))}
      </div>
    </div>
  );
}