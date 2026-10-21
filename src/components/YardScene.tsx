import { useState } from 'react';
import GameChoiceModal from './gambling/GameChoiceModal';

export default function YardScene() {
  const [showChoice, setShowChoice] = useState(false);

  return (
    <>
      <img className="scene-bg" src="/assets/bg/yard.png" alt="" />
      {/* невидимая кликабельная зона поверх NPC на картинке двора */}
      <button
        className="npc-catala-hotspot"
        onClick={() => setShowChoice(true)}
        aria-label="Катала"
      />
      <img className="npc-icon-cards" src="/assets/icons/dvorKatala.png" alt="" onClick={() => setShowChoice(true)} />
      {showChoice && <GameChoiceModal onClose={() => setShowChoice(false)} />}
    </>
  );
}