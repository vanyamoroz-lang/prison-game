export interface BossFightReward {
  cigarettes?: number;
  reputation?: number;
  keys_drop?: Record<string, number>;
}

export interface BossWeaponInventory {
  knife: number;
  poison: number;
  pistol: number;
}

export interface BossFightState {
  bossId: number;
  currentHp: number;
  maxHp: number;
  endTime: number;
  serverTime: number;
  inventory?: BossWeaponInventory;
}

export interface ActiveBossFight extends BossFightState {
  name: string;
  img_boss: string;
}

export interface ServerBoss {
  id: string | number;
  name: string;
  img_boss: string;
  reward?: BossFightReward;
}
