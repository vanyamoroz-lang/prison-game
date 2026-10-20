import { usePlayer } from '../store/playerStore';

const fmt = (n: number) => n.toLocaleString('ru-RU');

export default function TopBar() {
  const p = usePlayer();
  const items = [
    { icon: '👤', value: p.name, wide: true },
    { icon: '🤘', value: fmt(p.authority), title: 'Авторитет' },
    { icon: '⚡', value: p.energy, title: 'Энергия' },
    { icon: '🚬', value: fmt(p.cigarettes), title: 'Сигареты' },
    { icon: '₽', value: fmt(p.rubles), title: 'Рубли' },
    { icon: '🪙', value: fmt(p.coins), title: 'Валюта' },
  ];
  return (
    <div className="topbar">
      {items.map((i, k) => (
        <div key={k} className={`chip ${i.wide ? 'wide' : ''}`} title={i.title}>
          <span className="chip-icon">{i.icon}</span>
          <span>{i.value}</span>
        </div>
      ))}
    </div>
  );
}