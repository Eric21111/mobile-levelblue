import { BaseState } from '../types';

export const BASE_UPGRADE_COSTS = {
  server: 100,
  office: 120,
  home: 140,
} as const;

export type BaseUpgradeKey = keyof typeof BASE_UPGRADE_COSTS;

export function createBaseState(): BaseState {
  return {
    serverTier: 1,
    officeTier: 1,
    homeTier: 1,
    hp: 100,
    maxHp: 100,
    shield: 0,
  };
}

export function takeDamage(base: BaseState, damage: number): BaseState {
  const blocked = Math.min(base.shield, damage);
  const hpDamage = damage - blocked;

  return {
    ...base,
    shield: base.shield - blocked,
    hp: Math.max(0, base.hp - hpDamage),
  };
}

export function addShield(base: BaseState, amount: number): BaseState {
  return {
    ...base,
    shield: base.shield + amount,
  };
}

export function upgradeServer(base: BaseState): BaseState {
  return {
    ...base,
    serverTier: Math.min(3, base.serverTier + 1),
  };
}

export function upgradeOffice(base: BaseState): BaseState {
  return {
    ...base,
    officeTier: Math.min(3, base.officeTier + 1),
    shield: base.shield + 18,
  };
}

export function upgradeHome(base: BaseState): BaseState {
  const nextTier = Math.min(3, base.homeTier + 1);
  const nextMaxHp = 100 + (nextTier - 1) * 40;

  return {
    ...base,
    homeTier: nextTier,
    maxHp: nextMaxHp,
    hp: Math.min(nextMaxHp, base.hp + 30),
    shield: base.shield + 20,
  };
}

export function passiveIncomeFor(base: BaseState) {
  return 5 + (base.serverTier - 1) * 5;
}
