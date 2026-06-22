import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string | number;
};

export function StatusPill({ label, value }: Props) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 92,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#0A1520',
    backgroundColor: '#0F1C2C',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    color: '#9FC4D6',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    color: '#F4F1E9',
    fontSize: 18,
    fontWeight: '900',
  },
});
