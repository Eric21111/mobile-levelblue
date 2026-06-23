import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { BestiaryScreen } from './BestiaryScreen';
import { DashboardScreen } from './DashboardScreen';
import { DEMO_STUDENT, rankTitleFor } from './data';
import { GameScreen } from './GameScreen';
import { IntroScreen } from './IntroScreen';
import { LoginScreen } from './LoginScreen';
import { ResultsScreen } from './ResultsScreen';
import { MatchResult, Student } from './types';

type Screen = 'intro' | 'login' | 'dashboard' | 'game' | 'bestiary' | 'results'; 

export function LevelBlueApp() {
  const [screen, setScreen] = useState<Screen>('intro');  // ← starts on intro
  const [student, setStudent] = useState<Student>(DEMO_STUDENT);
  const [lastResult, setLastResult] = useState<MatchResult | null>(null);

  function finishMatch(result: MatchResult) {
    setLastResult(result);
    setStudent((current) => {
      const rankPoints = current.rankPoints + result.rankGain;
      return {
        ...current,
        rankPoints,
        rankTitle: rankTitleFor(rankPoints),
        wins: current.wins + (result.won ? 1 : 0),
        gamesPlayed: current.gamesPlayed + 1,
        streak: result.won ? current.streak + 1 : 0,
      };
    });
    setScreen('results');
  }

  function logout() {
    setLastResult(null);
    setStudent(DEMO_STUDENT);
    setScreen('login');
  }

  if (screen === 'intro') {
    return <IntroScreen onStart={() => setScreen('login')} />;
  }

  if (screen === 'game') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <GameScreen onBack={() => setScreen('dashboard')} onFinish={finishMatch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}>
        <View style={styles.content}>
          {screen === 'login' ? <LoginScreen onLogin={() => setScreen('dashboard')} /> : null}
          {screen === 'dashboard' ? (
            <DashboardScreen
              lastResult={lastResult}
              onBestiary={() => setScreen('bestiary')}
              onLogout={logout}
              onPlay={() => setScreen('game')}
              student={student}
            />
          ) : null}
          {screen === 'bestiary' ? <BestiaryScreen onBack={() => setScreen('dashboard')} /> : null}
          {screen === 'results' && lastResult ? (
            <ResultsScreen
              onDashboard={() => setScreen('dashboard')}
              onRetry={() => setScreen('game')}
              result={lastResult}
              student={student}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1C2C',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0F1C2C',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    minHeight: 720,
    justifyContent: 'center',
  },
});