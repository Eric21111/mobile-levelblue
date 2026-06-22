import { THREATS } from '../data';
import { MODULE_1_WAVE_DATA } from '../waveData';
import { getAdjustedSpawnWeights } from './AdaptiveSpawnDirector';
import { PlayerSessionResult, SpawnWeightTable, Threat, WaveData } from '../types';

export type MatchPhase = 'Wave' | 'PostWave' | 'Results';

export type WaveManagerState = {
  phase: MatchPhase;
  waveIndex: number;
  elapsedMs: number;
  postWaveElapsedMs: number;
  spawnCursor: number;
  activeWeights: SpawnWeightTable;
  postWaveMessage: string;
};

export type WaveAdvanceResult = {
  state: WaveManagerState;
  spawns: Threat[];
};

const POST_WAVE_MS = 2600;

export function createWaveManager(): WaveManagerState {
  const firstWave = MODULE_1_WAVE_DATA[0];

  return {
    phase: 'Wave',
    waveIndex: 0,
    elapsedMs: 0,
    postWaveElapsedMs: 0,
    spawnCursor: 0,
    activeWeights: firstWave.baselineWeights,
    postWaveMessage: firstWave.title,
  };
}

export function currentWave(state: WaveManagerState): WaveData | null {
  return MODULE_1_WAVE_DATA[state.waveIndex] ?? null;
}

export function advanceWaveManager(
  state: WaveManagerState,
  deltaMs: number,
  activeThreatCount: number,
  sessionResults: PlayerSessionResult[]
): WaveAdvanceResult {
  const wave = currentWave(state);
  if (!wave) {
    return { state: { ...state, phase: 'Results' }, spawns: [] };
  }

  if (state.phase === 'PostWave') {
    const postWaveElapsedMs = state.postWaveElapsedMs + deltaMs;
    if (postWaveElapsedMs < POST_WAVE_MS) {
      return { state: { ...state, postWaveElapsedMs }, spawns: [] };
    }

    const nextIndex = state.waveIndex + 1;
    const nextWave = MODULE_1_WAVE_DATA[nextIndex];

    if (!nextWave) {
      return { state: { ...state, phase: 'Results' }, spawns: [] };
    }

    const activeWeights = getAdjustedSpawnWeights(sessionResults, nextWave.baselineWeights);

    return {
      state: {
        phase: 'Wave',
        waveIndex: nextIndex,
        elapsedMs: 0,
        postWaveElapsedMs: 0,
        spawnCursor: 0,
        activeWeights,
        postWaveMessage: describeWeights(activeWeights),
      },
      spawns: [],
    };
  }

  if (state.phase === 'Results') {
    return { state, spawns: [] };
  }

  const elapsedMs = state.elapsedMs + deltaMs;
  const dueSpawns = wave.spawns
    .slice(state.spawnCursor)
    .filter((spawn) => spawn.atMs <= elapsedMs);
  const spawnCursor = state.spawnCursor + dueSpawns.length;
  const spawns = dueSpawns.map((spawn) => selectThreat(spawn.threatId, spawn.domain, state.activeWeights));
  const waveComplete =
    elapsedMs >= wave.durationMs && spawnCursor >= wave.spawns.length && activeThreatCount === 0;

  if (waveComplete) {
    const nextIndex = state.waveIndex + 1;
    const nextWave = MODULE_1_WAVE_DATA[nextIndex];
    const nextWeights = nextWave
      ? getAdjustedSpawnWeights(sessionResults, nextWave.baselineWeights)
      : state.activeWeights;

    return {
      state: {
        ...state,
        phase: nextWave ? 'PostWave' : 'Results',
        elapsedMs,
        postWaveElapsedMs: 0,
        spawnCursor,
        activeWeights: nextWeights,
        postWaveMessage: nextWave ? describeWeights(nextWeights) : 'Module 1 complete',
      },
      spawns,
    };
  }

  return {
    state: { ...state, elapsedMs, spawnCursor },
    spawns,
  };
}

export function waveCount() {
  return MODULE_1_WAVE_DATA.length;
}

function selectThreat(threatId: string | undefined, domain: Threat['domain'] | undefined, weights: SpawnWeightTable) {
  if (threatId) {
    return THREATS.find((threat) => threat.id === threatId) ?? THREATS[0];
  }

  const selectedDomain = domain ?? weightedDomain(weights);
  const pool = THREATS.filter((threat) => threat.domain === selectedDomain);
  return pool[Math.floor(Math.random() * pool.length)] ?? THREATS[0];
}

function weightedDomain(weights: SpawnWeightTable) {
  const entries = Object.entries(weights) as [Threat['domain'], number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;

  for (const [domain, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return domain;
  }

  return 'Technical';
}

function describeWeights(weights: SpawnWeightTable) {
  return `Adaptive weights - Tech x${weights.Technical}, Physical x${weights.Physical}, Personal x${weights.Personal}`;
}
