import { create } from 'zustand';
import { api } from '../api';

interface PlayerState {
  name: string;
  authority: number; // сюда положим reputation
  energy: number;
  maxEnergy: number;
  coins: number;
  cigarettes: number;
  rubles: number;
  avatar: string;
  achievements: number;
  talents: number;
  face: number;
  mouth: number;
  message: string;
  location: 'cell' | 'yard' | 'zones' | 'bosses' | 'catala' | 'poker';
  isLoading: boolean;

  setFace: (n: number) => void;
  setMouth: (n: number) => void;
  setMessage: (s: string) => void;
  setLocation: (l: PlayerState['location']) => void;
  /** Применяет к стору любой ответ сервера с данными игрока/баланса. */
  applyPlayerData: (raw: unknown) => void;
  fetchPlayerData: () => Promise<void>;
}

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === 'object' ? (value as UnknownRecord) : null;

/**
 * Сервер может отдать данные игрока "плоско" или внутри
 * player / user / profile / data / balance / wallet.
 * Собираем все варианты: вложенные объекты имеют приоритет.
 */
const collectSources = (raw: unknown): UnknownRecord[] => {
  const root = asRecord(raw);
  if (!root) return [];

  const nested = ['player', 'user', 'profile', 'data', 'balance', 'wallet', 'stats']
    .map((key) => asRecord(root[key]))
    .filter((item): item is UnknownRecord => item !== null);

  // Внутри player/user тоже может быть balance/wallet/stats
  const deeper = nested
    .flatMap((item) =>
      ['balance', 'wallet', 'stats'].map((key) => asRecord(item[key]))
    )
    .filter((item): item is UnknownRecord => item !== null);

  return [...deeper, ...nested, root];
};

const pickNumber = (sources: UnknownRecord[], keys: string[]): number | undefined => {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (value === null || value === undefined || value === '') continue;
      const num = Number(value);
      if (Number.isFinite(num)) return num;
    }
  }
  return undefined;
};

const pickString = (sources: UnknownRecord[], keys: string[]): string | undefined => {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
  }
  return undefined;
};

export const usePlayer = create<PlayerState>((set, get) => ({
  // Начальные значения (фейк, пока грузится)
  name: 'Загрузка...',
  authority: 0,
  energy: 0,
  maxEnergy: 100,
  coins: 0,
  cigarettes: 0,
  rubles: 0,
  avatar: '',
  achievements: 0,
  talents: 0,
  face: 0,
  mouth: 0,
  message: 'введи базар',
  location: 'cell',
  isLoading: true,

  setFace: (face) => set({ face }),
  setMouth: (mouth) => set({ mouth }),
  setMessage: (message) => set({ message: message.slice(0, 60) }),
  setLocation: (location) => set({ location }),

  applyPlayerData: (raw) => {
    const sources = collectSources(raw);
    if (sources.length === 0) return;

    set((state) => ({
      name: pickString(sources, ['nickname', 'name', 'login', 'username']) ?? state.name,
      avatar: pickString(sources, ['avatar', 'avatar_url', 'photo']) ?? state.avatar,
      cigarettes:
        pickNumber(sources, [
          'cigarettes',
          'cigarette',
          'cigarets',
          'cigs',
          'sigarets',
          'sigarettes',
          'sigaret',
          'sigs',
          'smoke',
        ]) ?? state.cigarettes,
      energy: pickNumber(sources, ['energy', 'stamina']) ?? state.energy,
      maxEnergy: pickNumber(sources, ['max_energy', 'maxEnergy', 'energy_max']) ?? state.maxEnergy,
      authority: pickNumber(sources, ['reputation', 'authority', 'rep']) ?? state.authority,
      rubles:
        pickNumber(sources, ['rubles', 'rub', 'money', 'cash', 'balance_rubles', 'balance']) ??
        state.rubles,
      coins: pickNumber(sources, ['coins', 'coin', 'gold', 'balance_coins']) ?? state.coins,
      talents: pickNumber(sources, ['talents', 'talent']) ?? state.talents,
      achievements:
        pickNumber(sources, ['achievements', 'achievement']) ?? state.achievements,
      face: pickNumber(sources, ['face', 'face_id']) ?? state.face,
      mouth: pickNumber(sources, ['mouth', 'mouth_id']) ?? state.mouth,
    }));
  },

  // Загрузка данных с сервера. Относительный путь работает и через vite-прокси, и в проде.
  fetchPlayerData: async () => {
    try {
      const data = await api('/api/me');
      get().applyPlayerData(data);
    } catch (error) {
      console.error('Не удалось загрузить данные игрока:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
