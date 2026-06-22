import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { THREATS } from './data';
import { LevelBlueButton } from './LevelBlueButton';

type Props = {
  onBack: () => void;
};

export function BestiaryScreen({ onBack }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.title}>Threat Log</Text>
          <Text style={styles.subtitle}>Dummy bestiary data for Module 1</Text>
        </View>
        <LevelBlueButton label="Back" onPress={onBack} variant="secondary" />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {THREATS.map((threat) => (
          <View key={threat.id} style={styles.card}>
            <View style={[styles.icon, { backgroundColor: threat.color }]}>
              <Text style={styles.iconText}>{threat.icon}</Text>
            </View>
            <Text style={styles.name}>{threat.name}</Text>
            <Text style={styles.domain}>{threat.domain}</Text>
            <Text style={styles.fact}>{threat.fact}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
    padding: 18,
    gap: 14,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: '#F4F1E9',
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: '#9FC4D6',
    fontSize: 13,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    flexBasis: 180,
    flexGrow: 1,
    backgroundColor: '#1C3148',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#0A1520',
    padding: 14,
    gap: 7,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0A1520',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#1B2430',
    fontSize: 24,
    fontWeight: '900',
  },
  name: {
    color: '#F4F1E9',
    fontSize: 16,
    fontWeight: '900',
  },
  domain: {
    color: '#F2B94B',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  fact: {
    color: '#B9CBDA',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
