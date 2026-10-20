import { useState } from 'react';

const TABS = [
  { id: 'fights',  icon: '🥊', title: 'Зарубы' },
  { id: 'daily',   icon: '📋', title: 'Журнал дейликов' },
  { id: 'news',    icon: '📰', title: 'Новости' },
  { id: 'cases',   icon: '🎁', title: 'Кейсы' },
  { id: 'stash',   icon: '🔑', title: 'Нычки' },
  { id: 'brawl',   icon: '⚔️', title: 'Игра в зарубы' },
  { id: 'warmup',  icon: '🔥', title: 'Подогрев' },
];

export default function BottomTabs() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="tabs">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab ${active === t.id ? 'active' : ''}`}
          title={t.title}
          onClick={() => setActive(t.id)}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}