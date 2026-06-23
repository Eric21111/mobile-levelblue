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

// ─── load sequence ───────────────────────────────────────────────────────────

const LOAD_STEPS: { pct: number; label: string; delay: number }[] = [
    { pct: 15, label: 'Loading assets...', delay: 400 },
    { pct: 35, label: 'Building city grid...', delay: 550 },
    { pct: 55, label: 'Spawning threats...', delay: 480 },
    { pct: 75, label: 'Arming defenses...', delay: 520 },
    { pct: 90, label: 'Almost ready...', delay: 400 },
    { pct: 100, label: 'Ready!', delay: 350 },
];

// ─── component ───────────────────────────────────────────────────────────────

export function IntroScreen({ onStart }: Props) {
    const { width } = Dimensions.get('window');

    // animated values
    const badgeScale = useRef(new Animated.Value(0)).current;
    const badgeRotate = useRef(new Animated.Value(-10)).current;
    const logoY = useRef(new Animated.Value(-20)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const subOpacity = useRef(new Animated.Value(0)).current;
    const barOpacity = useRef(new Animated.Value(0)).current;
    const barWidth = useRef(new Animated.Value(0)).current;
    const startOpacity = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    // state
    const [loadLabel, setLoadLabel] = useState('Initializing...');
    const [loadPct, setLoadPct] = useState(0);
    const [ready, setReady] = useState(false);

    // ── entrance sequence ──────────────────────────────────────────────────────
    useEffect(() => {
        // badge pop-in at 300ms
        const badgeTimer = setTimeout(() => {
            Animated.parallel([
                Animated.spring(badgeScale, {
                    toValue: 1,
                    friction: 5,
                    tension: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(badgeRotate, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.back(2)),
                    useNativeDriver: true,
                }),
            ]).start();
        }, 300);

        // logo slides down at 500ms
        const logoTimer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(logoY, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start();
        }, 500);

        // sub-text fades in at 700ms
        const subTimer = setTimeout(() => {
            Animated.timing(subOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }, 700);

        // loading bar appears at 900ms, then steps through
        const barTimer = setTimeout(() => {
            Animated.timing(barOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
            runLoadSequence();
        }, 900);

        return () => {
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
                    useNativeDriver: false, // width can't use native driver
                }).start();

                // last step → show START button
                if (i === LOAD_STEPS.length - 1) {
                    setTimeout(() => {
                        setReady(true);
                        Animated.timing(startOpacity, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }).start();
                    }, 400);
                }
            }, accumulated);
        });
    }

    // ── button press animation ─────────────────────────────────────────────────
    function handlePressIn() {
        Animated.timing(btnScale, {
            toValue: 0.96,
            duration: 80,
            useNativeDriver: true,
        }).start();
    }

    function handlePressOut() {
        Animated.timing(btnScale, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
        }).start();
    }

    // derived
    const badgeSpin = badgeRotate.interpolate({
        inputRange: [-10, 0],
        outputRange: ['-10deg', '0deg'],
    });

    const barWidthInterp = barWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    // ── render ─────────────────────────────────────────────────────────────────
    return (
        <View style={styles.root}>

            {/* grid lines */}
            <View style={styles.gridH} pointerEvents="none" />
            <View style={styles.gridV} pointerEvents="none" />

            {/* top glow */}
            <View style={styles.topGlow} pointerEvents="none" />

            {/* city skyline */}
            <View style={styles.skylineWrap} pointerEvents="none">
                <Svg width={width} height={180} viewBox={`0 0 ${width} 180`}>
                    {/* back layer buildings */}
                    <Rect x="10" y="100" width="28" height="80" fill="#0a1825" />
                    <Rect x="18" y="90" width="12" height="14" fill="#0a1825" />
                    <Rect x="50" y="75" width="40" height="105" fill="#0c1f30" />
                    <Rect x="62" y="64" width="16" height="14" fill="#0c1f30" />
                    <Rect x="100" y="90" width="30" height="90" fill="#0a1825" />
                    <Rect x="140" y="65" width="50" height="115" fill="#0e2438" />
                    <Rect x="155" y="53" width="20" height="15" fill="#0e2438" />
                    <Rect x="200" y="82" width="35" height="98" fill="#0a1825" />
                    <Rect x="245" y="58" width="45" height="122" fill="#0c1f30" />
                    <Rect x="258" y="46" width="18" height="15" fill="#0c1f30" />
                    <Rect x="300" y="78" width="30" height="102" fill="#0a1825" />
                    <Rect x={width - 30} y="92" width="28" height="88" fill="#0c1f30" />
                    {/* lit windows */}
                    <Rect x="54" y="78" width="4" height="4" fill="#F2B94B" opacity="0.6" />
                    <Rect x="64" y="88" width="4" height="4" fill="#7ab8d4" opacity="0.5" />
                    <Rect x="76" y="82" width="4" height="4" fill="#F2B94B" opacity="0.4" />
                    <Rect x="144" y="72" width="5" height="5" fill="#7ab8d4" opacity="0.5" />
                    <Rect x="159" y="80" width="5" height="5" fill="#F2B94B" opacity="0.7" />
                    <Rect x="172" y="88" width="5" height="5" fill="#7ab8d4" opacity="0.4" />
                    <Rect x="250" y="66" width="5" height="5" fill="#F2B94B" opacity="0.6" />
                    <Rect x="264" y="74" width="5" height="5" fill="#7ab8d4" opacity="0.5" />
                    <Rect x="278" y="70" width="5" height="5" fill="#F2B94B" opacity="0.3" />
                    {/* ground line */}
                    <Rect x="0" y="176" width={width} height="4" fill="#1e3a55" opacity="0.5" />
                </Svg>
            </View>

            {/* ── centre content ── */}
            <View style={styles.centre}>

                {/* shield badge */}
                <Animated.View
                    style={[
                        styles.badge,
                        {
                            transform: [
                                { scale: badgeScale },
                                { rotate: badgeSpin },
                            ],
                        },
                    ]}>
                    <Text style={styles.badgeIcon}>🛡</Text>
                </Animated.View>

                {/* logo */}
                <Animated.Text
                    style={[
                        styles.logo,
                        {
                            opacity: logoOpacity,
                            transform: [{ translateY: logoY }],
                        },
                    ]}>
                    LevelBlue
                </Animated.Text>

                {/* sub-text */}
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
                <Pressable
                    disabled={!ready}
                    onPress={onStart}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}>
                    <Animated.View
                        style={[styles.startBtn, { transform: [{ scale: btnScale }] }]}>
                        <Text style={styles.startLabel}>▶  START</Text>
                    </Animated.View>
                </Pressable>
            </Animated.View>

            {/* version watermark */}
            <Text style={styles.version}>v1.0.0</Text>
        </View>
    );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#060e18',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // background decoration
    gridH: {
        position: 'absolute',
        inset: 0,
        // react-native can't do repeating-linear-gradient natively;
        // swap this for a tiled SVG or expo-linear-gradient rows if needed
    },
    gridV: {
        position: 'absolute',
        inset: 0,
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        // soft blue radial feel — use expo-linear-gradient if available:
        // colors: ['#1a3a5c', 'transparent'], start: {x:0.5,y:0}, end: {x:0.5,y:1}
        backgroundColor: 'transparent',
    },

    // city skyline pinned to bottom
    skylineWrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },

    // centre stack
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
        // hard drop shadow
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

    // loading bar
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
        // swap for expo-linear-gradient if desired: ['#1e6aa8', '#F2B94B']
    },

    // START button
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
        // hard shadow for the 3-D push feel
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

    // version watermark
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