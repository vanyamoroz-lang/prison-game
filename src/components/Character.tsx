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
import { useBlinker } from '../hooks/useBlinker';
import { useCharacterLayout } from '../hooks/useCharacterLayout';
import { useSpriteAnimation } from '../hooks/useSpriteAnimation';
import { SpriteSheet } from './SpriteSheet';
import SpeechBubble from './SpeechBubble';
import '../styles/character.css';

export default function Character() {
  const face = usePlayer((s) => s.face);
  const mouth = usePlayer((s) => s.mouth);
  const nose = usePlayer((s) => s.nose);

  const eyes = EYE_STYLES[face] ?? EYE_STYLES[0];
  const mouthStyle = MOUTH_STYLES[mouth] ?? MOUTH_STYLES[0];
  const noseStyle = NOSE_STYLES[nose] ?? NOSE_STYLES[0];

  const { hostRef, scale, offsetTop } = useCharacterLayout();
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
  });

  const bubbleTop = Math.max(0, offsetTop - 10);

  return (
    <div className="character" ref={hostRef}>
      <div className="character-canvas" style={{ transform: `scale(${scale})` }}>
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
          src={HAND.sway.src}
          frameWidth={HAND.frame.width}
          frameHeight={HAND.frame.height}
          frame={swayFrame}
          columns={HAND.sway.columns}
          rows={1}
          label="Покачивание кисти"
          style={{ left: HAND.frame.x, top: HAND.frame.y }}
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

      <SpeechBubble topOffset={bubbleTop} />
    </div>
  );
}
