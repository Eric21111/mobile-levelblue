export type Screen = 'login' | 'dashboard' | 'game' | 'bestiary' | 'results';

export type Student = {
  email: string;
  password: string;
  name: string;
  className: string;
  avatar: string;
  rankTitle: string;
  rankPoints: number;
  wins: number;
  gamesPlayed: number;
  streak: number;
};

export type Unit = {
  id: string;
  name: string;
  cost: number;
  shield: number;
  icon: string;
  color: string;
  description: string;
};

export type Threat = {
  id: string;
  name: string;
  domain: 'Technical' | 'Physical' | 'Personal';
  hp: number;
  damage: number;
  color: string;
  icon: string;
  fact: string;
};

export type QuizOption = {
  text: string;
  correct: boolean;
};

export type Quiz = {
  id: string;
  threatId: string;
  prompt: string;
  options: QuizOption[];
};

export type MatchResult = {
  won: boolean;
  coins: number;
  correct: number;
  attempts: number;
  baseHp: number;
  rankGain: number;
};

export type ThreatDomain = Threat['domain'];

export type PlayerSessionResult = {
  waveId: string;
  threatId: string;
  domain: ThreatDomain;
  correct: boolean;
};

export type SpawnWeightTable = Record<ThreatDomain, number>;

export type WaveSpawn = {
  atMs: number;
  threatId?: string;
  domain?: ThreatDomain;
};

export type WaveData = {
  id: string;
  title: string;
  durationMs: number;
  baselineWeights: SpawnWeightTable;
  spawns: WaveSpawn[];
};

export type BaseState = {
  serverTier: number;
  officeTier: number;
  homeTier: number;
  hp: number;
  maxHp: number;
  shield: number;
};
