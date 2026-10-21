import { usePlayer } from '../../store/playerStore';

export default function GameChoiceModal({ onClose }: { onClose: () => void }) {
  const setLocation = usePlayer((s) => s.setLocation);

  const goTo = (loc: 'catala' | 'poker') => {
    setLocation(loc);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="catala-choice" onClick={(e) => e.stopPropagation()}>
        <button className="catala-choice-close" onClick={onClose}>✕</button>
        <img className="catala-choice-img" src="/assets/gambling/razvesti-catalu.png" alt="Развести каталу" />
        <div className="catala-choice-buttons">
          <button className="catala-choice-btn" onClick={() => goTo('catala')}>Катала</button>
          <button className="catala-choice-btn" onClick={() => goTo('poker')}>Покер</button>
        </div>
      </div>
    </div>
  );
}
