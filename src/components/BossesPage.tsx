import { useState } from 'react';
import { COMMON_BOSSES, SOLO_BOSSES, SECRET_BOSSES } from '../data/bosses';
import type { Boss } from '../data/bosses';

const TABS = [
  { id: 'common', title: 'Общие', list: COMMON_BOSSES },
  { id: 'solo', title: 'Соло', list: SOLO_BOSSES },
  { id: 'secret', title: 'Засекречено', list: SECRET_BOSSES },
] as const;

function BossCard({ boss }: { boss: Boss }) {
  const r = boss.reward;
  return (
    <div className="boss-card">
      <div className="boss-left">
        <img className="boss-avatar" src={boss.image} alt="" />
        <div className="boss-name">{boss.name}</div>
        <button className="boss-attack-btn">Атаковать</button>
      </div>

      <div className="boss-reward">
        <div className="boss-reward-title">· Награда ·</div>
        <div className="boss-reward-row">🚬 {r.cigarettes}  ₽ {r.rubles.toLocaleString('ru-RU')}</div>
        <div className="boss-reward-row">🔪 {r.finka}  🔫 {r.pal}  ☠️ {r.poison}</div>
        <div className="boss-reward-row">🗝️ {r.keys}</div>
        <div className="boss-reward-limit">Лимит: {r.limitCurrent} / {r.limitMax}</div>
      </div>

      <div className="boss-combos">
        {(['common', 'rare', 'epic'] as const).map((tier) => {
          const solver = boss.combos[tier];
          return (
            <div key={tier} className={`combo-frame combo-frame--${tier}`}>
              {solver ? <img src={solver.avatar} alt="" /> : <div className="combo-empty" />}
            </div>
          );
        })}
      </div>

      <div className="boss-stats">
        <div className="boss-stats-row">
          <span>Победы:</span> <b>{boss.wins.toLocaleString('ru-RU')}</b>
        </div>
        <div className="boss-stats-row">
          <span className="skull skull--common">💀</span> {boss.comboStats.common.toLocaleString('ru-RU')}
        </div>
        <div className="boss-stats-row">
          <span className="skull skull--rare">💀</span> {boss.comboStats.rare.toLocaleString('ru-RU')}
        </div>
        <div className="boss-stats-row">
          <span className="skull skull--epic">💀</span> {boss.comboStats.epic.toLocaleString('ru-RU')}
        </div>
      </div>
    </div>
  );
}

export default function BossesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('common');
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="bosses-page">
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
        {active.list.map((b) => <BossCard key={b.id} boss={b} />)}
      </div>
    </div>
  );
}