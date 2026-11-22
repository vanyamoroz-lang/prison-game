import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { usePlayer } from '../store/playerStore';
import {
  CHARACTER_BODY_SRC,
  EYE_FRAME,
  EYE_STYLES,
  HAND,
  MOUTH_FRAME,
  MOUTH_STYLES,
  NOSE_FRAME,
  NOSE_STYLES,
} from '../game/characterAssets';
import type { HandKind } from '../game/characterAssets';
import { useBlinker } from '../hooks/useBlinker';
import { useCharacterLayout } from '../hooks/useCharacterLayout';
import { useSpriteAnimation } from '../hooks/useSpriteAnimation';
import { SpriteSheet } from './SpriteSheet';
import SpeechBubble from './SpeechBubble';
import '../styles/character.css';

const HIT_MASK_W = 344;
const HIT_MASK_H = 192;

type CharacterProps = {
  /** Used by the wardrobe: preview a hand without changing the store. */
  handOverride?: HandKind;
  /** Fixed scale for the wardrobe preview (the whole stage is cropped by the host). */
  previewScale?: number;
  /** Enables the white hover outline and the click-to-open action. */
  interactive?: boolean;
  onActivate?: () => void;
};

export default function Character({
  handOverride,
  previewScale,
  interactive = false,
  onActivate,
}: CharacterProps) {
  const face = usePlayer((s) => s.face);
  const mouth = usePlayer((s) => s.mouth);
  const nose = usePlayer((s) => s.nose);
  const storedHand = usePlayer((s) => s.hand);

  const eyes = EYE_STYLES[face] ?? EYE_STYLES[0];
  const mouthStyle = MOUTH_STYLES[mouth] ?? MOUTH_STYLES[0];
  const noseStyle = NOSE_STYLES[nose] ?? NOSE_STYLES[0];

  const handKind: HandKind =
    handOverride ?? (storedHand === 1 ? 'coin' : 'sway');
  const handStyle = HAND[handKind];

  const { hostRef, scale, offsetTop } = useCharacterLayout();
  const canvasRef = useRef<HTMLDivElement>(null);
  const hitCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [hovered, setHovered] = useState(false);

  const { frame: blinkFrame } = useBlinker(eyes);
  const eyeRows = Math.ceil(eyes.frames / eyes.columns);

  const glanceFrame = useSpriteAnimation({
    frameCount: eyes.frames,
    fps: 1,
    loop: true,
    playing: eyes.motion === 'glance',
    durations: eyes.glanceDurations,
  });
  const eyeFrame = eyes.motion === 'glance' ? glanceFrame : blinkFrame;

  const swayFrame = useSpriteAnimation({
    frameCount: HAND.sway.frames,
    fps: HAND.sway.fps,
    loop: true,
    playing: handKind === 'sway',
  });

  const coinFrame = useSpriteAnimation({
    frameCount: HAND.coin.frames,
    fps: HAND.coin.fps,
    loop: true,
    playing: handKind === 'coin',
    resetKey: handKind,
  });

  const handFrame = handKind === 'coin' ? coinFrame : swayFrame;
  const stageScale = previewScale ?? scale;

  useEffect(() => {
    if (!interactive) return;

    const canvas = document.createElement('canvas');
    canvas.width = HIT_MASK_W;
    canvas.height = HIT_MASK_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const image = new Image();
    image.src = CHARACTER_BODY_SRC;
    image.onload = () => {
      ctx.clearRect(0, 0, HIT_MASK_W, HIT_MASK_H);
      ctx.drawImage(image, 0, 0, HIT_MASK_W, HIT_MASK_H);
      hitCtxRef.current = ctx;
    };
  }, [interactive]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const ctx = hitCtxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = Math.min(
      HIT_MASK_W - 1,
      Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * HIT_MASK_W)),
    );
    const y = Math.min(
      HIT_MASK_H - 1,
      Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * HIT_MASK_H)),
    );
    setHovered(ctx.getImageData(x, y, 1, 1).data[3] > 24);
  }, []);

  const handlePointerLeave = useCallback(() => setHovered(false), []);

  const handleClick = useCallback(() => {
    if (!interactive || !hovered) return;
    onActivate?.();
  }, [interactive, hovered, onActivate]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!interactive) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onActivate?.();
      }
    },
    [interactive, onActivate]
  );

  const bubbleTop = Math.max(0, offsetTop - 10);

  return (
    <div
      className={[
        'character',
        previewScale ? 'character--preview' : '',
        interactive ? 'character--interactive' : '',
        hovered ? 'character--hovered' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={hostRef}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? 'Открыть гардероб' : undefined}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      onFocus={interactive ? () => setHovered(true) : undefined}
      onBlur={interactive ? () => setHovered(false) : undefined}
    >
      <div
        className="character-canvas"
        ref={canvasRef}
        style={{ transform: `scale(${stageScale})` }}
      >
        <div className={`character-figure${hovered ? ' is-highlighted' : ''}`}>
          <img
            className="character-body"
            src={CHARACTER_BODY_SRC}
            width={1376}
            height={768}
            alt=""
            draggable={false}
          />

          <SpriteSheet
            className="character-hand"
            src={handStyle.src}
            frameWidth={handStyle.frame.width}
            frameHeight={handStyle.frame.height}
            frame={handFrame}
            columns={handStyle.columns}
            rows={handStyle.rows}
            label={`Кисть: ${handStyle.label}`}
            style={{ left: handStyle.frame.x, top: handStyle.frame.y }}
          />

          <img
            className="face-layer character-mouth"
            src={mouthStyle.src}
            width={MOUTH_FRAME.width}
            height={MOUTH_FRAME.height}
            alt=""
            draggable={false}
            style={{ left: MOUTH_FRAME.x, top: MOUTH_FRAME.y }}
          />

          <SpriteSheet
            className="face-layer character-eyes"
            src={eyes.src}
            frameWidth={EYE_FRAME.width}
            frameHeight={EYE_FRAME.height}
            frame={eyeFrame}
            columns={eyes.columns}
            rows={eyeRows}
            label={`Глаза: ${eyes.label}`}
            style={{ left: EYE_FRAME.x, top: EYE_FRAME.y }}
          />

          <img
            className="face-layer character-nose"
            src={noseStyle.src}
            width={NOSE_FRAME.width}
            height={NOSE_FRAME.height}
            alt=""
            draggable={false}
            style={{ left: NOSE_FRAME.x, top: NOSE_FRAME.y }}
          />
        </div>
      </div>

      {!previewScale && <SpeechBubble topOffset={bubbleTop} />}
    </div>
  );
}
