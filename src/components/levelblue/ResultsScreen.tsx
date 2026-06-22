import { StyleSheet, Text, View } from 'react-native';

import { LevelBlueButton } from './LevelBlueButton';
import { MatchResult, Student } from './types';

type Props = {
  result: MatchResult;
  student: Student;
  onDashboard: () => void;
  onRetry: () => void;
};

export function ResultsScreen({ result, student, onDashboard, onRetry }: Props) {
  const stars = result.won
    ? result.baseHp >= 70
      ? 3
      : result.baseHp >= 40
        ? 2
        : 1
    : 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.kicker}>{result.won ? 'Wave Cleared' : 'Training Complete'}</Text>
        <Text style={styles.title}>{result.won ? 'Victory' : 'Base Breached'}</Text>
        <Text style={styles.stars}>{[1, 2, 3].map((star) => (star <= stars ? '★' : '☆')).join(' ')}</Text>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Student rank</Text>
          <Text style={styles.statValue}>{student.rankTitle}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Rank gain</Text>
          <Text style={styles.statValue}>+{result.rankGain} XP</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={styles.statValue}>
            {result.correct} / {result.attempts}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Base HP</Text>
          <Text style={styles.statValue}>{result.baseHp}%</Text>
        </View>

        <View style={styles.actions}>
          <LevelBlueButton label="Retry" onPress={onRetry} style={styles.action} variant="secondary" />
          <LevelBlueButton label="Dashboard" onPress={onDashboard} style={styles.action} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#0A1520',
    backgroundColor: '#F4F1E9',
    padding: 22,
    gap: 12,
  },
  kicker: {
    color: '#1E7372',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    color: '#1B2430',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  stars: {
    color: '#F2B94B',
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
  },
  statRow: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#CFEFEE',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statLabel: {
    color: '#1E7372',
    fontSize: 14,
    fontWeight: '900',
  },
  statValue: {
    color: '#1B2430',
    fontSize: 15,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  action: {
    flexGrow: 1,
  },
});
