import { StyleSheet, Text, View } from 'react-native';

import { LevelBlueButton } from './LevelBlueButton';
import { StatusPill } from './StatusPill';
import { MatchResult, Student } from './types';

type Props = {
  student: Student;
  lastResult: MatchResult | null;
  onBestiary: () => void;
  onLogout: () => void;
  onPlay: () => void;
};

export function DashboardScreen({ student, lastResult, onBestiary, onLogout, onPlay }: Props) {
  const nextRank = student.rankPoints >= 650 ? 900 : 650;
  const progress = Math.min(100, Math.round((student.rankPoints / nextRank) * 100));

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{student.avatar}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{student.className}</Text>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.rank}>{student.rankTitle}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatusPill label="Rank XP" value={student.rankPoints} />
        <StatusPill label="Wins" value={student.wins} />
        <StatusPill label="Streak" value={student.streak} />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Module 1</Text>
          <Text style={styles.panelMeta}>Scam Defense Basics</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}% toward next rank checkpoint</Text>

        {lastResult ? (
          <View style={styles.resultStrip}>
            <Text style={styles.resultText}>
              Last match: {lastResult.won ? 'Victory' : 'Base breached'} · Accuracy{' '}
              {lastResult.correct}/{lastResult.attempts} · +{lastResult.rankGain} XP
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <LevelBlueButton label="▶ Play Module 1" onPress={onPlay} style={styles.actionButton} />
          <LevelBlueButton
            label="Threat Log"
            onPress={onBestiary}
            style={styles.actionButton}
            variant="secondary"
          />
          <LevelBlueButton
            label="Log Out"
            onPress={onLogout}
            style={styles.actionButton}
            variant="danger"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: 14,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#0A1520',
    backgroundColor: '#F2B94B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#1B2430',
    fontSize: 24,
    fontWeight: '900',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: '#9FC4D6',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  name: {
    color: '#F4F1E9',
    fontSize: 30,
    fontWeight: '900',
  },
  rank: {
    color: '#F2B94B',
    fontSize: 16,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  panel: {
    backgroundColor: '#1C3148',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#0A1520',
    padding: 18,
    gap: 14,
  },
  panelHeader: {
    gap: 2,
  },
  panelTitle: {
    color: '#F2B94B',
    fontSize: 26,
    fontWeight: '900',
  },
  panelMeta: {
    color: '#CFEFEE',
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#0A1520',
    backgroundColor: '#0F1C2C',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5FB87A',
  },
  progressText: {
    color: '#9FC4D6',
    fontSize: 12,
    fontWeight: '800',
  },
  resultStrip: {
    borderRadius: 8,
    backgroundColor: '#0F1C2C',
    padding: 12,
  },
  resultText: {
    color: '#F4F1E9',
    fontSize: 13,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flexGrow: 1,
  },
});
