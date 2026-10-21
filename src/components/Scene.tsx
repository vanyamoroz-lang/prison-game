import { usePlayer } from '../store/playerStore';
import Character from './Character';
import LeftPanel from './LeftPanel';
import LocationPanel from './LocationPanel';
import ZonesPage from './ZonesPage';
import BossesPage from './BossesPage';
import YardScene from './YardScene';

const BACKGROUNDS: Record<string, string | null> = {
  cell: '/assets/bg/cell.gif',
  yard: '/assets/bg/yard.png',
  zones: null,
  bosses: null,
};

export default function Scene() {
  const location = usePlayer((s) => s.location);
  const bg = BACKGROUNDS[location];
  // показываем LeftPanel только там, где есть персонаж/двор
  const showLeftPanel = location === 'cell';
  return (
    <div className="scene">
      <div className="scene-view">      
        {location === 'cell' && <Character />}
        {location === 'yard' && bg && <img key="yard" className="scene-bg" src={bg} alt="" />}
        {location === 'zones' && <ZonesPage />}
        {location === 'bosses' && <BossesPage />}
        {location === 'yard' && <YardScene />}
        {showLeftPanel && <LeftPanel />}
      </div>
      <LocationPanel />
    </div>
  );
}