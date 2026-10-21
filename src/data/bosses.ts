export interface BossReward {
  cigarettes: number;
  rubles: number;
  finka: number;
  pal: number;
  poison: number;
  keys: number;
  limitCurrent: number;
  limitMax: number;
}

export interface ComboSolver {
  name: string;
  avatar: string;
}

export interface Boss {
  id: string;
  name: string;
  image: string;
  reward: BossReward;
  combos: {
    common: ComboSolver | null;  // серая рамка — пацанское
    rare: ComboSolver | null;    // золотая — блатное
    epic: ComboSolver | null;    // красная — авторитетное
  };
  wins: number;
  comboStats: {
    common: number;
    rare: number;
    epic: number;
  };
}

const placeholderBoss = '/assets/placeholder-boss.png';
const placeholderAvatar = '/assets/placeholder-avatar.png';

function makeBoss(name: string, i: number): Boss {
  return {
    id: name.toLowerCase(),
    name,
    image: placeholderBoss,
    reward: {
      cigarettes: 100 + i * 50,
      rubles: 1000 + i * 500,
      finka: 15 + i,
      pal: 15 + i,
      poison: 15 + i,
      keys: 1,
      limitCurrent: 21,
      limitMax: 21,
    },
    combos: {
      common: { name: 'Игрок 1', avatar: placeholderAvatar },
      rare: { name: 'Игрок 2', avatar: placeholderAvatar },
      epic: { name: 'Игрок 3', avatar: placeholderAvatar },
    },
    wins: 13190 - i * 100,
    comboStats: {
      common: 7490 - i * 10,
      rare: 380 - i,
      epic: 353 - i,
    },
  };
}

export const COMMON_BOSSES: Boss[] = [
  'Атаман', 'Нинка', 'Инга', 'Знахарь', 'Мажор', 'Полковник',
  'Братки', 'Штурман', 'Люська', 'Головорез', 'Бык', 'Коба',
  'Снайпер', 'Михалыч', 'Приезжий', 'Кинолог', 'Амбал', 'Туристы',
  'Крутой', 'Ровный',
].map(makeBoss);

export const SOLO_BOSSES: Boss[] = ['Батан', 'Косой', 'Рекичан', 'Лектор'].map(makeBoss);

export const SECRET_BOSSES: Boss[] = ['Кирпич', 'Сизый', 'Лютый'].map(makeBoss);