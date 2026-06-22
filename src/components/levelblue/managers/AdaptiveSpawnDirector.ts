import { PlayerSessionResult, SpawnWeightTable, ThreatDomain } from '../types';

const DOMAINS: ThreatDomain[] = ['Technical', 'Physical', 'Personal'];

export function getDomainMissRates(results: PlayerSessionResult[]) {
  return DOMAINS.reduce<Record<ThreatDomain, number>>(
    (rates, domain) => {
      const domainResults = results.filter((result) => result.domain === domain);
      const misses = domainResults.filter((result) => !result.correct).length;
      rates[domain] = domainResults.length === 0 ? 0 : misses / domainResults.length;
      return rates;
    },
    { Technical: 0, Physical: 0, Personal: 0 }
  );
}

export function getAdjustedSpawnWeights(
  results: PlayerSessionResult[],
  baseline: SpawnWeightTable
): SpawnWeightTable {
  const missRates = getDomainMissRates(results);

  return DOMAINS.reduce<SpawnWeightTable>(
    (weights, domain) => {
      weights[domain] = baseline[domain] * multiplierForMissRate(missRates[domain]);
      return weights;
    },
    { Technical: baseline.Technical, Physical: baseline.Physical, Personal: baseline.Personal }
  );
}

export function multiplierForMissRate(missRate: number) {
  if (missRate > 0.6) return 2;
  if (missRate >= 0.3) return 1.5;
  return 1;
}
