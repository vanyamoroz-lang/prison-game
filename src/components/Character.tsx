import { usePlayer } from '../store/playerStore';
import SpeechBubble from './SpeechBubble';

export default function Character() {
  const { face, mouth } = usePlayer();
  return (
    <div className="character">
      <img className="layer body" src="/assets/person/personfullbody2.png" alt="" />
      <img className="layer face" src={`/assets/faces/${face}.png`} alt=""
           onError={(e) => (e.currentTarget.style.display = 'none')} />
      <img className="layer mouth" src={`/assets/mouths/${mouth}.png`} alt=""
           onError={(e) => (e.currentTarget.style.display = 'none')} />
      <SpeechBubble />
    </div>
  );
}