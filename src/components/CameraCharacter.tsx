import { useState } from 'react';
import Character from './Character';
import FaceMenu from './FaceMenu';
import Wardrobe from './Wardrobe';

export default function CameraCharacter() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);

  return (
    <>
      <Character
        interactive
        onActivate={() => setWardrobeOpen(true)}
      />
      <button
        type="button"
        className="face-menu-trigger"
        onClick={() => setMenuOpen(true)}
      >
        🎭 Сменить лицо
      </button>
      {menuOpen && <FaceMenu onClose={() => setMenuOpen(false)} />}
      {wardrobeOpen && <Wardrobe onClose={() => setWardrobeOpen(false)} />}
    </>
  );
}
