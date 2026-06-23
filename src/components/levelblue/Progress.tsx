import { useEffect, useMemo, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master';

export interface RankProgressData {
    currentRank: RankTier;
    currentPoints: number;
    /** Points still needed to reach the next rank. 0 if currentRank is 'Master'. */
    pointsToNextRank: number;
}

export interface ModuleProgressData {
    /** 1-indexed, e.g. 1–5 */
    currentModule: number;
    totalModules: number;
    /** Tasks completed within the current module */
    tasksCompleted: number;
    /** Tasks still needed to unlock the next module */
    tasksToNextModule: number;
    /** Optional override — otherwise pulled from MODULE_TITLES */
    moduleTitle?: string;
}

export interface MasteryCategory {
    id: string;
    label: string;
    /** 0–100 */
    mastery: number;
}

export interface ProgressProps {
    onPressMastery?: (category: MasteryCategory) => void;
    onBack: () => void;
}

/* ------------------------------------------------------------------ */
/*  Static config                                                      */
/* ------------------------------------------------------------------ */

const RANK_ORDER: RankTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];

const RANK_STYLE: Record<RankTier, { color: string; glow: string }> = {
    Bronze: { color: '#C97A4A', glow: 'rgba(201,122,74,0.30)' },
    Silver: { color: '#AEB9CC', glow: 'rgba(174,185,204,0.30)' },
    Gold: { color: '#F2C14E', glow: 'rgba(242,193,78,0.30)' },
    Platinum: { color: '#7FD8D0', glow: 'rgba(127,216,208,0.30)' },
    Diamond: { color: '#7DB8FF', glow: 'rgba(125,184,255,0.30)' },
    Master: { color: '#C792EA', glow: 'rgba(199,146,234,0.30)' },
};

const MODULE_TITLES: Record<number, string> = {
    1: 'Phishing & Email Threats',
    2: 'Pretexting & Impersonation',
    3: 'Vishing & Smishing',
    4: 'Baiting & Physical Intrusion',
    5: 'OSINT & Advanced Manipulation',
};

/** Sample data — handy for previewing the screen or as a shape reference. */
export const SAMPLE_PROGRESS_DATA = {
  rank: { currentRank: 'Bronze' as RankTier, currentPoints: 740, pointsToNextRank: 260 },
  module: {
    currentModule: 1,
    totalModules: 5,
    tasksCompleted: 4,
    tasksToNextModule: 2,
  },
  mastery: [
    { id: 'phishing', label: 'Email Phishing', mastery: 88 },
    { id: 'pretexting', label: 'Pretexting & Impersonation', mastery: 64 },
    { id: 'vishing', label: 'Phone & SMS Scams', mastery: 52 },
    { id: 'physical', label: 'Physical Security (Tailgating)', mastery: 35 },
    { id: 'osint', label: 'Information Gathering (OSINT)', mastery: 21 },
  ],
};

/* ------------------------------------------------------------------ */
/*  Hook: respect the "reduce motion" accessibility setting             */
/* ------------------------------------------------------------------ */

function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled?.().then((value) => {
            if (mounted) setReduced(!!value);
        });
        const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduced);
        return () => {
            mounted = false;
            sub?.remove?.();
        };
    }, []);

    return reduced;
}

/* ------------------------------------------------------------------ */
/*  RankBadge — circular "clearance badge" with reticle ticks           */
/* ------------------------------------------------------------------ */

function RankBadge({ rank }: { rank: RankTier }) {
    const { color, glow } = RANK_STYLE[rank];
    const scale = useRef(new Animated.Value(0.6)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        if (reducedMotion) {
            scale.setValue(1);
            opacity.setValue(1);
            return;
        }
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
            Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();
    }, [reducedMotion, scale, opacity]);

    return (
        <Animated.View style={[styles.badgeWrap, { opacity, transform: [{ scale }] }]}>
            <View style={[styles.badgeGlow, { backgroundColor: glow }]} />
            <View style={[styles.badgeRing, { borderColor: color }]}>
                <View style={[styles.badgeCore, { backgroundColor: color }]}>
                    <Text style={styles.badgeInitial}>{rank.charAt(0)}</Text>
                </View>
            </View>
            <View style={[styles.tick, styles.tickTop, { backgroundColor: color }]} />
            <View style={[styles.tick, styles.tickBottom, { backgroundColor: color }]} />
            <View style={[styles.tick, styles.tickLeft, { backgroundColor: color }]} />
            <View style={[styles.tick, styles.tickRight, { backgroundColor: color }]} />
        </Animated.View>
    );
}

/* ------------------------------------------------------------------ */
/*  ProgressTrack — shared animated bar (rank, module, mastery rows)    */
/* ------------------------------------------------------------------ */

function ProgressTrack({
    percent,
    color,
    delay = 0,
    height = 10,
}: {
    percent: number;
    color: string;
    delay?: number;
    height?: number;
}) {
    const width = useRef(new Animated.Value(0)).current;
    const reducedMotion = useReducedMotion();
    const clamped = Math.max(0, Math.min(100, percent));

    useEffect(() => {
        if (reducedMotion) {
            width.setValue(clamped);
            return;
        }
        Animated.timing(width, {
            toValue: clamped,
            duration: 700,
            delay,
            useNativeDriver: false, // width can't be animated on the native driver
        }).start();
    }, [clamped, delay, reducedMotion, width]);

    return (
        <View style={[styles.track, { height }]}>
            <Animated.View
                style={[
                    styles.trackFill,
                    {
                        backgroundColor: color,
                        height,
                        width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                    },
                ]}
            />
        </View>
    );
}

/* ------------------------------------------------------------------ */
/*  Mastery graph row                                                   */
/* ------------------------------------------------------------------ */

function masteryColor(value: number): string {
    if (value >= 80) return '#4ADE80'; // verified — strong recognition
    if (value >= 50) return '#38E1FF'; // developing
    return '#FBBF24'; // needs review
}

function MasteryRow({
    category,
    index,
    onPress,
}: {
    category: MasteryCategory;
    index: number;
    onPress?: (c: MasteryCategory) => void;
}) {
    const color = masteryColor(category.mastery);
    const a11yLabel = `${category.label}: ${Math.round(category.mastery)} percent mastery`;

    const inner = (
        <>
            <View style={styles.masteryLabelRow}>
                <Text style={styles.masteryLabel}>{category.label}</Text>
                <Text style={[styles.masteryValue, { color }]}>{Math.round(category.mastery)}%</Text>
            </View>
            <ProgressTrack percent={category.mastery} color={color} delay={index * 90} height={8} />
        </>
    );

    if (onPress) {
        return (
            <Pressable
                style={styles.masteryRow}
                onPress={() => onPress(category)}
                accessibilityRole="button"
                accessibilityLabel={a11yLabel}
            >
                {inner}
            </Pressable>
        );
    }

    return (
        <View style={styles.masteryRow} accessible accessibilityLabel={a11yLabel}>
            {inner}
        </View>
    );
}

/* ------------------------------------------------------------------ */
/*  Module dots — five-step indicator                                   */
/* ------------------------------------------------------------------ */

function ModuleDots({ current, total }: { current: number; total: number }) {
    return (
        <View style={styles.dotsRow} accessible accessibilityLabel={`Module ${current} of ${total}`}>
            {Array.from({ length: total }).map((_, i) => {
                const stepNum = i + 1;
                const filled = stepNum < current;
                const active = stepNum === current;
                return <View key={stepNum} style={[styles.dot, filled && styles.dotFilled, active && styles.dotActive]} />;
            })}
        </View>
    );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function Progress({ onPressMastery, onBack }: ProgressProps) {
    const { rank, module, mastery } = SAMPLE_PROGRESS_DATA;
    const rankIndex = RANK_ORDER.indexOf(rank.currentRank);
    const nextRank = RANK_ORDER[rankIndex + 1];
    const isMaxRank = nextRank === undefined;
    const rankColor = RANK_STYLE[rank.currentRank].color;

    const rankPercent = useMemo(() => {
        if (isMaxRank) return 100;
        const total = rank.currentPoints + rank.pointsToNextRank;
        return total > 0 ? (rank.currentPoints / total) * 100 : 0;
    }, [rank, isMaxRank]);

    const rankCaption = isMaxRank ? 'Top clearance reached' : `${rank.pointsToNextRank} pts to ${nextRank}`;

    const isLastModule = module.currentModule >= module.totalModules;
    const moduleTotal = module.tasksCompleted + module.tasksToNextModule;

    const modulePercent = useMemo(() => {
        if (isLastModule && module.tasksToNextModule <= 0) return 100;
        return moduleTotal > 0 ? (module.tasksCompleted / moduleTotal) * 100 : 0;
    }, [isLastModule, module, moduleTotal]);

    const taskWord = module.tasksToNextModule === 1 ? 'task' : 'tasks';
    const moduleCaption = isLastModule
        ? module.tasksToNextModule > 0
            ? `${module.tasksToNextModule} ${taskWord} left to finish training`
            : 'Final module — training complete'
        : `${module.tasksToNextModule} ${taskWord} to Module ${module.currentModule + 1}`;

    const moduleTitle = module.moduleTitle ?? MODULE_TITLES[module.currentModule] ?? 'Training Module';

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Pressable onPress={onBack} style={styles.backBtn} hitSlop={6}>
                <Text style={styles.backBtnText}>‹ Dashboard</Text>
            </Pressable>

            <Text style={styles.screenTitle}>Your Progress</Text>
            <Text style={styles.screenSubtitle}>Track your social engineering defense skills</Text>

            {/* RANK CARD */}
            <View style={styles.card}>
                <View style={styles.rankRow}>
                    <RankBadge rank={rank.currentRank} />
                    <View style={styles.rankInfo}>
                        <Text style={styles.cardEyebrow}>CURRENT RANK</Text>
                        <Text style={[styles.rankName, { color: rankColor }]}>{rank.currentRank}</Text>
                        <Text style={styles.cardCaption}>{rankCaption}</Text>
                    </View>
                </View>
                <ProgressTrack percent={rankPercent} color={rankColor} />
            </View>

            {/* MODULE CARD */}
            <View style={styles.card}>
                <Text style={styles.cardEyebrow}>
                    MODULE {module.currentModule} OF {module.totalModules}
                </Text>
                <Text style={styles.cardTitle}>{moduleTitle}</Text>
                <ModuleDots current={module.currentModule} total={module.totalModules} />
                <Text style={styles.cardCaption}>{moduleCaption}</Text>
                <ProgressTrack percent={modulePercent} color="#38E1FF" />
            </View>

            {/* MASTERY GRAPH */}
            <View style={styles.card}>
                <Text style={styles.cardEyebrow}>MASTERY BREAKDOWN</Text>
                <Text style={styles.cardTitle}>Threat Recognition Skills</Text>
                <View style={styles.masteryList}>
                    {mastery.map((cat, i) => (
                        <MasteryRow key={cat.id} category={cat} index={i} onPress={onPressMastery} />
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                               */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#0A0F1E' },
    content: { padding: 20, paddingBottom: 48 },

    screenTitle: { color: '#EAF2FF', fontSize: 26, fontWeight: '700', letterSpacing: 0.2 },
    screenSubtitle: { color: '#8CA0C4', fontSize: 13, marginTop: 4, marginBottom: 20 },

    card: {
        backgroundColor: '#121A2E',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#22304F',
        padding: 18,
        marginBottom: 16,
    },

    cardEyebrow: { color: '#5E78A8', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
    cardTitle: { color: '#EAF2FF', fontSize: 16, fontWeight: '600', marginTop: 4, marginBottom: 12 },
    cardCaption: { color: '#8CA0C4', fontSize: 12, marginBottom: 10 },

    rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    rankInfo: { marginLeft: 16, flex: 1 },
    rankName: { fontSize: 22, fontWeight: '800', marginTop: 2 },

    badgeWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
    badgeGlow: { position: 'absolute', width: 64, height: 64, borderRadius: 32 },
    badgeRing: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeCore: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    badgeInitial: { color: '#0A0F1E', fontSize: 18, fontWeight: '800' },

    tick: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5 },
    tickTop: { top: 2, left: 30.5 },
    tickBottom: { bottom: 2, left: 30.5 },
    tickLeft: { left: 2, top: 30.5 },
    tickRight: { right: 2, top: 30.5 },

    track: { width: '100%', backgroundColor: '#1B2740', borderRadius: 6, overflow: 'hidden' },
    trackFill: { borderRadius: 6 },

    dotsRow: { flexDirection: 'row', marginBottom: 10 },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#1B2740',
        borderWidth: 1,
        borderColor: '#22304F',
        marginRight: 8,
    },
    dotFilled: { backgroundColor: '#38E1FF', borderColor: '#38E1FF' },
    dotActive: { backgroundColor: '#0A0F1E', borderColor: '#38E1FF', borderWidth: 2 },

    masteryList: { marginTop: 4 },
    masteryRow: { marginBottom: 14 },
    masteryLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    masteryLabel: { color: '#C7D4EC', fontSize: 13, fontWeight: '500' },
    masteryValue: { fontSize: 13, fontWeight: '700' },
    backBtn: {
        alignSelf: 'flex-start',
        backgroundColor: '#12181F',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        marginBottom: 12,
    },
    backBtnText: {
        color: '#9BAAB8',
        fontSize: 11,
        fontWeight: '800',
    },
});