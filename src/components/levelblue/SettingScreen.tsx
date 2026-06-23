import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

// ─── colour tokens (mirrors DashboardScreen / Progress) ──────────────────────
const C = {
    bg:           '#070F1A',
    surface:      '#0D1B2A',
    surfaceMid:   '#091624',
    border:       '#0E2030',
    borderBright: '#1B3A5C',
    gold:         '#F2B94B',
    goldDim:      '#A87620',
    goldGlow:     '#F2B94B22',
    cyan:         '#3ECFCF',
    cyanDim:      '#1A7A7A',
    circuit:      '#1FD8E8',
    green:        '#34D399',
    greenDim:     '#0C3D27',
    red:          '#EF4444',
    redDim:       '#3B0F0F',
    textPrimary:  '#F0EDE6',
    textMuted:    '#7A9AB8',
    textDim:      '#3D5A72',
};

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface SettingsProps {
    onBack: () => void;
}

/* ------------------------------------------------------------------ */
/*  ToggleRow — custom HUD-style switch                                 */
/* ------------------------------------------------------------------ */

function ToggleRow({
    label,
    description,
    value,
    onToggle,
    disabled = false,
}: {
    label: string;
    description?: string;
    value: boolean;
    onToggle: () => void;
    disabled?: boolean;
}) {
    return (
        <Pressable
            style={[tog.row, disabled && tog.rowDisabled]}
            onPress={disabled ? undefined : onToggle}
            accessibilityRole="switch"
            accessibilityState={{ checked: value, disabled }}
            accessibilityLabel={label}
        >
            <View style={tog.textGroup}>
                <Text style={[tog.label, disabled && tog.labelDim]}>{label}</Text>
                {description ? (
                    <Text style={tog.desc}>{description}</Text>
                ) : null}
            </View>
            {/* custom pill toggle */}
            <View style={[tog.track, value && tog.trackOn, disabled && tog.trackDisabled]}>
                <View style={[tog.thumb, value && tog.thumbOn]} />
            </View>
        </Pressable>
    );
}

const tog = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    rowDisabled: { opacity: 0.45 },
    textGroup: { flex: 1, gap: 2 },
    label: {
        color: C.textPrimary,
        fontSize: 13,
        fontWeight: '700',
    },
    labelDim: { color: C.textMuted },
    desc: {
        color: C.textDim,
        fontSize: 11,
        fontWeight: '500',
    },
    // pill track
    track: {
        width: 40,
        height: 22,
        borderRadius: 11,
        backgroundColor: C.surfaceMid,
        borderWidth: 1,
        borderColor: C.borderBright,
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    trackOn: {
        backgroundColor: C.cyanDim,
        borderColor: C.circuit,
    },
    trackDisabled: {
        borderColor: C.border,
    },
    // sliding thumb
    thumb: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: C.textDim,
        alignSelf: 'flex-start',
    },
    thumbOn: {
        backgroundColor: C.circuit,
        alignSelf: 'flex-end',
    },
});

/* ------------------------------------------------------------------ */
/*  InfoRow — static key / value display                               */
/* ------------------------------------------------------------------ */

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <View style={ir.row}>
            <Text style={ir.label}>{label}</Text>
            <Text style={[ir.value, accent ? { color: accent } : null]}>{value}</Text>
        </View>
    );
}

const ir = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 11,
    },
    label: {
        color: C.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    value: {
        color: C.textPrimary,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});

/* ------------------------------------------------------------------ */
/*  Section card                                                        */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={sec.card}>
            <Text style={sec.eyebrow}>{title}</Text>
            {children}
        </View>
    );
}

const sec = StyleSheet.create({
    card: {
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 4,
        marginBottom: 14,
    },
    eyebrow: {
        color: C.textDim,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        marginBottom: 2,
        paddingTop: 4,
    },
});

/* ------------------------------------------------------------------ */
/*  Divider                                                             */
/* ------------------------------------------------------------------ */

function Divider() {
    return <View style={{ height: 1, backgroundColor: C.border }} />;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function SettingsScreen({ onBack }: SettingsProps) {
    // ── toggle state ──
    const [soundEffects, setSoundEffects]   = useState(true);
    const [music, setMusic]                 = useState(false);
    const [haptics, setHaptics]             = useState(true);
    const [showHints, setShowHints]         = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [highContrast, setHighContrast]   = useState(false);

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* back button — matches Progress.tsx pattern */}
            <Pressable onPress={onBack} style={styles.backBtn} hitSlop={6}>
                <Text style={styles.backBtnText}>‹ Dashboard</Text>
            </Pressable>

            <Text style={styles.screenTitle}>Settings</Text>
            <Text style={styles.screenSubtitle}>Configure your training environment</Text>

            {/* ── AUDIO ── */}
            <Section title="Audio">
                <ToggleRow
                    label="Sound Effects"
                    description="Play audio cues during matches"
                    value={soundEffects}
                    onToggle={() => setSoundEffects(v => !v)}
                />
                <Divider />
                <ToggleRow
                    label="Background Music"
                    description="Ambient soundtrack during gameplay"
                    value={music}
                    onToggle={() => setMusic(v => !v)}
                />
            </Section>

            {/* ── GAMEPLAY ── */}
            <Section title="Gameplay">
                <ToggleRow
                    label="Haptic Feedback"
                    description="Vibration on button presses"
                    value={haptics}
                    onToggle={() => setHaptics(v => !v)}
                />
                <Divider />
                <ToggleRow
                    label="Show Hints"
                    description="Display tips before each question"
                    value={showHints}
                    onToggle={() => setShowHints(v => !v)}
                />
            </Section>

            {/* ── DISPLAY ── */}
            <Section title="Display">
                <ToggleRow
                    label="Dark Mode"
                    description="Always enabled for this app"
                    value={true}
                    onToggle={() => {}}
                    disabled
                />
                <Divider />
                <ToggleRow
                    label="High Contrast"
                    description="Increase colour contrast for readability"
                    value={highContrast}
                    onToggle={() => setHighContrast(v => !v)}
                />
            </Section>

            {/* ── NOTIFICATIONS ── */}
            <Section title="Notifications">
                <ToggleRow
                    label="Push Notifications"
                    description="Alerts for new missions and rank changes"
                    value={notifications}
                    onToggle={() => setNotifications(v => !v)}
                />
            </Section>

            {/* ── ACCOUNT ── */}
            <Section title="Account">
                <InfoRow label="Student ID"  value="STU-20241A" />
                <Divider />
                <InfoRow label="Class"       value="CYBER SAFETY 1A" />
                <Divider />
                <InfoRow label="Role"        value="STUDENT" />
                <Divider />
                <InfoRow label="Status"      value="ACTIVE" accent={C.green} />
            </Section>

            {/* ── DATA ── */}
            <Section title="Data">
                <View style={styles.dangerRow}>
                    <View style={styles.dangerText}>
                        <Text style={styles.dangerLabel}>Reset Progress</Text>
                        <Text style={styles.dangerDesc}>
                            Clears all XP, wins, and mission history. This cannot be undone.
                        </Text>
                    </View>
                    <Pressable style={styles.dangerBtn}>
                        <Text style={styles.dangerBtnText}>RESET</Text>
                    </Pressable>
                </View>
            </Section>

            {/* ── ABOUT ── */}
            <Section title="About">
                <InfoRow label="App"         value="LevelBlue EDU" />
                <Divider />
                <InfoRow label="Version"     value="1.0.0" />
                <Divider />
                <InfoRow label="Build"       value="2024.12.A" />
                <Divider />
                <InfoRow label="Platform"    value="React Native / Expo" />
            </Section>
        </ScrollView>
    );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                               */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: C.bg,
    },
    content: {
        padding: 20,
        paddingBottom: 48,
    },

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

    screenTitle: {
        color: C.textPrimary,
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    screenSubtitle: {
        color: C.textMuted,
        fontSize: 13,
        marginTop: 4,
        marginBottom: 20,
    },

    // danger / reset row
    dangerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    dangerText: {
        flex: 1,
        gap: 3,
    },
    dangerLabel: {
        color: C.red,
        fontSize: 13,
        fontWeight: '700',
    },
    dangerDesc: {
        color: C.textDim,
        fontSize: 11,
        fontWeight: '500',
        lineHeight: 15,
    },
    dangerBtn: {
        backgroundColor: C.redDim,
        borderWidth: 1,
        borderColor: '#7A1F1F',
        borderRadius: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    dangerBtnText: {
        color: C.red,
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
});