import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QUIZZES, UNITS } from './data';
import {
  addShield,
  BASE_UPGRADE_COSTS,
  createBaseState,
  passiveIncomeFor,
  takeDamage,
  upgradeHome,
  upgradeOffice,
  upgradeServer,
} from './managers/BaseManager';
import {
  advanceWaveManager,
  createWaveManager,
  currentWave,
  waveCount,
} from './managers/WaveManager';
import { BaseState, MatchResult, PlayerSessionResult, Quiz, Threat, Unit } from './types';

type Props = {
  onBack: () => void;
  onFinish: (result: MatchResult) => void;
};

type DeployedUnit = Unit & {
  uid: string;
  x: number;
  hp: number;
  maxHp: number;
};

type FieldThreat = Threat & {
  instanceId: string;
  defeated: boolean;
  x: number;
};

const FIELD_BASE_X = 2;
const FIELD_UNIT_START_X = 5;
const FIELD_UNIT_END_X = 92;
const FIELD_PORTAL_X = 91;
const TICK_MS = 120;
const QUIZ_DURATION_MS = 10000;

export function GameScreen({ onFinish }: Props) {
  const [coins, setCoins] = useState(250);
  const [base, setBase] = useState<BaseState>(() => createBaseState());
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [selectedThreat, setSelectedThreat] = useState<FieldThreat | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizTimeLeftMs, setQuizTimeLeftMs] = useState(QUIZ_DURATION_MS);
  const [feedback, setFeedback] = useState('Wave 1 incoming. Deploy stallers, then tap threats.');
  const [deployed, setDeployed] = useState<DeployedUnit[]>([]);
  const [fieldThreats, setFieldThreats] = useState<FieldThreat[]>([]);
  const [waveState, setWaveState] = useState(() => createWaveManager());
  const [sessionResults, setSessionResults] = useState<PlayerSessionResult[]>([]);
  const [finished, setFinished] = useState(false);

  const activeThreats = fieldThreats.filter((threat) => !threat.defeated);
  const accuracy = attempts === 0 ? 100 : Math.round((correct / attempts) * 100);
  const hpPct = Math.max(0, Math.round((base.hp / base.maxHp) * 100));
  const wave = currentWave(waveState);
  const currentQuizOptions = useMemo(() => selectedQuiz?.options ?? [], [selectedQuiz]);
  const quizTimePct = Math.max(0, Math.round((quizTimeLeftMs / QUIZ_DURATION_MS) * 100));

  const finishMatch = useCallback(
    (won: boolean) => {
      const rankGain = won ? 70 + correct * 10 + Math.round(hpPct / 5) : correct * 8;
      setFinished(true);
      onFinish({
        won,
        coins,
        correct,
        attempts,
        baseHp: hpPct,
        rankGain,
      });
    },
    [attempts, coins, correct, hpPct, onFinish]
  );

  useEffect(() => {
    if (finished) return;

    const id = setInterval(() => {
      const backgroundSpeed = selectedQuiz ? 0.5 : 1;
      const deltaMs = TICK_MS * backgroundSpeed;
      const activeUnits = deployed;
      const activeEnemies = fieldThreats.filter((threat) => !threat.defeated);

      setWaveState((state) => {
        const result = advanceWaveManager(state, deltaMs, activeEnemies.length, sessionResults);

        if (result.spawns.length > 0) {
          setFieldThreats((threats) => [
            ...threats,
            ...result.spawns.map((threat, index) => ({
              ...threat,
              instanceId: `${threat.id}-${Date.now()}-${index}`,
              defeated: false,
              x: FIELD_PORTAL_X + index * 2,
            })),
          ]);
        }

        if (result.state.phase === 'PostWave' && state.phase !== 'PostWave') {
          setFeedback(result.state.postWaveMessage);
        }

        return result.state;
      });

      setDeployed((units) =>
        units
          .map((unit) => {
            const blockingThreats = activeEnemies.filter(
              (threat) => Math.abs(threat.x - unit.x) < 4.5 && threat.x > FIELD_BASE_X
            );
            const isBlocking = blockingThreats.length > 0;
            const pressureDamage = blockingThreats.reduce(
              (total, threat) => total + threat.damage * 0.035 * backgroundSpeed,
              0
            );

            return {
              ...unit,
              hp: isBlocking ? unit.hp - pressureDamage : unit.hp,
              x: isBlocking
                ? unit.x
                : Math.min(FIELD_UNIT_END_X, unit.x + unitSpeedFor(unit) * backgroundSpeed),
            };
          })
          .filter((unit) => unit.x < FIELD_UNIT_END_X && unit.hp > 0)
      );

      setFieldThreats((threats) => {
        let breachDamage = 0;
        const nextThreats = threats.map((threat) => {
          if (threat.defeated) return threat;

          const isBlocked = activeUnits.some((unit) => Math.abs(unit.x - threat.x) < 4.5);
          const nextX = isBlocked ? threat.x : threat.x - threatSpeedFor(threat) * backgroundSpeed;

          if (nextX <= FIELD_BASE_X) {
            breachDamage += threat.damage;
            return { ...threat, defeated: true, x: FIELD_BASE_X };
          }

          return { ...threat, x: nextX };
        });

        if (breachDamage > 0) {
          setBase((value) => takeDamage(value, breachDamage));
          setFeedback('A threat reached the base. The Home component took damage.');
        }

        return nextThreats.filter((threat) => !threat.defeated || threat.x > FIELD_BASE_X);
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [deployed, fieldThreats, finished, selectedQuiz, sessionResults]);

  useEffect(() => {
    if (finished) return;

    const id = setInterval(() => {
      const income = selectedQuiz
        ? Math.max(1, Math.floor(passiveIncomeFor(base) * 0.5))
        : passiveIncomeFor(base);
      setCoins((value) => value + income);
    }, 1000);

    return () => clearInterval(id);
  }, [base, finished, selectedQuiz]);

  useEffect(() => {
    if (finished) return;

    if (base.hp <= 0) {
      const id = setTimeout(() => finishMatch(false), 0);
      return () => clearTimeout(id);
    }

    if (waveState.phase === 'Results') {
      const id = setTimeout(() => finishMatch(true), 0);
      return () => clearTimeout(id);
    }
  }, [base.hp, finishMatch, finished, waveState.phase]);

  function deployUnit(unit: Unit) {
    if (coins < unit.cost) {
      setFeedback('Not enough coins for that unit.');
      return;
    }

    setCoins((value) => value - unit.cost);
    setBase((value) => addShield(value, Math.round(unit.shield / 2)));
    setDeployed((value) => [
      ...value,
      {
        ...unit,
        uid: `${unit.id}-${Date.now()}-${value.length}`,
        x: FIELD_UNIT_START_X,
        hp: unitMaxHp(unit, base.officeTier),
        maxHp: unitMaxHp(unit, base.officeTier),
      },
    ]);
    setFeedback(`${unit.name} deployed. It will stall enemies but will not damage them.`);
  }

  function upgradeBase(which: 'server' | 'office' | 'home') {
    const cost = BASE_UPGRADE_COSTS[which];
    const tier = which === 'server' ? base.serverTier : which === 'office' ? base.officeTier : base.homeTier;

    if (tier >= 3) {
      setFeedback(`${labelForUpgrade(which)} is already max level.`);
      return;
    }

    if (coins < cost) {
      setFeedback('Not enough coins for that upgrade.');
      return;
    }

    setCoins((value) => value - cost);
    setBase((value) => {
      if (which === 'server') return upgradeServer(value);
      if (which === 'office') return upgradeOffice(value);
      return upgradeHome(value);
    });
    setFeedback(`${labelForUpgrade(which)} upgraded. Wave pressure keeps going.`);
  }

  function inspectThreat(threat: FieldThreat) {
    if (waveState.phase !== 'Wave') return;

    const quizzes = QUIZZES.filter((quiz) => quiz.threatId === threat.id);
    const quiz = quizzes[(attempts + activeThreats.length) % quizzes.length];
    setSelectedThreat(threat);
    setSelectedQuiz(quiz);
    setQuizTimeLeftMs(QUIZ_DURATION_MS);
    setFeedback(`${threat.name} paused. Answer to zap it.`);
  }

  const answerQuiz = useCallback((isCorrect: boolean) => {
    if (!selectedThreat || !wave) return;

    const nextAttempts = attempts + 1;
    const nextCorrect = correct + (isCorrect ? 1 : 0);

    setAttempts(nextAttempts);
    setCorrect(nextCorrect);
    setSessionResults((value) => [
      ...value,
      {
        waveId: wave.id,
        threatId: selectedThreat.id,
        domain: selectedThreat.domain,
        correct: isCorrect,
      },
    ]);

    if (isCorrect) {
      setCoins((value) => value + 80 + (base.serverTier - 1) * 15);
      setFieldThreats((value) =>
        value.map((threat) =>
          threat.instanceId === selectedThreat.instanceId ? { ...threat, defeated: true } : threat
        )
      );
      setFeedback(`${selectedThreat.name} zapped. +Coins awarded.`);
    } else {
      setBase((value) => takeDamage(value, selectedThreat.damage));
      setDeployed((value) => value.slice(1));
      setFieldThreats((value) =>
        value.map((threat) =>
          threat.instanceId === selectedThreat.instanceId
            ? { ...threat, x: Math.max(FIELD_BASE_X + 8, threat.x - 12) }
            : threat
        )
      );
      setFeedback(`Missed. ${selectedThreat.name} surged forward and damaged Home.`);
    }

    setSelectedThreat(null);
    setSelectedQuiz(null);
  }, [
    attempts,
    base.serverTier,
    correct,
    selectedThreat,
    wave,
  ]);

  useEffect(() => {
    if (!selectedQuiz || !selectedThreat) return;

    const id = setInterval(() => {
      setQuizTimeLeftMs((value) => {
        const next = Math.max(0, value - 100);
        if (next === 0) {
          clearInterval(id);
          setTimeout(() => answerQuiz(false), 0);
        }
        return next;
      });
    }, 100);

    return () => clearInterval(id);
  }, [answerQuiz, selectedQuiz, selectedThreat]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        <View style={styles.coinPill}>
          <View style={styles.coinDot} />
          <Text style={styles.coinText}>{coins}</Text>
        </View>

        <View style={styles.hpTrack}>
          <View style={[styles.hpFill, { width: `${hpPct}%` }]} />
          <Text style={styles.hpLabel}>Base HP</Text>
        </View>

        <View style={styles.wavePill}>
          <Text style={styles.wavePillText}>
            {waveState.phase === 'Results' ? 'Results' : `Wave ${waveState.waveIndex + 1}/${waveCount()}`}
          </Text>
          <Text style={styles.wavePillSub}>{accuracy}%</Text>
        </View>
      </View>

      <View style={styles.battlefield}>
        <View style={styles.base}>
          <View style={styles.baseRoof} />
          <View style={styles.baseHouse}>
            <View style={styles.baseDoor} />
          </View>
          <Text style={styles.baseLabel}>City Base</Text>
          <Text style={styles.shieldText}>Shield {base.shield}</Text>
        </View>

        <View style={styles.laneArea}>
          <View style={styles.laneFloor} />
          <View style={styles.unitLane}>
            {deployed.map((unit) => (
              <UnitSprite key={unit.uid} unit={unit} />
            ))}
          </View>
          <View style={styles.threatRow}>
            {fieldThreats.map((threat) => (
              <Pressable
                accessibilityRole="button"
                disabled={threat.defeated || waveState.phase !== 'Wave'}
                key={threat.instanceId}
                onPress={() => inspectThreat(threat)}
                style={[
                  styles.threatToken,
                  { borderColor: threat.color, left: `${threat.x}%` },
                  threat.defeated && styles.defeatedThreat,
                  selectedThreat?.instanceId === threat.instanceId && styles.selectedThreat,
                ]}>
                <Text style={[styles.threatIcon, { color: threat.color }]}>{threat.icon}</Text>
                <Text style={styles.threatName} numberOfLines={1}>
                  {threat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.portal}>
          <View style={styles.portalOuter}>
            <View style={styles.portalInner} />
          </View>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.feedback}>{feedback}</Text>
        <Text style={styles.weightsText}>
          Tech x{waveState.activeWeights.Technical} · Physical x{waveState.activeWeights.Physical} ·
          Personal x{waveState.activeWeights.Personal}
        </Text>
      </View>

      <View style={styles.unitRow}>
        {UNITS.map((unit) => (
          <Pressable
            accessibilityRole="button"
            key={unit.id}
            onPress={() => deployUnit(unit)}
            style={[styles.unitCard, coins < unit.cost && styles.disabledUnit]}>
            <UnitCardIcon unit={unit} />
            <Text style={styles.unitName} numberOfLines={1}>
              {unit.name}
            </Text>
            <Text style={styles.unitCost}>{unit.cost}c</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.upgradeRow}>
        <Pressable style={[styles.upgradeButton, styles.server]} onPress={() => upgradeBase('server')}>
          <Text style={styles.upgradeText}>Server</Text>
          <Text style={styles.upgradeLevel}>Lv {base.serverTier}</Text>
        </Pressable>
        <Pressable style={[styles.upgradeButton, styles.office]} onPress={() => upgradeBase('office')}>
          <Text style={styles.upgradeText}>Office</Text>
          <Text style={styles.upgradeLevel}>Lv {base.officeTier}</Text>
        </Pressable>
        <Pressable style={[styles.upgradeButton, styles.home]} onPress={() => upgradeBase('home')}>
          <Text style={styles.upgradeText}>Home</Text>
          <Text style={styles.upgradeLevel}>Lv {base.homeTier}</Text>
        </Pressable>
      </View>

      {waveState.phase === 'PostWave' ? (
        <View style={styles.postWaveBanner}>
          <Text style={styles.postWaveTitle}>Post Wave Analysis</Text>
          <Text style={styles.postWaveText}>{waveState.postWaveMessage}</Text>
        </View>
      ) : null}

      {selectedQuiz ? (
        <View style={styles.overlay}>
          <View style={styles.quizCard}>
            <View style={styles.quizTimerTrack}>
              <View
                style={[
                  styles.quizTimerFill,
                  quizTimePct <= 30 && styles.quizTimerDanger,
                  { width: `${quizTimePct}%` },
                ]}
              />
            </View>
            <Text style={styles.quizTag}>Threat quiz</Text>
            <Text style={styles.quizPrompt}>{selectedQuiz.prompt}</Text>
            <View style={styles.optionList}>
              {currentQuizOptions.map((option) => (
                <Pressable
                  accessibilityRole="button"
                  key={option.text}
                  onPress={() => answerQuiz(option.correct)}
                  style={({ pressed }) => [styles.optionButton, pressed && styles.pressedOption]}>
                  <Text style={styles.optionText}>{option.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function UnitSprite({ unit }: { unit: DeployedUnit }) {
  const hpPct = Math.max(0, Math.round((unit.hp / unit.maxHp) * 100));

  return (
    <View style={[styles.fieldUnit, { left: `${unit.x}%` }]}>
      <View style={styles.unitHpTrack}>
        <View style={[styles.unitHpFill, { width: `${hpPct}%` }]} />
      </View>
      <View style={[styles.unitHead, { backgroundColor: unit.color }]}>
        <View style={styles.unitEye} />
      </View>
      <View style={[styles.unitBody, { backgroundColor: unit.color }]}>
        <Text style={styles.fieldUnitText}>{unit.icon}</Text>
      </View>
      <View style={styles.unitFeet}>
        <View style={styles.unitFoot} />
        <View style={styles.unitFoot} />
      </View>
    </View>
  );
}

function UnitCardIcon({ unit }: { unit: Unit }) {
  return (
    <View style={styles.unitIconWrap}>
      <View style={[styles.cardUnitHead, { backgroundColor: unit.color }]} />
      <View style={[styles.cardUnitBody, { backgroundColor: unit.color }]}>
        <Text style={styles.unitIconText}>{unit.icon}</Text>
      </View>
    </View>
  );
}

function labelForUpgrade(which: 'server' | 'office' | 'home') {
  return which[0].toUpperCase() + which.slice(1);
}

function unitSpeedFor(unit: Unit) {
  if (unit.id === 'guard') return 1.45;
  if (unit.id === 'firewall') return 0.85;
  return 1.05;
}

function unitMaxHp(unit: Unit, officeTier: number) {
  return unit.shield * 2.5 + (officeTier - 1) * 12;
}

function threatSpeedFor(threat: FieldThreat) {
  if (threat.domain === 'Physical') return 0.7;
  if (threat.domain === 'Personal') return 0.55;
  return 0.62;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  topbar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinPill: {
    minWidth: 74,
    height: 36,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#0A1520',
    backgroundColor: '#0F1C2C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coinDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#F2B94B',
  },
  coinText: {
    color: '#F4F1E9',
    fontSize: 18,
    fontWeight: '900',
  },
  hpTrack: {
    flex: 1,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#0A1520',
    backgroundColor: '#0F1C2C',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  hpFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#5FB87A',
  },
  hpLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  wavePill: {
    minWidth: 106,
    height: 38,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#0A1520',
    backgroundColor: '#0F1C2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wavePillText: {
    color: '#F4F1E9',
    fontSize: 12,
    fontWeight: '900',
  },
  wavePillSub: {
    color: '#9FC4D6',
    fontSize: 11,
    fontWeight: '900',
  },
  battlefield: {
    flex: 1,
    minHeight: 250,
    maxHeight: 330,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#0A1520',
    backgroundColor: '#16263A',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  base: {
    width: 118,
    backgroundColor: '#0F1C2C',
    borderRightWidth: 2,
    borderRightColor: '#0A1520',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 5,
  },
  baseRoof: {
    width: 58,
    height: 34,
    borderLeftWidth: 29,
    borderRightWidth: 29,
    borderBottomWidth: 34,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#D6453D',
  },
  baseHouse: {
    width: 58,
    height: 58,
    marginTop: -2,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#0A1520',
    backgroundColor: '#F2B94B',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  baseDoor: {
    width: 14,
    height: 24,
    backgroundColor: '#B9852A',
  },
  baseLabel: {
    color: '#F4F1E9',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  shieldText: {
    color: '#9FC4D6',
    fontSize: 12,
    fontWeight: '800',
  },
  laneArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingBottom: 28,
  },
  laneFloor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    height: 2,
    backgroundColor: '#31506E',
  },
  unitLane: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 38,
    height: 100,
  },
  fieldUnit: {
    position: 'absolute',
    bottom: 0,
    width: 56,
    height: 86,
    alignItems: 'center',
  },
  unitHpTrack: {
    width: 42,
    height: 5,
    marginBottom: 3,
    borderRadius: 999,
    backgroundColor: '#0A1520',
    overflow: 'hidden',
  },
  unitHpFill: {
    height: '100%',
    backgroundColor: '#CFEFEE',
  },
  unitHead: {
    width: 30,
    height: 26,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#0A1520',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 6,
  },
  unitEye: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#0A1520',
  },
  unitBody: {
    width: 46,
    height: 38,
    marginTop: -3,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#0A1520',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitFeet: {
    width: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -1,
  },
  unitFoot: {
    width: 15,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#0A1520',
  },
  fieldUnitText: {
    color: '#0A1520',
    fontSize: 12,
    fontWeight: '900',
  },
  threatRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    height: 96,
  },
  threatToken: {
    position: 'absolute',
    bottom: 0,
    width: 96,
    height: 70,
    borderRadius: 8,
    borderWidth: 3,
    backgroundColor: '#203852',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
  },
  selectedThreat: {
    backgroundColor: '#28496A',
    transform: [{ translateY: -8 }],
  },
  defeatedThreat: {
    opacity: 0.25,
  },
  threatIcon: {
    fontSize: 24,
    fontWeight: '900',
  },
  threatName: {
    color: '#F4F1E9',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  portal: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalOuter: {
    width: 58,
    height: 96,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: '#7B5FA8',
    backgroundColor: '#4A366C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalInner: {
    width: 24,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#0F1C2C',
  },
  infoRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  feedback: {
    flex: 1,
    color: '#CFEFEE',
    fontSize: 14,
    fontWeight: '900',
  },
  weightsText: {
    color: '#9FC4D6',
    fontSize: 11,
    fontWeight: '900',
  },
  unitRow: {
    height: 92,
    flexDirection: 'row',
    gap: 10,
  },
  unitCard: {
    flex: 1,
    minWidth: 96,
    height: 92,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E7372',
    backgroundColor: '#CFEFEE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 3,
  },
  disabledUnit: {
    opacity: 0.45,
  },
  unitIconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
  },
  cardUnitHead: {
    width: 20,
    height: 16,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 2,
    borderColor: '#0A1520',
  },
  cardUnitBody: {
    width: 32,
    height: 26,
    marginTop: -2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0A1520',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitIconText: {
    color: '#0A1520',
    fontSize: 10,
    fontWeight: '900',
  },
  unitName: {
    color: '#1E7372',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  unitCost: {
    color: '#B9852A',
    fontSize: 11,
    fontWeight: '900',
  },
  upgradeRow: {
    height: 48,
    flexDirection: 'row',
    gap: 10,
  },
  upgradeButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0A1520',
    alignItems: 'center',
    justifyContent: 'center',
  },
  server: {
    backgroundColor: '#3DA9D6',
  },
  office: {
    backgroundColor: '#5FB87A',
  },
  home: {
    backgroundColor: '#F2A93B',
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  upgradeLevel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  postWaveBanner: {
    position: 'absolute',
    top: 74,
    alignSelf: 'center',
    maxWidth: 560,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#0A1520',
    backgroundColor: '#F4F1E9',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  postWaveTitle: {
    color: '#1E7372',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  postWaveText: {
    color: '#1B2430',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(10,16,24,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  quizCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#0A1520',
    backgroundColor: '#F4F1E9',
    padding: 18,
    gap: 12,
  },
  quizTimerTrack: {
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#0A1520',
    backgroundColor: '#DDD6C4',
    overflow: 'hidden',
  },
  quizTimerFill: {
    height: '100%',
    backgroundColor: '#2A9D9C',
  },
  quizTimerDanger: {
    backgroundColor: '#D6453D',
  },
  quizTag: {
    color: '#87613A',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  quizPrompt: {
    color: '#1B2430',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  optionList: {
    gap: 8,
  },
  optionButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0A1520',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pressedOption: {
    backgroundColor: '#CFEFEE',
  },
  optionText: {
    color: '#1B2430',
    fontSize: 14,
    fontWeight: '800',
  },
});
