import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { DEMO_STUDENT } from './data';
import { LevelBlueButton } from './LevelBlueButton';

type Props = {
  onLogin: () => void;
};

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState(DEMO_STUDENT.email);
  const [password, setPassword] = useState(DEMO_STUDENT.password);
  const [error, setError] = useState('');

  function submit() {
    if (email.trim().toLowerCase() === DEMO_STUDENT.email && password === DEMO_STUDENT.password) {
      setError('');
      onLogin();
      return;
    }
    setError('Use the demo student account to enter LevelBlue.');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.logo}>LevelBlue</Text>
        <Text style={styles.tagline}>Defend the city. Spot the scam. Module 1 - The Basics</Text>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Student dummy account</Text>
          <Text style={styles.demoText}>{DEMO_STUDENT.email}</Text>
          <Text style={styles.demoText}>{DEMO_STUDENT.password}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <LevelBlueButton label="Log In" onPress={submit} />
        </View>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: '#1C3148',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#0A1520',
    padding: 24,
    gap: 18,
  },
  logo: {
    color: '#F2B94B',
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#0A1520',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  tagline: {
    color: '#9FC4D6',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  demoBox: {
    backgroundColor: '#0F1C2C',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0A1520',
    padding: 14,
    gap: 4,
  },
  demoTitle: {
    color: '#F2B94B',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  demoText: {
    color: '#F4F1E9',
    fontSize: 14,
    fontWeight: '800',
  },
  form: {
    gap: 10,
  },
  label: {
    color: '#CFEFEE',
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0A1520',
    backgroundColor: '#F4F1E9',
    color: '#1B2430',
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#FBD8D5',
    fontSize: 13,
    fontWeight: '800',
  },
});
