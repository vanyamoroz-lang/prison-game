import { create } from 'zustand';

interface PlayerState {
  name: string;
  authority: number;
  energy: number;
  coins: number;      // внутренняя валюта
  cigarettes: number;
  rubles: number;
  achievements: number;
  talents: number;
  face: number;
  mouth: number;
  message: string;
  setFace: (n: number) => void;
  setMouth: (n: number) => void;
  setMessage: (s: string) => void;
  location: 'cell' | 'yard' | 'zones' | 'bosses';
  setLocation: (l: PlayerState['location']) => void;    
}

export const usePlayer = create<PlayerState>((set) => ({
  name: 'Ваня Морозов',
  authority: 1659651350,
  energy: 24,
  coins: 873437314,
  cigarettes: 535052,
  rubles: 0,
  achievements: 4527,
  talents: 27091,
  face: 0,
  mouth: 0,
  message: 'введи базар',
  setFace: (face) => set({ face }),
  setMouth: (mouth) => set({ mouth }),
  setMessage: (message) => set({ message: message.slice(0, 60) }),
  location: 'cell',
  setLocation: (location) => set({ location }),
}));
