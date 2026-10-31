import { usePlayer } from '../store/playerStore';
import Character from './Character';
import LeftPanel from './LeftPanel';
import LocationPanel from './LocationPanel';
import ZonesPage from './ZonesPage';
import BossesPage from './BossesPage';
import YardScene from './YardScene';
import CatalaPage from "./gambling/CatalaPage";
import PokerPage from "./gambling/PokerPage";
import CollectionPage from "./npc/CollectionPage";

const BACKGROUNDS: Record<string, string | null> = {
  camera: '/assets/bg/camera.png',
  yard: '/assets/bg/yard.png',
  zones: null,
  bosses: null,
  poker: null,
  collection: null,
};

export default function Scene() {
  const location = usePlayer((s) => s.location);
  const setLocation = usePlayer((s) => s.setLocation);
  const bg = BACKGROUNDS[location] ?? null;
  const showLeftPanel = location === 'camera';

  return (
    <div className="scene">
      <div className="scene-view">
        {bg && <img key={location} className="scene-bg" src={bg} alt="" />}      
        {location === 'camera' && <Character />}
        {location === 'yard' && <YardScene />}
        {location === 'catala' && <CatalaPage />}
        {location === 'poker' && <PokerPage onExit={() => setLocation('camera')} />}
        {location === 'collection' && <CollectionPage onExit={() => setLocation('yard')} />}
        {location === 'zones' && <ZonesPage />}
        {location === 'bosses' && <BossesPage />}
        {showLeftPanel && <LeftPanel />}
      </div>
      <LocationPanel />
    </div>
  );
}