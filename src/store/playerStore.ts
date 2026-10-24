import { create } from 'zustand';

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
  fetchPlayerData: () => Promise<void>; // Новая функция для загрузки
}

export const usePlayer = create<PlayerState>((set) => ({
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

  // ФУНКЦИЯ ЗАГРУЗКИ С СЕРВЕРА
  fetchPlayerData: async () => {
    try {
      const response = await fetch('http://localhost:5173/api/me', {
        method: 'GET',
        credentials: 'include', // Важно для куки (сессии)
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки данных игрока');
      }

      const data = await response.json();

      // Обновляем стор полученными данными
      set({
        name: data.nickname || 'Безымянный',
        avatar: data.avatar || '',
        cigarettes: data.cigarettes || 0,
        energy: data.energy || 0,
        maxEnergy: data.max_energy || 100,
        authority: data.reputation || 0, // reputation с сервера -> authority в сторе
        isLoading: false,
      });
    } catch (error) {
      console.error('Ошибка:', error);
      set({ isLoading: false });
    }
  },
}));