import { usePlayer } from '../store/playerStore';
import Character from './Character';
import LeftPanel from './LeftPanel';
import LocationPanel from './LocationPanel';

const BACKGROUNDS: Record<string, string | null> = {
  cell: '/assets/bg/cell.gif',
  yard: '/assets/bg/yard.png',
  zones: null,
  bosses: null,
};

export default function Scene() {
  const location = usePlayer((s) => s.location);
  const bg = BACKGROUNDS[location];

  return (
    <div className="scene">
      <div className="scene-view">
        {bg && <img className="scene-bg" src={bg} alt="" />}
        {location === 'cell' && <Character />}
        {!bg && <div className="scene-empty">Скоро здесь что-то будет</div>}
        <LeftPanel />
      </div>
      <LocationPanel />
    </div>
  );
}