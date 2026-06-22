import { WaveData } from './types';

export const MODULE_1_WAVE_DATA: WaveData[] = [
  {
    id: 'module1-wave1',
    title: 'Wave 1 - Scam Basics',
    durationMs: 22000,
    baselineWeights: { Technical: 1, Physical: 1, Personal: 1 },
    spawns: [
      { atMs: 1000, threatId: 'phish' },
      { atMs: 5200, domain: 'Physical' },
      { atMs: 9600, domain: 'Technical' },
      { atMs: 14000, domain: 'Personal' },
    ],
  },
  {
    id: 'module1-wave2',
    title: 'Wave 2 - Mixed Pressure',
    durationMs: 26000,
    baselineWeights: { Technical: 1, Physical: 1, Personal: 1 },
    spawns: [
      { atMs: 900, domain: 'Technical' },
      { atMs: 4600, domain: 'Physical' },
      { atMs: 8400, domain: 'Personal' },
      { atMs: 12400, domain: 'Technical' },
      { atMs: 17200, domain: 'Physical' },
    ],
  },
  {
    id: 'module1-wave3',
    title: 'Wave 3 - Final Check',
    durationMs: 30000,
    baselineWeights: { Technical: 1, Physical: 1, Personal: 1 },
    spawns: [
      { atMs: 800, domain: 'Technical' },
      { atMs: 3600, domain: 'Physical' },
      { atMs: 6900, domain: 'Personal' },
      { atMs: 10200, domain: 'Technical' },
      { atMs: 14200, domain: 'Physical' },
      { atMs: 18800, domain: 'Personal' },
    ],
  },
];
