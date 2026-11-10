import { useState } from 'react';
import Character from './Character';
import FaceMenu from './FaceMenu';

export default function CameraCharacter() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Character />
      <button
        type="button"
        className="face-menu-trigger"
        onClick={() => setMenuOpen(true)}
      >
        🎭 Сменить лицо
      </button>
      {menuOpen && <FaceMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}
