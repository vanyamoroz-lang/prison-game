export interface ZoneHolder {
  name: string;
  avatar: string; // url
  authority: number;
}

export interface Zone {
  id: string;
  name: string;
  image: string;
  holder: ZoneHolder;
  mostWanted: ZoneHolder;
}

const placeholderAvatar = '/assets/placeholder-avatar.png';
const placeholderZone = '/assets/placeholder-zone.png';

const names = [
  'Бутырка', 'К. Пресня', 'Софийка', 'Кресты', 'В. Централ',
  'Угольки', 'М. Тишина', 'В. Пятак', 'Лефортовка', 'Б. Лебедь',
  'Дальняя', 'О. Централ', 'Е. Крытка', 'Ч. Дельфин', 'Г. Крытка',
];

export const ZONES: Zone[] = names.map((name, i) => ({
  id: `zone-${i}`,
  name,
  image: placeholderZone,
  holder: {
    name: 'кто то',
    avatar: placeholderAvatar,
    authority: 1392590 - i * 1000,
  },
  mostWanted: {
    name: 'кто то',
    avatar: placeholderAvatar,
    authority: 563680 - i * 800,
  },
}));