import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
};

export function LevelBlueButton({ label, onPress, variant = 'primary', disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, variant !== 'primary' && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0A1520',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: '#0A1520',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  primary: {
    backgroundColor: '#F2B94B',
  },
  secondary: {
    backgroundColor: '#CFEFEE',
  },
  danger: {
    backgroundColor: '#FBD8D5',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 3 }],
    shadowOffset: { width: 1, height: 1 },
  },
  label: {
    color: '#43300C',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryLabel: {
    color: '#1E7372',
  },
});
