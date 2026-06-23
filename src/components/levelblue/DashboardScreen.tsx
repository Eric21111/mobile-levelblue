import { ReactNode, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

import { MatchResult, Student } from './types';

// ─── colour tokens ───────────────────────────────────────────────────────────
const C = {
  // backgrounds
  bg: '#070F1A',   // near-black base — darker than before
  surface: '#0D1B2A',   // card surface
  surfaceRaised: '#112234',   // elevated card
  surfaceMid: '#091624',   // inset / track
  border: '#0E2030',
  borderBright: '#1B3A5C',

  // brand
  gold: '#F2B94B',
  goldDim: '#A87620',
  goldGlow: '#F2B94B22',
  cyan: '#3ECFCF',
  cyanDim: '#1A7A7A',
  purple: '#8B5CF6',

  // status
  green: '#34D399',
  greenDim: '#0C3D27',
  red: '#EF4444',
  redDim: '#3B0F0F',
  redBright: '#FF6B6B',
  amber: '#FBBF24',

  // text
  textPrimary: '#F0EDE6',
  textMuted: '#7A9AB8',
  textDim: '#3D5A72',

  // bars
  barRed: '#DC2626',
  barAmber: '#D97706',
  barGreen: '#059669',

  live: '#FF3B3B',

  // console / progress accents
  glowGold: '#F2B94B33',
  glowCyan: '#3ECFCF22',
  tierLocked: '#1B2E40',
  circuit: '#1FD8E8',   // bright cyan used for HUD icon line-art + progress bar
  circuitDim: '#1FD8E855',
};

function barColor(acc: number): string {
  if (acc >= 0.9) return C.barGreen;
  if (acc >= 0.7) return C.barAmber;
  return C.barRed;
}

// ─── XP Arc (decorative semicircle progress ring) ────────────────────────────
// Pure View-based — no SVG dependency needed in RN

function XpRing({ pct }: { pct: number }) {
  // We fake an arc with two rotated containers and a clip trick
  // Simple approach: two half-circle borders
  const SIZE = 56;
  const clampPct = Math.max(0, Math.min(100, pct));

  return (
    <View style={[xr.outer, { width: SIZE, height: SIZE }]}>
      {/* background ring */}
      <View style={[xr.ringBg, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]} />
      {/* fill — approximate with border-color segments */}
      <View style={[xr.ringFill, {
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        borderColor: clampPct > 0 ? C.gold : 'transparent',
      }]} />
      {/* center number */}
      <View style={xr.center}>
        <Text style={xr.pctText}>{Math.round(clampPct)}%</Text>
        <Text style={xr.pctLabel}>XP</Text>
      </View>
    </View>
  );
}

const xr = StyleSheet.create({
  outer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringBg: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: C.surfaceMid,
  },
  ringFill: {
    position: 'absolute',
    borderWidth: 4,
    borderTopColor: C.gold,
    borderRightColor: C.gold,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  center: { alignItems: 'center' },
  pctText: { color: C.gold, fontSize: 11, fontWeight: '900', lineHeight: 13 },
  pctLabel: { color: C.textDim, fontSize: 7, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
});

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: string }) {
  return (
    <View style={rb.wrap}>
      <Text style={rb.star}>★</Text>
      <Text style={rb.text}>{rank}</Text>
    </View>
  );
}

const rb = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.goldGlow,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.goldDim,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  star: { color: C.gold, fontSize: 10 },
  text: { color: C.gold, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
});

// ─── Stat Tile ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  delta,
  accent = C.gold,
}: {
  label: string;
  value: string | number;
  delta?: string;
  accent?: string;
}) {
  return (
    <View style={st.tile}>
      <Text style={[st.value, { color: accent }]}>{value}</Text>
      <Text style={st.label}>{label}</Text>
      {delta ? <Text style={st.delta}>▲ {delta}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: C.surfaceMid,
    borderWidth: 1,
    borderColor: C.border,
    gap: 1,
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  label: {
    color: C.textDim,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  delta: {
    color: C.green,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
});

// ─── Accuracy Chart — fills remaining left column ─────────────────────────────

const LABELS = ['M1', 'M2', 'M3', 'M4', 'M5'];

function IntelChart({ accuracies }: { accuracies: number[] }) {
  const data: (number | null)[] = [...accuracies];
  while (data.length < 5) data.push(null);

  return (
    <View style={ic.wrap}>
      {/* header */}
      <View style={ic.header}>
        <View style={ic.titleGroup}>
          <View style={ic.intelDot} />
          <Text style={ic.title}>THREAT ACCURACY — LAST 5 MISSIONS</Text>
        </View>
        <Text style={ic.thresholdLabel}>70% PASS LINE</Text>
      </View>

      {/* chart grid + bars */}
      <View style={ic.chartBody}>
        {/* Y axis */}
        <View style={ic.yAxis}>
          {['100', '75', '50', '25', '0'].map(t => (
            <Text key={t} style={ic.yLabel}>{t}</Text>
          ))}
        </View>

        {/* bars relative area */}
        <View style={ic.barField}>
          {/* 70% line */}
          <View style={ic.passLine} />
          {/* horizontal grid lines at 25, 50, 75 */}
          {[0.75, 0.5, 0.25].map(pct => (
            <View key={pct} style={[ic.gridLine, { bottom: `${pct * 100}%` }]} />
          ))}

          {/* bars */}
          <View style={ic.barsRow}>
            {data.map((val, i) => {
              const filled = val !== null;
              const color = filled ? barColor(val!) : C.surfaceMid;
              const h = filled ? `${val! * 100}%` : '0%';
              const isPassing = filled && val! >= 0.7;
              return (
                <View key={i} style={ic.barWrap}>
                  {/* value label on top */}
                  {filled ? (
                    <Text style={[ic.barValue, { color: isPassing ? C.green : C.red }]}>
                      {Math.round(val! * 100)}
                    </Text>
                  ) : null}
                  <View style={ic.barTrack}>
                    <View style={[ic.barFill, { height: h, backgroundColor: color }]} />
                  </View>
                  <Text style={ic.barLabel}>{LABELS[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const ic = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  intelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.cyan,
  },
  title: {
    color: C.textDim,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  thresholdLabel: {
    color: C.cyanDim,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chartBody: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  yAxis: {
    width: 24,
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  yLabel: {
    color: C.textDim,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'right',
  },
  barField: {
    flex: 1,
    position: 'relative',
  },
  passLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '34%',   // ≈ 70% of bar track (bars + label area)
    height: 1,
    backgroundColor: C.cyanDim,
    zIndex: 3,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: C.border,
    zIndex: 1,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    paddingBottom: 18,  // space for x labels
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 8,
    fontWeight: '900',
  },
  barTrack: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
    minHeight: 2,
  },
  barLabel: {
    color: C.textDim,
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});

// ─── Objective Row ────────────────────────────────────────────────────────────

function ObjRow({ done, label, isNext }: { done: boolean; label: string; isNext?: boolean }) {
  return (
    <View style={[or.row, isNext && or.rowNext]}>
      <View style={[or.box, done && or.boxDone, isNext && or.boxNext]}>
        {done ? (
          <Text style={or.tick}>✓</Text>
        ) : isNext ? (
          <Text style={or.arrow}>›</Text>
        ) : null}
      </View>
      <Text style={[
        or.label,
        done && or.labelDone,
        isNext && or.labelNext,
      ]}>
        {label}
      </Text>
      {isNext && <View style={or.nextTag}><Text style={or.nextTagText}>NEXT</Text></View>}
    </View>
  );
}

const or = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  rowNext: {
    backgroundColor: '#1A2C1A',
    borderWidth: 1,
    borderColor: '#2A4A2A',
  },
  box: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: C.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  boxDone: {
    backgroundColor: C.greenDim,
    borderColor: C.green,
  },
  boxNext: {
    borderColor: C.green,
  },
  tick: { color: C.green, fontSize: 10, fontWeight: '900' },
  arrow: { color: C.green, fontSize: 12, fontWeight: '900' },
  label: {
    flex: 1,
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  labelDone: {
    color: C.textDim,
    textDecorationLine: 'line-through',
  },
  labelNext: {
    color: C.textPrimary,
    fontWeight: '800',
  },
  nextTag: {
    backgroundColor: '#0C3D27',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#1A6B45',
  },
  nextTagText: {
    color: C.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

// ─── Live Threat Pill ─────────────────────────────────────────────────────────

function LivePill() {
  return (
    <View style={lp.wrap}>
      <View style={lp.dot} />
      <Text style={lp.text}>LIVE</Text>
    </View>
  );
}

const lp = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.redDim,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#7A1F1F',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.live,
  },
  text: {
    color: C.live,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

// ─── Threat Level Meter ───────────────────────────────────────────────────────
// Shows how urgent the mission is — purely decorative but creates tension

function ThreatMeter({ level = 3, max = 5 }: { level?: number; max?: number }) {
  return (
    <View style={tm.wrap}>
      <Text style={tm.label}>THREAT LEVEL</Text>
      <View style={tm.bars}>
        {Array.from({ length: max }, (_, i) => (
          <View
            key={i}
            style={[
              tm.bar,
              {
                backgroundColor: i < level
                  ? (i < 2 ? C.amber : i < 4 ? C.red : C.live)
                  : C.surfaceMid,
                opacity: i < level ? 1 : 0.3,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const tm = StyleSheet.create({
  wrap: { gap: 4 },
  label: {
    color: C.textDim,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bars: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'flex-end',
  },
  bar: {
    width: 6,
    borderRadius: 2,
    height: 14,
  },
});


const tb = StyleSheet.create({
  wrap: { gap: 0 },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  chip: {
    backgroundColor: '#12181F',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 78,
    justifyContent: 'center',
  },
  chipPlus: {
    position: 'absolute',
    top: 6,
    left: 6,
    color: C.gold,
    fontSize: 12,
    fontWeight: '900',
  },
  chipNum: { color: '#F0EDE6', fontSize: 30, fontWeight: '900', lineHeight: 32 },
  chipSub: { color: '#5B6573', fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  labelPanel: {
    flex: 1,
    backgroundColor: '#E7E9EC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 3,
  },
  labelTitle: { color: '#10161D', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  currentTag: {
    backgroundColor: '#10161D',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  currentTagText: { color: '#F0EDE6', fontSize: 9, fontWeight: '800' },
  labelSub: { color: '#5B6573', fontSize: 10, fontWeight: '700' },
  progressTrack: {
    height: 3,
    backgroundColor: '#1B2530',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E8761E',
  },
});

// ─── Streak Flame Row — visual streak meter instead of plain text ────────────

function StreakFlameRow({ streak, max = 5 }: { streak: number; max?: number }) {
  return (
    <View style={sf.wrap}>
      {Array.from({ length: max }, (_, i) => {
        const lit = i < streak;
        return (
          <View key={i} style={[sf.pip, lit && sf.pipLit]}>
            <Text style={[sf.flame, { opacity: lit ? 1 : 0.25 }]}>🔥</Text>
          </View>
        );
      })}
    </View>
  );
}

const sf = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 4 },
  pip: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: C.surfaceMid,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipLit: {
    backgroundColor: '#2A1A05',
    borderColor: C.goldDim,
  },
  flame: { fontSize: 11 },
});

// ─── HUD Icon Set — cyan circuit-line glyphs for the console cards ───────────
// Built with react-native-svg to match the reference's line-art style:
// thin strokes, small circuit "nodes" branching off the main shape.

function IconDeployBadge({ size = 56, color = C.circuit }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* hexagon frame */}
      <Path
        d="M32 4 L56 18 V46 L32 60 L8 46 V18 Z"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
      />
      {/* up-arrow */}
      <Path
        d="M32 22 L44 36 H36 V44 H28 V36 H20 Z"
        fill={color}
      />
      {/* circuit nodes branching off the hexagon */}
      <Line x1="8" y1="18" x2="0" y2="14" stroke={color} strokeWidth={1.5} />
      <Circle cx="0" cy="14" r="2" fill={color} />
      <Line x1="56" y1="18" x2="64" y2="14" stroke={color} strokeWidth={1.5} />
      <Circle cx="64" cy="14" r="2" fill={color} />
      <Line x1="32" y1="60" x2="32" y2="64" stroke={color} strokeWidth={1.5} />
      <Circle cx="32" cy="64" r="2" fill={color} />
    </Svg>
  );
}

function IconInfoNode({ size = 40, color = C.circuit }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect x="14" y="14" width="20" height="20" rx="2" stroke={color} strokeWidth={2.2} fill="none" />
      <Circle cx="24" cy="19.5" r="1.6" fill={color} />
      <Line x1="24" y1="23" x2="24" y2="30" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      {/* circuit branches */}
      <Line x1="14" y1="20" x2="6" y2="20" stroke={color} strokeWidth={1.4} />
      <Circle cx="6" cy="20" r="1.8" fill={color} />
      <Line x1="34" y1="28" x2="42" y2="28" stroke={color} strokeWidth={1.4} />
      <Circle cx="42" cy="28" r="1.8" fill={color} />
      <Line x1="20" y1="34" x2="20" y2="42" stroke={color} strokeWidth={1.4} />
      <Circle cx="20" cy="42" r="1.8" fill={color} />
    </Svg>
  );
}

function IconProgressNode({ size = 40, color = C.circuit }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Line x1="10" y1="38" x2="10" y2="10" stroke={color} strokeWidth={1.6} />
      <Line x1="10" y1="38" x2="40" y2="38" stroke={color} strokeWidth={1.6} />
      <Polyline
        points="12,32 20,24 27,28 38,14"
        stroke={color}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="32" r="2" fill={color} />
      <Circle cx="20" cy="24" r="2" fill={color} />
      <Circle cx="27" cy="28" r="2" fill={color} />
      <Circle cx="38" cy="14" r="2.4" fill={color} />
    </Svg>
  );
}

function IconPower({ size = 40, color = C.circuit }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M24 10 V24"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <Path
        d="M15 16 A13 13 0 1 0 33 16"
        stroke={color}
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconGear({ size = 40, color = '#5A6675' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M24 8 L40 24 L24 40 L8 24 Z"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Circle cx="24" cy="24" r="3" fill={color} />
    </Svg>
  );
}


function HudCard({
  label,
  icon,
  onPress,
  flex = 1,
  locked = false,
}: {
  label?: string;
  icon: ReactNode;
  onPress?: () => void;
  flex?: number;
  locked?: boolean;
}) {
  if (locked) {
    return (
      <View style={[hc.card, hc.cardLocked, { flex }]}>
        {icon}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={[hc.card, { flex }]}
      hitSlop={6}
    >
      {icon}
      {label ? <Text style={hc.label}>{label}</Text> : null}
    </Pressable>
  );
}

const hc = StyleSheet.create({
  card: {
    backgroundColor: '#101820',
    borderWidth: 1,
    borderColor: '#1E2A36',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  cardLocked: {
    backgroundColor: '#0B1118',
    opacity: 0.5,
  },
  label: {
    color: '#E7ECF0',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// ─── Deploy Hero — full-width card with top progress bar, mirrors reference ──

function DeployHero({ pct, onPress }: { pct: number; onPress: () => void }) {
  const clamp = Math.max(0, Math.min(100, pct));
  return (
    <Pressable onPress={onPress} style={dh.card} hitSlop={6}>
      {/* thin progress bar along the very top edge */}
      <View style={dh.progressTrack}>
        <View style={[dh.progressFill, { width: `${clamp}%` }]} />
      </View>
      <View style={dh.row}>
        <IconDeployBadge size={48} />
        <Text style={dh.label}>DEPLOY</Text>
      </View>
      {/* faint watermark glyph, bottom right */}
      <Text style={dh.watermark}>▲</Text>
    </Pressable>
  );
}

const dh = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#101820',
    borderWidth: 1,
    borderColor: '#1E2A36',
    paddingVertical: 18,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#1E2A36',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.circuit,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  label: {
    color: '#F0F4F6',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1,
  },
  watermark: {
    position: 'absolute',
    right: 10,
    bottom: -6,
    fontSize: 56,
    color: '#FFFFFF0A',
    fontWeight: '900',
  },
});

// ─── System Log Strip — small status readout, bottom-right of console ────────

function SystemLogStrip() {
  return (
    <View style={sl.wrap}>
      <Text style={sl.line}>
        <Text style={sl.dim}>&gt; SysLog: Threat Level: </Text>
        <Text style={sl.ok}>MINIMAL</Text>
      </Text>
      <Text style={sl.line}>
        <Text style={sl.dim}>&gt; Network: </Text>
        <Text style={sl.ok}>ENCRYPTED</Text>
      </Text>
      <Text style={sl.line}>
        <Text style={sl.dim}>&gt; Data Packets: </Text>
        <Text style={sl.ok}>[OK]</Text>
      </Text>
    </View>
  );
}

const sl = StyleSheet.create({
  wrap: { alignItems: 'flex-end', gap: 2 },
  line: { fontSize: 10, fontWeight: '700' },
  dim: { color: '#5B6573' },
  ok: { color: '#3ECFCF' },
});

// ─── Op Card — Arknights-style sharp action block ─────────────────────────────
// Flat rectangular block, heavy condensed headline, small sub-label, a large
// faded watermark glyph bottom-right, and an optional accent underline.
// This is the building block for the whole right-side console.

type OpTone = 'light' | 'dark' | 'cyan' | 'danger';

function OpCard({
  title,
  subtitle,
  glyph,
  tone = 'light',
  accent,
  onPress,
  flexGrow = 1,
  big = false,
  minHeight,
  glyphSize = 64,
}: {
  title: string;
  subtitle?: string;
  glyph: string;
  tone?: OpTone;
  accent?: string;
  onPress: () => void;
  flexGrow?: number;
  big?: boolean;
  minHeight?: number;
  glyphSize?: number;
}) {
  const toneStyle =
    tone === 'dark' ? oc.toneDark :
      tone === 'cyan' ? oc.toneCyan :
        tone === 'danger' ? oc.toneDanger :
          oc.toneLight;

  const titleColor =
    tone === 'light' ? oc.titleDark :
      oc.titleLight;

  const subColor =
    tone === 'light' ? oc.subDark :
      oc.subLight;

  return (
    <Pressable
      onPress={onPress}
      style={[oc.card, toneStyle, { flexGrow }, minHeight ? { minHeight } : null]}
      hitSlop={6}
    >
      <Text style={[oc.glyph, { fontSize: glyphSize }]}>{glyph}</Text>
      <View style={oc.textBlock}>
        <Text style={[oc.title, titleColor, big && oc.titleBig]}>{title}</Text>
        {subtitle ? <Text style={[oc.sub, subColor]}>{subtitle}</Text> : null}
      </View>
      {accent ? <View style={[oc.accentBar, { backgroundColor: accent }]} /> : null}
    </Pressable>
  );
}

const oc = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'flex-end',
    minHeight: 64,
  },
  toneLight: { backgroundColor: '#E7E9EC' },
  toneDark: { backgroundColor: '#12181F' },
  toneCyan: { backgroundColor: C.cyan },
  toneDanger: { backgroundColor: '#1A0E0E' },

  glyph: {
    position: 'absolute',
    right: -6,
    bottom: -14,
    fontSize: 64,
    color: '#00000014',
    fontWeight: '900',
  },

  textBlock: { gap: 1 },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  titleBig: { fontSize: 26 },
  titleDark: { color: '#10161D' },
  titleLight: { color: '#F0EDE6' },

  sub: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  subDark: { color: '#5B6573' },
  subLight: { color: '#9BAAB8' },

  accentBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    height: 3,
  },
});

// ─── Mastery Tier Track — chip row showing topic mastery, replaces dense bars ─
// Reuses the same accuracy data the bar chart used, but presents it as
// "levels cleared" chips, which reads as progression rather than a report card.

function MasteryTierTrack({ accuracies }: { accuracies: number[] }) {
  const data: (number | null)[] = [...accuracies];
  while (data.length < 5) data.push(null);
  const cleared = data.filter(v => v !== null && v >= 0.7).length;

  return (
    <View style={mt.wrap}>
      <View style={mt.header}>
        <Text style={mt.title}>MISSION MASTERY</Text>
        <Text style={mt.count}>{cleared}/{data.filter(v => v !== null).length} cleared</Text>
      </View>
      <View style={mt.row}>
        {data.map((val, i) => {
          const filled = val !== null;
          const passed = filled && val! >= 0.7;
          const color = !filled ? C.tierLocked : passed ? C.green : C.red;
          return (
            <View key={i} style={mt.chipWrap}>
              <View style={[
                mt.chip,
                { borderColor: color },
                passed && { backgroundColor: C.greenDim },
                filled && !passed && { backgroundColor: C.redDim },
              ]}>
                <Text style={[mt.chipText, { color: filled ? color : C.textDim }]}>
                  {filled ? `${Math.round(val! * 100)}` : '—'}
                </Text>
              </View>
              <Text style={mt.chipLabel}>{LABELS[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const mt = StyleSheet.create({
  wrap: { gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: {
    color: C.textDim,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  count: { color: C.cyan, fontSize: 9, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8 },
  chipWrap: { alignItems: 'center', gap: 4 },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceMid,
  },
  chipText: { fontSize: 12, fontWeight: '900' },
  chipLabel: { color: C.textDim, fontSize: 8, fontWeight: '800' },
});

// ─── Last Match Result Strip ──────────────────────────────────────────────────

function MatchResultStrip({ result }: { result: MatchResult }) {
  const won = result.won;
  return (
    <View style={[mr.wrap, won ? mr.wrapWin : mr.wrapLoss]}>
      <View style={mr.statusBlock}>
        <Text style={[mr.status, won ? mr.statusWin : mr.statusLoss]}>
          {won ? '⬛ MISSION COMPLETE' : '⬛ BASE BREACHED'}
        </Text>
      </View>
      <View style={mr.stats}>
        <View style={mr.stat}>
          <Text style={mr.statVal}>{result.correct}/{result.attempts}</Text>
          <Text style={mr.statLabel}>Accuracy</Text>
        </View>
        <View style={mr.statDivider} />
        <View style={mr.stat}>
          <Text style={[mr.statVal, { color: C.gold }]}>+{result.rankGain}</Text>
          <Text style={mr.statLabel}>XP gained</Text>
        </View>
      </View>
    </View>
  );
}

const mr = StyleSheet.create({
  wrap: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
    gap: 6,
  },
  wrapWin: {
    backgroundColor: '#0A2418',
    borderColor: '#1B4A30',
  },
  wrapLoss: {
    backgroundColor: '#200A0A',
    borderColor: '#4A1515',
  },
  statusBlock: {},
  status: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusWin: { color: C.green },
  statusLoss: { color: C.red },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stat: { gap: 1 },
  statVal: { color: C.textPrimary, fontSize: 14, fontWeight: '900' },
  statLabel: { color: C.textDim, fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 24, backgroundColor: C.border },
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Objective = { label: string; done: boolean };

type Props = {
  student: Student;
  lastResult: MatchResult | null;
  recentAccuracies?: number[];
  objectives?: Objective[];
  threatLevel?: number;
  onBestiary: () => void;
  onProgress: () => void;
  onLogout: () => void;
  onPlay: () => void;
  onSettings?: () => void;
};

const DEFAULT_ACCURACIES = [0.38, 0.55, 0.72, 0.5, 0.81];
const DEFAULT_OBJECTIVES: Objective[] = [
  { label: 'Complete 5 matches', done: true },
  { label: 'Score 70%+ accuracy once', done: true },
  { label: 'Reach a 5-match win streak', done: false },
  { label: 'Hit 90%+ accuracy in a single match', done: false },
];

// ─── DashboardScreen ──────────────────────────────────────────────────────────

export function DashboardScreen({
  student,
  lastResult,
  recentAccuracies = DEFAULT_ACCURACIES,
  objectives = DEFAULT_OBJECTIVES,
  threatLevel = 3,
  onBestiary,
  onProgress,
  onLogout,
  onPlay,
  onSettings = () => { },
}: Props) {
  const nextRank = student.rankPoints >= 650 ? 900 : 650;
  const xpPct = Math.min(100, (student.rankPoints / nextRank) * 100);
  const xpDelta = lastResult ? `+${lastResult.rankGain} today` : undefined;
  const winDelta = lastResult?.won ? '+1 today' : undefined;

  const nextObjIdx = objectives.findIndex(o => !o.done);
  const nextRankTitle = student.rankPoints >= 650 ? 'Silver Defender' : 'Bronze Defender';

  // ── briefing reveal state ──
  // Deploy button reveals the mission briefing + the Play action below it.
  // Collapsing back to the console is available via the same Deploy button.
  const [briefingOpen, setBriefingOpen] = useState(false);
  const revealAnim = useRef(new Animated.Value(0)).current;

  function toggleBriefing() {
    const next = !briefingOpen;
    setBriefingOpen(next);
    Animated.timing(revealAnim, {
      toValue: next ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const briefingTranslateY = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return (
    <View style={s.shell}>

      {/* ══════════════════ LEFT COLUMN ══════════════════ */}
      <View style={s.leftCol}>

        {/* ── PLAYER CARD ── */}
        <View style={s.playerCard}>
          {/* avatar + name */}
          <View style={s.playerTop}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{student.avatar}</Text>
              </View>
              {/* subtle gold border glow indicator */}
              <View style={s.avatarRing} />
            </View>
            <View style={s.playerInfo}>
              <Text style={s.className}>{student.className}</Text>
              <Text style={s.playerName}>{student.name}</Text>
              <RankBadge rank={student.rankTitle} />
            </View>
            {/* XP ring on far right */}
            <View style={s.xpRingArea}>
              <XpRing pct={xpPct} />
              <Text style={s.xpRingLabel}>{student.rankPoints}/{nextRank}</Text>
            </View>
          </View>

          {/* ── STAT TILES ── */}
          <View style={s.statsRow}>
            <StatTile label="Rank XP" value={student.rankPoints} delta={xpDelta} accent={C.gold} />
            <StatTile label="Wins" value={student.wins} delta={winDelta} accent={C.cyan} />
            <View style={st.tile}>
              <StreakFlameRow streak={student.streak} />
              <Text style={st.label}>Streak</Text>
            </View>
          </View>
        </View>


        {/* ── MASTERY TIER TRACK ── */}
        <View style={s.masteryCard}>
          <MasteryTierTrack accuracies={recentAccuracies} />
        </View>

        {/* ── INTEL CHART ── */}
        <IntelChart accuracies={recentAccuracies} />

      </View>

      {/* thin separator */}
      <View style={s.sep} />

      {/* ══════════════════ RIGHT COLUMN ══════════════════ */}
      <View style={s.rightCol}>

        {!briefingOpen ? (
          /* ── COMMAND CONSOLE (default state) ── */
          <View style={s.console}>

            {/* Deploy — full-width hero card, thin cyan progress bar across the top */}
            <DeployHero pct={xpPct} onPress={toggleBriefing} />

            {/* 2x2 HUD grid — Info / Progress on top, a locked future-feature
                slot / Log Out on the bottom, icon-centered like the reference */}
            <View style={s.hudGrid}>
              <View style={s.hudCol}>
                <HudCard
                  label="Threat Log"
                  icon={<IconInfoNode />}
                  onPress={onBestiary}
                />
                <HudCard
                  label="Settings"
                  icon={<IconGear color={C.circuit} />}
                  onPress={onSettings}
                />
              </View>
              <View style={s.hudCol}>
                <HudCard
                  label="Progress"
                  icon={<IconProgressNode />}
                  onPress={onProgress}
                />
                <HudCard
                  label="Logout"
                  icon={<IconPower color={C.red} />}
                  onPress={onLogout}
                />
              </View>
            </View>
            {/* system log readout, bottom-right corner */}
            <SystemLogStrip />
          </View>
        ) : (
          /* ── MISSION BRIEFING (revealed after Deploy) ── */
          <Animated.View
            style={[
              s.briefingShell,
              { opacity: revealAnim, transform: [{ translateY: briefingTranslateY }] },
            ]}
          >
            <View style={s.missionCard}>

              {/* top bar: back control + LIVE + threat meter */}
              <View style={s.missionTopBar}>
                <View style={s.missionTopLeft}>
                  <Pressable onPress={toggleBriefing} style={s.backBtn} hitSlop={6}>
                    <Text style={s.backBtnText}>‹ Console</Text>
                  </Pressable>
                  <Text style={s.missionEyebrow}>◈ ACTIVE MISSION</Text>
                </View>
                <View style={s.missionTopRight}>
                  <ThreatMeter level={threatLevel} />
                  <LivePill />
                </View>
              </View>

              {/* mission title — the most dramatic element */}
              <View style={s.missionTitleBlock}>
                <Text style={s.missionTag}>MODULE 1</Text>
                <Text style={s.missionTitle}>Scam Defense{'\n'}Basics</Text>
                <Text style={s.missionSub}>
                  Intercept phishing attacks before they breach city infrastructure.
                </Text>
              </View>

              {/* XP bar — compact */}
              <View style={s.xpBarRow}>
                <View style={s.xpTrack}>
                  <View style={[s.xpFill, { width: `${xpPct}%` }]} />
                </View>
                <Text style={s.xpText}>{student.rankPoints}/{nextRank} XP</Text>
              </View>

              {/* divider */}
              <View style={s.divider} />

              {/* objectives */}
              <View style={s.objectives}>
                <Text style={s.objHeader}>MISSION OBJECTIVES</Text>
                {objectives.map((obj, i) => (
                  <ObjRow
                    key={i}
                    done={obj.done}
                    label={obj.label}
                    isNext={i === nextObjIdx}
                  />
                ))}
              </View>

              {/* last match result */}
              {lastResult ? (
                <>
                  <View style={s.divider} />
                  <MatchResultStrip result={lastResult} />
                </>
              ) : null}

            </View>

            {/* ── PLAY ACTION — launches the actual match (flat cyan block, same family as Deploy) ── */}
            <OpCard
              title="Play Match"
              subtitle="Launch this mission"
              glyph="▶"
              tone="cyan"
              big
              onPress={onPlay}
              flexGrow={0}
            />
          </Animated.View>
        )}

      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({

  // ── shell: landscape two-column ──
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: C.bg,
    padding: 12,
    gap: 0,
  },

  // ── LEFT ──
  leftCol: {
    flex: 1,
    flexDirection: 'column',
    gap: 10,
    paddingRight: 10,
  },

  // player card
  playerCard: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#1A1000', fontSize: 20, fontWeight: '900' },
  avatarRing: {
    position: 'absolute',
    inset: -3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.goldDim,
  },
  playerInfo: { flex: 1, gap: 3 },
  className: {
    color: C.textDim,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playerName: {
    color: C.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  xpRingArea: { alignItems: 'center', gap: 3 },
  xpRingLabel: { color: C.textDim, fontSize: 8, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 8 },

  // mastery tier track card
  masteryCard: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },

  // ── separator ──
  sep: {
    width: 1,
    backgroundColor: C.border,
    marginHorizontal: 2,
  },

  // ── RIGHT ──
  rightCol: {
    flex: 1,
    flexDirection: 'column',
    paddingLeft: 10,
    gap: 8,
  },

  // ── COMMAND CONSOLE (default right-side state) ──
  console: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  // absorbs any leftover vertical space below the composed block cluster,
  // keeping the Deploy hero + HUD grid anchored together near the top of
  // the panel instead of stretching apart to fill the column
  // 2x2 icon-centered grid — Info/Progress on top, Locked-slot/Logout below
  hudGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  // add this new style — each column stacks its cards vertically
  hudCol: {
    flex: 1,
    gap: 8,
  },
  // ── BRIEFING SHELL (revealed after tapping Deploy) ──
  briefingShell: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  missionTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    backgroundColor: '#12181F',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backBtnText: {
    color: '#9BAAB8',
    fontSize: 11,
    fontWeight: '800',
  },

  // mission card — flat block, sharp corners, thin accent line on top
  missionCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
    borderTopWidth: 3,
    borderTopColor: C.red,
  },

  missionTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionEyebrow: {
    color: C.textDim,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  missionTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  missionTitleBlock: { gap: 4 },
  missionTag: {
    color: C.cyan,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  missionTitle: {
    color: C.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  missionSub: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },

  xpBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpTrack: {
    flex: 1,
    height: 4,
    backgroundColor: C.surfaceMid,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#E8761E',
  },
  xpText: {
    color: C.textDim,
    fontSize: 9,
    fontWeight: '800',
    minWidth: 70,
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
  },

  objectives: { gap: 4 },
  objHeader: {
    color: C.textDim,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
});