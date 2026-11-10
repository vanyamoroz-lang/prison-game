import { useEffect, useState } from 'react';
import { usePlayer } from '../store/playerStore';
import {
  EYE_STYLES,
  MOUTH_STYLES,
  NOSE_STYLES,
} from '../game/characterAssets';

type MenuTab = 'eyes' | 'mouths' | 'noses';

const TABS: { id: MenuTab; label: string }[] = [
  { id: 'eyes', label: 'Глаза' },
  { id: 'mouths', label: 'Рот' },
  { id: 'noses', label: 'Нос' },
];

type FaceMenuProps = {
  onClose: () => void;
};

export default function FaceMenu({ onClose }: FaceMenuProps) {
  const face = usePlayer((s) => s.face);
  const mouth = usePlayer((s) => s.mouth);
  const nose = usePlayer((s) => s.nose);
  const setFace = usePlayer((s) => s.setFace);
  const setMouth = usePlayer((s) => s.setMouth);
  const setNose = usePlayer((s) => s.setNose);

  const [tab, setTab] = useState<MenuTab>('eyes');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const options = tab === 'eyes' ? EYE_STYLES : tab === 'mouths' ? MOUTH_STYLES : NOSE_STYLES;
  const activeIndex =
    tab === 'eyes'
      ? (EYE_STYLES[face] ? face : 0)
      : tab === 'mouths'
        ? (MOUTH_STYLES[mouth] ? mouth : 0)
        : (NOSE_STYLES[nose] ? nose : 0);

  const select = (index: number) => {
    if (tab === 'eyes') setFace(index);
    else if (tab === 'mouths') setMouth(index);
    else setNose(index);
  };

  return (
    <div className="face-menu-backdrop" onMouseDown={onClose}>
      <div
        className="face-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Смена лица"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="face-menu-head">
          <h3>Смена лица</h3>
          <button type="button" className="face-menu-close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className="face-menu-tabs" role="tablist" aria-label="Часть лица">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`face-menu-tab${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="face-menu-grid">
          {options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              className={`face-option${activeIndex === index ? ' active' : ''}`}
              aria-pressed={activeIndex === index}
              onClick={() => select(index)}
            >
              <span className="face-option-name">{option.label}</span>
              <span className="face-option-hint">{option.hint}</span>
              {activeIndex === index && <span className="face-option-check">✓</span>}
            </button>
          ))}
        </div>

        <div className="face-menu-footer">
          <button type="button" className="face-menu-done" onClick={onClose}>
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
