import { usePlayer } from '../store/playerStore';

const LOCATIONS = [
  { id: 'cell',   icon: '🛏️', title: 'Камера' },
  { id: 'zones',  icon: '🗺️', title: 'Зоны' },
  { id: 'yard',   icon: '🏢', title: 'Двор' },
  { id: 'bosses', icon: '👹', title: 'Боссы' },
] as const;

export default function LocationPanel() {
  const location = usePlayer((s) => s.location);
  const setLocation = usePlayer((s) => s.setLocation);

  return (
    <aside className="location-panel">
      <div className="loc-list">
        {LOCATIONS.map((l) => (
          <button
            key={l.id}
            className={`loc-btn ${location === l.id ? 'active' : ''}`}
            onClick={() => setLocation(l.id)}
          >
            <span className="loc-icon">{l.icon}</span>
            <span>{l.title}</span>
          </button>
        ))}
      </div>
      <div className="loc-reserved">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="slot" />
        ))}
      </div>
    </aside>
  );
}