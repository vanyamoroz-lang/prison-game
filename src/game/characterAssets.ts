/**
 * Character sprite kit for the 1376×768 stage.
 * Values in playerStore (`face`, `mouth`, `nose`) are indexes into these arrays.
 */
const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

export type EyeMotion = 'blink' | 'glance';

export type EyeStyleConfig = {
  id: string;
  label: string;
  hint: string;
  src: string;
  frames: number;
  columns: number;
  motion: EyeMotion;
  blinkSequence: number[];
  blinkDurations: number[];
  blinkDelay: [number, number];
  glanceDurations?: number[];
};

export type StaticFaceStyle = {
  id: string;
  label: string;
  hint: string;
  src: string;
};

const blinkEye = (
  id: string,
  label: string,
  hint: string,
  file: string,
  blinkDurations: number[],
  blinkDelay: [number, number],
): EyeStyleConfig => ({
  id,
  label,
  hint,
  src: asset(`assets/character/faces/eyes/${file}.png`),
  frames: 4,
  columns: 4,
  motion: 'blink',
  blinkSequence: [1, 2, 3, 0],
  blinkDurations,
  blinkDelay,
});

export const CHARACTER_BODY_SRC = asset('assets/character/body.png');

export const EYE_FRAME = { width: 128, height: 80, x: 668, y: 76 } as const;
export const MOUTH_FRAME = { width: 112, height: 64, x: 672, y: 138 } as const;
export const NOSE_FRAME = { width: 96, height: 96, x: 680, y: 80 } as const;

export const EYE_STYLES: EyeStyleConfig[] = [
  blinkEye('classic', 'Классика', 'Спокойный взгляд · моргает', 'classic', [45, 80, 45, 25], [2400, 5200]),
  blinkEye('angry', 'Злость', 'Прищур · моргает', 'angry', [45, 80, 45, 25], [2400, 5200]),
  blinkEye('excited', 'Восторг', 'Широко раскрытые глаза · моргает', 'excited', [45, 80, 45, 25], [2400, 5200]),
  blinkEye('scar', 'Шрам', 'Моргает правым глазом', 'scar', [45, 90, 55, 35], [2500, 5000]),
  {
    id: 'sly',
    label: 'Хитрость',
    hint: 'Переглядывается',
    src: asset('assets/character/faces/eyes/sly.png'),
    frames: 2,
    columns: 2,
    motion: 'glance',
    blinkSequence: [],
    blinkDurations: [],
    blinkDelay: [0, 0],
    glanceDurations: [1400, 900],
  },
  blinkEye('sly2', 'Полуприщур', 'Тяжёлые веки · моргает', 'sly2', [45, 80, 45, 25], [2400, 5200]),
  blinkEye('tired', 'Усталость', 'Мешки под глазами · медленное моргание', 'tired', [110, 190, 140, 90], [5000, 9000]),
];

export const MOUTH_STYLES: StaticFaceStyle[] = [
  { id: 'classic', label: 'Нейтральный', hint: 'Сдержанная гримаса', src: asset('assets/character/faces/mouths/classic.png') },
  { id: 'smile', label: 'Улыбка', hint: 'Уголки вверх', src: asset('assets/character/faces/mouths/smile.png') },
  { id: 'evilsmile', label: 'Злая улыбка', hint: 'Хищный оскал', src: asset('assets/character/faces/mouths/evilsmile.png') },
];

export const NOSE_STYLES: StaticFaceStyle[] = [
  { id: 'classic', label: 'Классический', hint: 'Исходная форма', src: asset('assets/character/faces/noses/classic.png') },
  { id: 'broad', label: 'Широкий', hint: 'Массивная переносица', src: asset('assets/character/faces/noses/broad.png') },
  { id: 'pointed', label: 'Острый', hint: 'Удлинённый профиль', src: asset('assets/character/faces/noses/pointed.png') },
  { id: 'button', label: 'Короткий', hint: 'Аккуратный, курносый', src: asset('assets/character/faces/noses/button.png') },
  { id: 'broken', label: 'Сломанный', hint: 'Сросшийся перелом', src: asset('assets/character/faces/noses/broken.png') },
];

export const HAND = {
  frame: { width: 160, height: 208, x: 696, y: 392 },
  sway: {
    src: asset('assets/character/hand/sway.png'),
    frames: 12,
    columns: 12,
    fps: 12,
  },
} as const;
