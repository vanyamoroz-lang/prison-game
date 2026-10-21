export interface ComboReward {
  key: string;
  label: string;
  rewardType: 'rubles' | 'cigarettes' | 'key' | 'finka' | 'pal' | 'poison';
  amount: number;
}

export const CATALA_COMBOS: ComboReward[] = [
  { key: 'AA', label: 'A A', rewardType: 'rubles', amount: 10000 },
  { key: 'KK', label: 'K K', rewardType: 'rubles', amount: 7000 },
  { key: 'QQ', label: 'Q Q', rewardType: 'rubles', amount: 5000 },
  { key: 'JJ', label: 'J J', rewardType: 'key', amount: 1 },
  { key: '1010', label: '10 10', rewardType: 'poison', amount: 2000 },
  { key: '99', label: '9 9', rewardType: 'pal', amount: 2000 },
  { key: '88', label: '8 8', rewardType: 'finka', amount: 2000 },
  { key: '77', label: '7 7', rewardType: 'rubles', amount: 500 },
  { key: 'default', label: 'Без пары', rewardType: 'rubles', amount: 100 },
];