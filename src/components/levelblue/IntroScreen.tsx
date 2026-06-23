import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';

// ─── types ───────────────────────────────────────────────────────────────────

type Props = {
  onStart: () => void;
};

// ─── constants ───────────────────────────────────────────────────────────────

const LOAD_STEPS: { pct: number; label: string; delay: number }[] = [
  { pct: 15, label: 'Loading assets...', delay: 400 },
  { pct: 35, label: 'Building city grid...', delay: 550 },
  { pct: 55, label: 'Spawning threats...', delay: 480 },
  { pct: 75, label: 'Arming defenses...', delay: 520 },
  { pct: 90, label: 'Almost ready...', delay: 400 },
  { pct: 100, label: 'Ready!', delay: 350 },
];

// Floating pixel particles — each has a fixed x, random-ish start y, speed
const PARTICLES = [
  { x: 0.08, startY: 0.65, size: 6, speed: 7000, color: '#F2B94B', opacity: 0.25 },
  { x: 0.18, startY: 0.50, size: 4, speed: 9000, color: '#7ab8d4', opacity: 0.20 },
  { x: 0.28, startY: 0.72, size: 5, speed: 6500, color: '#F2B94B', opacity: 0.18 },
  { x: 0.42, startY: 0.58, size: 3, speed: 8000, color: '#7ab8d4', opacity: 0.22 },
  { x: 0.55, startY: 0.80, size: 6, speed: 7500, color: '#F2B94B', opacity: 0.15 },
  { x: 0.65, startY: 0.45, size: 4, speed: 9500, color: '#7ab8d4', opacity: 0.20 },
  { x: 0.75, startY: 0.68, size: 5, speed: 7000, color: '#F2B94B', opacity: 0.22 },
  { x: 0.88, startY: 0.55, size: 3, speed: 8500, color: '#7ab8d4', opacity: 0.18 },
];

// ─── particle component ───────────────────────────────────────────────────────

function Particle({ x, startY, size, speed, color, opacity, screenW, screenH }: {
  x: number; startY: number; size: number; speed: number;
  color: string; opacity: number; screenW: number; screenH: number;
}) {
  const posY = useRef(new Animated.Value(startY * screenH)).current;

  useEffect(() => {
    function loop() {
      posY.setValue(startY * screenH);
      Animated.timing(posY, {
        toValue: -20,
        duration: speed,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(loop);
    }
    const t = setTimeout(loop, Math.random() * 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x * screenW - size / 2,
        width: size,
        height: size,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: posY }],
      }}
    />
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function IntroScreen({ onStart }: Props) {
  const { width, height } = Dimensions.get('window');

  // entrance animations
  const badgeScale   = useRef(new Animated.Value(0)).current;
  const badgeRotate  = useRef(new Animated.Value(-10)).current;
  const logoY        = useRef(new Animated.Value(-20)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const subOpacity   = useRef(new Animated.Value(0)).current;
  const barOpacity   = useRef(new Animated.Value(0)).current;
  const barWidth     = useRef(new Animated.Value(0)).current;
  const startOpacity = useRef(new Animated.Value(0)).current;
  const btnScale     = useRef(new Animated.Value(1)).current;
  const hudOpacity   = useRef(new Animated.Value(0)).current;

  const [loadLabel, setLoadLabel] = useState('Initializing...');
  const [loadPct, setLoadPct]     = useState(0);
  const [ready, setReady]         = useState(false);

  // ── entrance sequence ──────────────────────────────────────────────────────
  useEffect(() => {
    // HUD brackets + side rails fade in first
    const hudTimer = setTimeout(() => {
      Animated.timing(hudOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 100);

    const badgeTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
        Animated.timing(badgeRotate, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      ]).start();
    }, 300);

    const logoTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(logoY, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, 500);

    const subTimer = setTimeout(() => {
      Animated.timing(subOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 700);

    const barTimer = setTimeout(() => {
      Animated.timing(barOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      runLoadSequence();
    }, 900);

    return () => {
      clearTimeout(hudTimer);
      clearTimeout(badgeTimer);
      clearTimeout(logoTimer);
      clearTimeout(subTimer);
      clearTimeout(barTimer);
    };
  }, []);

  // ── load bar stepper ───────────────────────────────────────────────────────
  function runLoadSequence() {
    let accumulated = 0;
    LOAD_STEPS.forEach((step, i) => {
      accumulated += step.delay;
      setTimeout(() => {
        setLoadLabel(step.label);
        setLoadPct(step.pct);
        Animated.timing(barWidth, {
          toValue: step.pct / 100,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
        if (i === LOAD_STEPS.length - 1) {
          setTimeout(() => {
            setReady(true);
            Animated.timing(startOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
          }, 400);
        }
      }, accumulated);
    });
  }

  // ── button press ──────────────────────────────────────────────────────────
  function handlePressIn() {
    Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }).start();
  }

  // derived
  const badgeSpin = badgeRotate.interpolate({ inputRange: [-10, 0], outputRange: ['-10deg', '0deg'] });
  const barWidthInterp = barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {/* ── city skyline ── */}
      <View style={styles.skylineWrap} pointerEvents="none">
        <Svg width={width} height={220} viewBox={`0 0 ${width} 220`}>
          {/* far background buildings — very dark */}
          <Rect x="0"   y="140" width="22" height="80"  fill="#080f1a" />
          <Rect x="25"  y="120" width="18" height="100" fill="#080f1a" />
          <Rect x="46"  y="130" width="30" height="90"  fill="#080f1a" />
          <Rect x="80"  y="110" width="20" height="110" fill="#080f1a" />
          <Rect x="105" y="125" width="25" height="95"  fill="#080f1a" />
          <Rect x="140" y="100" width="22" height="120" fill="#080f1a" />
          <Rect x="170" y="118" width="28" height="102" fill="#080f1a" />
          <Rect x="205" y="108" width="20" height="112" fill="#080f1a" />
          <Rect x="232" y="122" width="32" height="98"  fill="#080f1a" />
          <Rect x="272" y="105" width="24" height="115" fill="#080f1a" />
          <Rect x="305" y="130" width="20" height="90"  fill="#080f1a" />
          <Rect x="332" y="115" width="28" height="105" fill="#080f1a" />

          {/* mid buildings */}
          <Rect x="10"  y="100" width="28" height="120" fill="#0a1825" />
          <Rect x="18"  y="88"  width="12" height="16"  fill="#0a1825" />
          <Rect x="50"  y="72"  width="42" height="148" fill="#0c1f30" />
          <Rect x="62"  y="60"  width="18" height="16"  fill="#0c1f30" />
          <Rect x="100" y="88"  width="32" height="132" fill="#0a1825" />
          <Rect x="108" y="76"  width="16" height="16"  fill="#0a1825" />
          <Rect x="140" y="62"  width="52" height="158" fill="#0e2438" />
          <Rect x="155" y="50"  width="22" height="16"  fill="#0e2438" />
          <Rect x="200" y="80"  width="36" height="140" fill="#0a1825" />
          <Rect x="210" y="68"  width="16" height="16"  fill="#0a1825" />
          <Rect x="245" y="55"  width="46" height="165" fill="#0c1f30" />
          <Rect x="258" y="42"  width="20" height="17"  fill="#0c1f30" />
          <Rect x="300" y="75"  width="32" height="145" fill="#0a1825" />
          <Rect x={width - 32} y="90" width="30" height="130" fill="#0c1f30" />

          {/* windows — amber */}
          <Rect x="54"  y="76" width="5" height="5" fill="#F2B94B" opacity="0.7" />
          <Rect x="54"  y="88" width="5" height="5" fill="#F2B94B" opacity="0.4" />
          <Rect x="76"  y="80" width="5" height="5" fill="#F2B94B" opacity="0.5" />
          <Rect x="144" y="68" width="5" height="5" fill="#F2B94B" opacity="0.8" />
          <Rect x="160" y="78" width="5" height="5" fill="#F2B94B" opacity="0.5" />
          <Rect x="160" y="92" width="5" height="5" fill="#F2B94B" opacity="0.3" />
          <Rect x="175" y="72" width="5" height="5" fill="#F2B94B" opacity="0.6" />
          <Rect x="250" y="64" width="5" height="5" fill="#F2B94B" opacity="0.7" />
          <Rect x="265" y="76" width="5" height="5" fill="#F2B94B" opacity="0.4" />
          <Rect x="280" y="68" width="5" height="5" fill="#F2B94B" opacity="0.5" />
          <Rect x="304" y="82" width="5" height="5" fill="#F2B94B" opacity="0.6" />

          {/* windows — blue */}
          <Rect x="64"  y="84" width="4" height="4" fill="#7ab8d4" opacity="0.5" />
          <Rect x="104" y="92" width="4" height="4" fill="#7ab8d4" opacity="0.4" />
          <Rect x="150" y="82" width="4" height="4" fill="#7ab8d4" opacity="0.6" />
          <Rect x="204" y="88" width="4" height="4" fill="#7ab8d4" opacity="0.5" />
          <Rect x="256" y="72" width="4" height="4" fill="#7ab8d4" opacity="0.4" />
          <Rect x="316" y="86" width="4" height="4" fill="#7ab8d4" opacity="0.5" />

          {/* ground glow strip */}
          <Rect x="0" y="215" width={width} height="5" fill="#1e3a55" opacity="0.6" />
          <Rect x="0" y="218" width={width} height="2" fill="#F2B94B" opacity="0.08" />
        </Svg>
      </View>

      {/* ── floating particles ── */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} screenW={width} screenH={height} />
      ))}

      {/* ── HUD corner brackets ── */}
      <Animated.View style={[styles.hud, { opacity: hudOpacity }]} pointerEvents="none">
        {/* top-left */}
        <View style={[styles.corner, styles.cornerTL]} />
        {/* top-right */}
        <View style={[styles.corner, styles.cornerTR]} />
        {/* bottom-left */}
        <View style={[styles.corner, styles.cornerBL]} />
        {/* bottom-right */}
        <View style={[styles.corner, styles.cornerBR]} />
      </Animated.View>

      {/* ── top status bar ── */}
      <Animated.View style={[styles.statusBar, { opacity: hudOpacity }]} pointerEvents="none">
        <Text style={styles.statusText}>SYS:ONLINE</Text>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>THREAT LEVEL: LOW</Text>
        <View style={styles.statusSpacer} />
        <Text style={styles.statusText}>SECTOR 7 · CDO</Text>
      </Animated.View>

      {/* ── left rail ── */}
      <Animated.View style={[styles.sideRailLeft, { opacity: hudOpacity }]} pointerEvents="none">
        <Text style={styles.sideRailText}>LEVELBLUE SECURITY SYS</Text>
      </Animated.View>

      {/* ── right rail ── */}
      <Animated.View style={[styles.sideRailRight, { opacity: hudOpacity }]} pointerEvents="none">
        <Text style={styles.sideRailText}>CYBER DEFENSE MODULE 01</Text>
      </Animated.View>

      {/* ── centre content ── */}
      <View style={styles.centre}>
        <Animated.View
          style={[
            styles.badge,
            { transform: [{ scale: badgeScale }, { rotate: badgeSpin }] },
          ]}>
          <Text style={styles.badgeIcon}>🛡</Text>
        </Animated.View>

        <Animated.Text
          style={[styles.logo, { opacity: logoOpacity, transform: [{ translateY: logoY }] }]}>
          LevelBlue
        </Animated.Text>

        <Animated.Text style={[styles.sub, { opacity: subOpacity }]}>
          Cybersecurity Training
        </Animated.Text>
      </View>

      {/* ── loading bar ── */}
      <Animated.View style={[styles.loadWrap, { opacity: barOpacity }]}>
        <View style={styles.loadLabelRow}>
          <Text style={styles.loadLabel}>{loadLabel}</Text>
          <Text style={styles.loadPct}>{loadPct}%</Text>
        </View>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidthInterp }]} />
        </View>
      </Animated.View>

      {/* ── START button ── */}
      <Animated.View style={[styles.startWrap, { opacity: startOpacity }]}>
        <Pressable disabled={!ready} onPress={onStart} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <Animated.View style={[styles.startBtn, { transform: [{ scale: btnScale }] }]}>
            <Text style={styles.startLabel}>▶  START</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* version */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 2;
const CORNER_COLOR = '#1e4a6e';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060e18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // skyline
  skylineWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  // HUD overlay (corner brackets)
  hud: {
    position: 'absolute',
    inset: 0,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 16, left: 16,
    borderTopWidth: CORNER_THICKNESS, borderTopColor: CORNER_COLOR,
    borderLeftWidth: CORNER_THICKNESS, borderLeftColor: CORNER_COLOR,
  },
  cornerTR: {
    top: 16, right: 16,
    borderTopWidth: CORNER_THICKNESS, borderTopColor: CORNER_COLOR,
    borderRightWidth: CORNER_THICKNESS, borderRightColor: CORNER_COLOR,
  },
  cornerBL: {
    bottom: 16, left: 16,
    borderBottomWidth: CORNER_THICKNESS, borderBottomColor: CORNER_COLOR,
    borderLeftWidth: CORNER_THICKNESS, borderLeftColor: CORNER_COLOR,
  },
  cornerBR: {
    bottom: 16, right: 16,
    borderBottomWidth: CORNER_THICKNESS, borderBottomColor: CORNER_COLOR,
    borderRightWidth: CORNER_THICKNESS, borderRightColor: CORNER_COLOR,
  },

  // top status bar
  statusBar: {
    position: 'absolute',
    top: 36,
    left: 46,
    right: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: '#1e4a6e',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2a7a3a',
  },
  statusSpacer: {
    flex: 1,
  },

  // side rails
  sideRailLeft: {
    position: 'absolute',
    left: -52,
    top: '50%',
    transform: [{ rotate: '-90deg' }],
  },
  sideRailRight: {
    position: 'absolute',
    right: -58,
    top: '50%',
    transform: [{ rotate: '90deg' }],
  },
  sideRailText: {
    color: '#0f2a40',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  // centre
  centre: {
    alignItems: 'center',
    marginBottom: 80,
  },
  badge: {
    width: 80,
    height: 80,
    backgroundColor: '#F2B94B',
    borderRadius: 4,
    borderWidth: 3,
    borderColor: '#0a1520',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#0a1520',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  badgeIcon: {
    fontSize: 40,
    lineHeight: 48,
  },
  logo: {
    color: '#F2B94B',
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: '#0a1520',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
    lineHeight: 64,
  },
  sub: {
    color: '#7ab8d4',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: 8,
  },

  // load bar
  loadWrap: {
    position: 'absolute',
    bottom: 120,
    left: 40,
    right: 40,
  },
  loadLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  loadLabel: {
    color: '#5a8aaa',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  loadPct: {
    color: '#5a8aaa',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  barTrack: {
    height: 8,
    backgroundColor: '#0a1520',
    borderWidth: 2,
    borderColor: '#0f2035',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#F2B94B',
    borderRadius: 1,
  },

  // start button
  startWrap: {
    position: 'absolute',
    bottom: 44,
    left: 40,
    right: 40,
  },
  startBtn: {
    height: 58,
    backgroundColor: '#d4940c',
    borderRadius: 4,
    borderTopWidth: 2,
    borderTopColor: '#fcd97a',
    borderBottomWidth: 4,
    borderBottomColor: '#8a5c08',
    borderLeftWidth: 0,
    borderRightWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0a1520',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  startLabel: {
    color: '#3d2000',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
  },

  // version
  version: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    color: '#1e3a55',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});