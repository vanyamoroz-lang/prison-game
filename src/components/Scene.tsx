import { usePlayer } from '../store/playerStore';
import Character from './Character';
import LeftPanel from './LeftPanel';
import LocationPanel from './LocationPanel';
import ZonesPage from './ZonesPage';
import BossesPage from './BossesPage';
import YardScene from './YardScene';
import CatalaPage from "./gambling/CatalaPage";
import PokerPage from "./gambling/PokerPage";

const BACKGROUNDS: Record<string, string | null> = {
  cell: '/assets/bg/cell.gif',
  yard: '/assets/bg/yard.png',
  zones: null,
  bosses: null,
  poker: null,
};

export default function Scene() {
  const location = usePlayer((s) => s.location);
  const setLocation = usePlayer((s) => s.setLocation);
  const bg = BACKGROUNDS[location];
  const showLeftPanel = location === 'cell';

  return (
    <div className="scene">
      <div className="scene-view">      
        {location === 'cell' && <Character />}
        {location === 'yard' && bg && <img key="yard" className="scene-bg" src={bg} alt="" />}
        {location === 'yard' && <YardScene />}
        {location === 'catala' && <CatalaPage />}
        {location === 'poker' && <PokerPage onExit={() => setLocation('cell')} />}
        {location === 'zones' && <ZonesPage />}
        {location === 'bosses' && <BossesPage />}
        {showLeftPanel && <LeftPanel />}
      </div>
      <LocationPanel />
    </div>
  );
}