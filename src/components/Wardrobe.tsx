import { useEffect, useState } from 'react';
import { usePlayer } from '../store/playerStore';
import { HAND_UI } from '../game/characterAssets';
import type { HandKind } from '../game/characterAssets';
import Character from './Character';
import '../styles/wardrobe.css';

const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

const CAMERA_BG = asset('assets/bg/camera.png');

type WardrobeProps = {
  onClose: () => void;
};

type Part = 'hand' | null;

const DISABLED_PARTS = [
  { id: 'head', label: 'Голова', hint: 'Причёска и головные уборы' },
  { id: 'torso', label: 'Торс', hint: 'Одежда и татуировки' },
  { id: 'legs', label: 'Ноги', hint: 'Штаны и обувь' },
];

export default function Wardrobe({ onClose }: WardrobeProps) {
  const hand = usePlayer((s) => s.hand);
  const setHand = usePlayer((s) => s.setHand);

  const [pending, setPending] = useState<HandKind>(hand === 1 ? 'coin' : 'sway');
  const [part, setPart] = useState<Part>(null);
  const [previewScale, setPreviewScale] = useState(0.6);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setPreviewScale(width < 520 ? 0.32 : width < 900 ? 0.45 : 0.6);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  const save = () => {
    setHand(pending === 'coin' ? 1 : 0);
    onClose();
  };

  return (
    <div className="wardrobe-backdrop" onMouseDown={onClose}>
      <div
        className="wardrobe"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wardrobe-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <section
          className="wardrobe-room"
          style={{ backgroundImage: `url(${CAMERA_BG})` }}
          aria-label="Примерка"
        >
          <div className="wardrobe-room-shade" aria-hidden="true" />
          <Character previewScale={previewScale} handOverride={pending} />

          <button
            type="button"
            className="wardrobe-outfit"
            aria-label="Сменить одежду"
            onClick={() => setPart(null)}
          >
            <img src={HAND_UI.outfit} alt="" draggable={false} />
            <span className="wardrobe-tooltip" role="tooltip">
              Сменить одежду
            </span>
          </button>

          <div className="wardrobe-room-caption">
            <span>В камере</span>
            <span>
              Кисть: {pending === 'coin' ? 'с монетой' : 'стандартная'}
            </span>
          </div>

          <div className="wardrobe-actions">
            <button
              type="button"
              className="wardrobe-round wardrobe-round--cancel"
              aria-label="Отменить изменения"
              title="Отменить"
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <button
              type="button"
              className="wardrobe-round wardrobe-round--save"
              aria-label="Сохранить изменения"
              title="Сохранить"
              onClick={save}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
            </button>
          </div>
        </section>

        <aside className="wardrobe-panel">
          <div className="wardrobe-panel-head">
            <p className="wardrobe-kicker">ГАРДЕРОБ</p>
            <h2 id="wardrobe-title">Выберите часть тела</h2>
            <p>
              {part === 'hand'
                ? 'Что персонаж держит в руке. Изменение сразу видно на примерке.'
                : 'Нажми на часть тела, чтобы посмотреть доступные предметы.'}
            </p>
          </div>

          {part === null ? (
            <div className="wardrobe-parts">
              <button
                type="button"
                className="wardrobe-part wardrobe-part--active"
                onClick={() => setPart('hand')}
              >
                <span className="wardrobe-part-art">
                  <img src={HAND_UI.standard} alt="" draggable={false} />
                </span>
                <span className="wardrobe-part-copy">
                  <strong>Кисть</strong>
                  <small>Предметы в руку</small>
                </span>
              </button>

              {DISABLED_PARTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="wardrobe-part"
                  disabled
                  title="Пока недоступно"
                >
                  <span
                    className={`wardrobe-part-art wardrobe-part-art--${item.id}`}
                    aria-hidden="true"
                  >
                    <span />
                  </span>
                  <span className="wardrobe-part-copy">
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <span className="wardrobe-part-soon">скоро</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="wardrobe-items">
              <button
                type="button"
                className="wardrobe-back"
                onClick={() => setPart(null)}
              >
                <span aria-hidden="true">←</span> Все части тела
              </button>

              <div className="wardrobe-item-grid">
                <article
                  className={`wardrobe-item${pending === 'sway' ? ' is-active' : ''}`}
                >
                  <div className="wardrobe-item-art">
                    <img src={HAND_UI.standard} alt="" draggable={false} />
                  </div>
                  <div className="wardrobe-item-copy">
                    <h3>Стандартная рука</h3>
                    <p>Без предмета</p>
                  </div>
                  <button
                    type="button"
                    className="wardrobe-equip"
                    onClick={() => setPending('sway')}
                  >
                    Снять всё
                  </button>
                  {pending === 'sway' && (
                    <span className="wardrobe-badge">Сейчас</span>
                  )}
                </article>

                <article
                  className={`wardrobe-item${pending === 'coin' ? ' is-active' : ''}`}
                >
                  <div className="wardrobe-item-art wardrobe-item-art--coin">
                    <img src={HAND_UI.coin} alt="" draggable={false} />
                  </div>
                  <div className="wardrobe-item-copy">
                    <h3>Монетка</h3>
                    <p>Золотая монета в руке</p>
                  </div>
                  <button
                    type="button"
                    className="wardrobe-equip"
                    onClick={() => setPending('coin')}
                  >
                    Надеть
                  </button>
                  {pending === 'coin' && (
                    <span className="wardrobe-badge">Сейчас</span>
                  )}
                </article>
              </div>

              <p className="wardrobe-hint">
                Примерка мгновенная. Зелёная галочка сохранит образ, красный
                крестик вернёт всё как было.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
