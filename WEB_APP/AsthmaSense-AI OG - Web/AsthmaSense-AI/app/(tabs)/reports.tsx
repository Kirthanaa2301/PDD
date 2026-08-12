import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  LayoutAnimation,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop, Line, Text as SvgText, G } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, radius, typography } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useAuthStore, useSessionStore, useSymptomStore, useAnalysisStore } from '../../src/store';
import { API_BASE_URL } from '../../src/config/api';
import AudioPlaybackCard from '../../src/components/AudioPlaybackCard';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;

type TimelinePreset = '7d' | '14d' | '30d' | 'all' | 'custom';

function StatCard({ label, val, suffix, icon, color }: { label: string; val: number | string; suffix?: string; icon?: any; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[styles.statLabel, { color: colors.textSub }]}>{label}</Text>
        {icon && <Feather name={icon} size={14} color={color || colors.accent} />}
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>
        {val}
        {suffix ?? ''}
      </Text>
    </View>
  );
}

// ─── GRAPH 1: RESPIRATORY RISK AREA CHART ────────────────────────────────────
function RiskAreaChart({ reports }: { reports: any[] }) {
  const { colors } = useTheme();
  const height = 150;
  const maxVal = 100;
  const minVal = 0;

  const sortedReports = useMemo(() => {
    return [...reports].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reports]);

  const data = useMemo(() => {
    return sortedReports.map((r: any) => {
      if (r.riskLevel === 'High') return 85;
      if (r.riskLevel === 'Moderate') return 50;
      return 20;
    });
  }, [sortedReports]);

  const PADDING_LEFT = 45;
  const PADDING_RIGHT = 32;
  const PADDING_TOP = 15;
  const PADDING_BOTTOM = 25;

  const graphWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const graphHeight = height - PADDING_TOP - PADDING_BOTTOM;

  const points = useMemo(() => {
    return data.map((val, i) => {
      const x = PADDING_LEFT + (data.length === 1 ? graphWidth / 2 : (i / Math.max(1, data.length - 1)) * graphWidth);
      const y = PADDING_TOP + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
      return { x, y };
    });
  }, [data, graphWidth, graphHeight]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${PADDING_LEFT} ${points[0].y} L ${PADDING_LEFT + graphWidth} ${points[0].y}`;
    }
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points, graphWidth]);

  const areaPathD = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = PADDING_TOP + graphHeight;
    if (points.length === 1) {
      return `M ${PADDING_LEFT} ${points[0].y} L ${PADDING_LEFT + graphWidth} ${points[0].y} L ${PADDING_LEFT + graphWidth} ${bottomY} L ${PADDING_LEFT} ${bottomY} Z`;
    }
    return `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [points, pathD, graphHeight]);

  if (reports.length === 0) {
    return (
      <View style={[styles.chartContainerEmpty, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}>
        <Feather name="bar-chart-2" size={24} color={colors.accent} style={{ marginBottom: 6 }} />
        <Text style={[styles.chartOverlayText, { color: colors.textSub }]}>No audio analyses in this timeline</Text>
      </View>
    );
  }

  const yHigh = PADDING_TOP + graphHeight - ((85 - minVal) / (maxVal - minVal)) * graphHeight;
  const yMod = PADDING_TOP + graphHeight - ((50 - minVal) / (maxVal - minVal)) * graphHeight;
  const yLow = PADDING_TOP + graphHeight - ((20 - minVal) / (maxVal - minVal)) * graphHeight;

  return (
    <View style={{ height: height + 10, marginTop: 10 }}>
      <Svg width={CHART_WIDTH} height={height}>
        <Defs>
          <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        <Line x1={PADDING_LEFT} y1={yHigh} x2={PADDING_LEFT + graphWidth} y2={yHigh} stroke={colors.cardBorder} strokeDasharray="4 4" strokeWidth={1} />
        <Line x1={PADDING_LEFT} y1={yMod} x2={PADDING_LEFT + graphWidth} y2={yMod} stroke={colors.cardBorder} strokeDasharray="4 4" strokeWidth={1} />
        <Line x1={PADDING_LEFT} y1={yLow} x2={PADDING_LEFT + graphWidth} y2={yLow} stroke={colors.cardBorder} strokeDasharray="4 4" strokeWidth={1} />

        <SvgText x={PADDING_LEFT - 8} y={yHigh + 3} fill={colors.textSub} fontSize={10} fontFamily="Inter_600SemiBold" textAnchor="end">High</SvgText>
        <SvgText x={PADDING_LEFT - 8} y={yMod + 3} fill={colors.textSub} fontSize={10} fontFamily="Inter_600SemiBold" textAnchor="end">Mod</SvgText>
        <SvgText x={PADDING_LEFT - 8} y={yLow + 3} fill={colors.textSub} fontSize={10} fontFamily="Inter_600SemiBold" textAnchor="end">Low</SvgText>

        {areaPathD ? <Path d={areaPathD} fill="url(#chartGradient)" /> : null}

        {pathD ? (
          <>
            <Path d={pathD} fill="none" stroke={colors.accent} strokeWidth={6} strokeOpacity={0.15} strokeLinecap="round" />
            <Path d={pathD} fill="none" stroke={colors.accent} strokeWidth={3} strokeLinecap="round" />
          </>
        ) : null}

        {points.map((p, i) => {
          const showLabel =
            sortedReports.length <= 4 ||
            i === 0 ||
            i === sortedReports.length - 1 ||
            (sortedReports.length === 5 && i === 2) ||
            (sortedReports.length > 5 && i % 2 === 0);

          const dateStr = new Date(sortedReports[i].date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          return (
            <React.Fragment key={i}>
              {showLabel && (
                <SvgText x={p.x} y={PADDING_TOP + graphHeight + 16} fill={colors.textSub} fontSize={9.5} fontFamily="Inter_600SemiBold" textAnchor="middle">
                  {dateStr}
                </SvgText>
              )}
              <Circle cx={p.x} cy={p.y} r={9} fill={colors.accent} fillOpacity={0.18} />
              <Circle cx={p.x} cy={p.y} r={4.5} fill={colors.accent} />
              <Circle cx={p.x} cy={p.y} r={2} fill={colors.card} />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── GRAPH 2: DAILY ACTIVITY BREAKDOWN BAR CHART ─────────────────────────────
function DailyActivityBarChart({ dailyStats }: { dailyStats: { dateStr: string; scans: number; sessions: number; logs: number }[] }) {
  const { colors } = useTheme();
  const height = 140;

  const displayData = useMemo(() => {
    if (dailyStats.length === 0) return [];
    return dailyStats.slice(-7); // show latest up to 7 days in range
  }, [dailyStats]);

  if (displayData.length === 0) {
    return (
      <View style={[styles.chartContainerEmpty, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}>
        <Feather name="activity" size={24} color={colors.accent} style={{ marginBottom: 6 }} />
        <Text style={[styles.chartOverlayText, { color: colors.textSub }]}>No logged activities in this timeline</Text>
      </View>
    );
  }

  const PADDING_LEFT = 24;
  const PADDING_RIGHT = 24;
  const PADDING_TOP = 15;
  const PADDING_BOTTOM = 25;

  const graphWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const graphHeight = height - PADDING_TOP - PADDING_BOTTOM;

  const maxTotal = Math.max(4, ...displayData.map((d) => d.scans + d.sessions + d.logs));
  const barGroupWidth = graphWidth / displayData.length;
  const barWidth = Math.min(14, barGroupWidth * 0.5);

  return (
    <View style={{ height: height + 10, marginTop: 10 }}>
      <Svg width={CHART_WIDTH} height={height}>
        <Line x1={PADDING_LEFT} y1={PADDING_TOP + graphHeight} x2={PADDING_LEFT + graphWidth} y2={PADDING_TOP + graphHeight} stroke={colors.cardBorder} strokeWidth={1} />

        {displayData.map((d, i) => {
          const groupX = PADDING_LEFT + i * barGroupWidth + (barGroupWidth - barWidth) / 2;

          const scanH = (d.scans / maxTotal) * graphHeight;
          const sessionH = (d.sessions / maxTotal) * graphHeight;
          const logH = (d.logs / maxTotal) * graphHeight;

          const logY = PADDING_TOP + graphHeight - logH;
          const sessionY = logY - sessionH;
          const scanY = sessionY - scanH;

          return (
            <G key={d.dateStr}>
              {/* Audio Scans Bar (Accent) */}
              {scanH > 0 && <Rect x={groupX} y={scanY} width={barWidth} height={scanH} rx={3} fill={colors.accent} />}
              {/* Exercise Sessions Bar (Mint) */}
              {sessionH > 0 && <Rect x={groupX} y={sessionY} width={barWidth} height={sessionH} rx={3} fill={colors.mint} />}
              {/* Symptoms Logs Bar (Amber) */}
              {logH > 0 && <Rect x={groupX} y={logY} width={barWidth} height={logH} rx={3} fill={colors.amber} />}

              {/* Date text */}
              <SvgText
                x={groupX + barWidth / 2}
                y={PADDING_TOP + graphHeight + 16}
                fill={colors.textSub}
                fontSize={9}
                fontFamily="Inter_600SemiBold"
                textAnchor="middle"
              >
                {d.dateStr}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10.5, color: colors.textSub }}>Audio Scans</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.mint }} />
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10.5, color: colors.textSub }}>Exercises</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber }} />
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10.5, color: colors.textSub }}>Symptom Logs</Text>
        </View>
      </View>
    </View>
  );
}

// ─── REPORT AUDIO PLAYER COMPONENT ───────────────────────────────────────────
function ReportAudioPlayer({ report }: { report: any }) {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(report.audioDuration || 5);
  const audioRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Resolve audio track from report or memory cache
  const audioUri = useMemo(() => {
    if (report.audioUri && typeof report.audioUri === 'string' && report.audioUri.trim().length > 0) {
      return report.audioUri;
    }
    if (typeof window !== 'undefined' && (window as any).__asthma_audio_cache) {
      const cache = (window as any).__asthma_audio_cache;
      if (report.fileName && cache[report.fileName]) return cache[report.fileName];
      if (report.id && cache[report.id]) return cache[report.id];
      if (report.date && cache[report.date]) return cache[report.date];
    }
    return null;
  }, [report]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          if (Platform.OS === 'web') {
            audioRef.current.pause();
            audioRef.current = null;
          }
        } catch (_) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [report]);

  const togglePlay = async () => {
    haptics.light();

    if (isPlaying) {
      if (Platform.OS === 'web' && audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (audioUri) {
          if (!audioRef.current || audioRef.current.src !== audioUri) {
            audioRef.current = new window.Audio(audioUri);
            audioRef.current.onloadedmetadata = () => {
              if (audioRef.current.duration && Number.isFinite(audioRef.current.duration)) {
                setDuration(Math.round(audioRef.current.duration));
              }
            };
            audioRef.current.onended = () => {
              setIsPlaying(false);
              setCurrentTime(0);
              if (timerRef.current) clearInterval(timerRef.current);
            };
            audioRef.current.onerror = () => {
              console.warn('Audio element error, reverting playback state');
              setIsPlaying(false);
            };
          }
          await audioRef.current.play();
          setIsPlaying(true);

          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            if (audioRef.current) {
              setCurrentTime(Math.round(audioRef.current.currentTime || 0));
            }
          }, 200);
        } else {
          // Play simulated acoustic breath tone for legacy records
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const dur = duration || 5;
            osc.type = report.wheezingDetected === 'Yes' ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(report.wheezingDetected === 'Yes' ? 480 : 160, ctx.currentTime);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + dur);
            
            setIsPlaying(true);
            let elapsed = 0;
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              elapsed++;
              setCurrentTime(elapsed);
              if (elapsed >= dur) {
                setIsPlaying(false);
                setCurrentTime(0);
                clearInterval(timerRef.current);
              }
            }, 1000);
          }
        }
      }
    } catch (err) {
      console.warn('Playback error:', err);
      setIsPlaying(false);
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = String(Math.floor(secs % 60)).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={[styles.audioPlayerBox, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={togglePlay} style={[styles.audioPlayBtn, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
          <Feather name={isPlaying ? 'pause' : 'play'} size={18} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text }} numberOfLines={1}>
              {report.fileName || 'Uploaded Respiratory Audio'}
            </Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.textSub }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>

          <View style={[styles.audioProgressTrack, { backgroundColor: colors.cardBorder }]}>
            <View style={[styles.audioProgressBar, { backgroundColor: colors.accent, width: `${progressPercent}%` }]} />
          </View>
        </View>

        <View style={[styles.audioWaveIcon, { backgroundColor: `${colors.accent}15` }]}>
          <Feather name="volume-2" size={16} color={colors.accent} />
        </View>
      </View>
    </View>
  );
}

// ─── MAIN REPORTS SCREEN ─────────────────────────────────────────────────────
export default function ReportsScreen() {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const isFocused = useIsFocused();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isFocused) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isFocused]);

  // ── Timeline State ────────────────────────────────────────────────────────
  const [timelinePreset, setTimelinePreset] = useState<TimelinePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);

  const [aiReport, setAiReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showClinicalReportModal, setShowClinicalReportModal] = useState(false);

  // Load stores
  const token = useAuthStore((s: any) => s.token);
  const user = useAuthStore((s: any) => s.user);
  const streak = useAuthStore((s: any) => s.streak) || 0;
  const loginDates = useAuthStore((s: any) => s.loginDates) || [];
  const logs = useSymptomStore((s: any) => s.logs) || [];
  const sessions = useSessionStore((s: any) => s.sessions) || [];
  const reports = useAnalysisStore((s: any) => s.reports) || [];
  const isSyncing = useAuthStore((s: any) => s.isSyncing);

  // Compute Active Timeline Bounds
  const { startTimestamp, endTimestamp, timelineLabel } = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    if (timelinePreset === '7d') {
      const start = end - 7 * 86400000;
      return {
        startTimestamp: start,
        endTimestamp: end,
        timelineLabel: `Last 7 Days (${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
      };
    }
    if (timelinePreset === '14d') {
      const start = end - 14 * 86400000;
      return {
        startTimestamp: start,
        endTimestamp: end,
        timelineLabel: `Last 14 Days (${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
      };
    }
    if (timelinePreset === '30d') {
      const start = end - 30 * 86400000;
      return {
        startTimestamp: start,
        endTimestamp: end,
        timelineLabel: `Last 30 Days (${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
      };
    }
    if (timelinePreset === 'custom' && customStartDate) {
      const parsedStart = new Date(customStartDate).getTime();
      const parsedEnd = customEndDate ? new Date(customEndDate).getTime() + 86399000 : end;
      if (!isNaN(parsedStart)) {
        return {
          startTimestamp: parsedStart,
          endTimestamp: parsedEnd,
          timelineLabel: `Custom (${new Date(parsedStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(parsedEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
        };
      }
    }

    // Default: All Time
    return {
      startTimestamp: 0,
      endTimestamp: end,
      timelineLabel: 'All Historical Tracking Records',
    };
  }, [timelinePreset, customStartDate, customEndDate]);

  // Filtered Datasets for Selected Timeline
  const filteredReports = useMemo(() => {
    return reports.filter((r: any) => {
      const t = new Date(r.date).getTime();
      return t >= startTimestamp && t <= endTimestamp;
    });
  }, [reports, startTimestamp, endTimestamp]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s: any) => {
      const t = new Date(s.date || s.createdAt).getTime();
      return t >= startTimestamp && t <= endTimestamp;
    });
  }, [sessions, startTimestamp, endTimestamp]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l: any) => {
      const t = new Date(l.createdAt || l.date).getTime();
      return t >= startTimestamp && t <= endTimestamp;
    });
  }, [logs, startTimestamp, endTimestamp]);

  // Chronological Grouped Day-by-Day Feed
  const dayTimelineFeed = useMemo(() => {
    const dayMap: Record<string, { dateKey: string; dateObj: Date; reports: any[]; sessions: any[]; logs: any[] }> = {};

    filteredReports.forEach((r: any) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dayMap[key]) dayMap[key] = { dateKey: key, dateObj: d, reports: [], sessions: [], logs: [] };
      dayMap[key].reports.push(r);
    });

    filteredSessions.forEach((s: any) => {
      const d = new Date(s.date || s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dayMap[key]) dayMap[key] = { dateKey: key, dateObj: d, reports: [], sessions: [], logs: [] };
      dayMap[key].sessions.push(s);
    });

    filteredLogs.forEach((l: any) => {
      const d = new Date(l.createdAt || l.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dayMap[key]) dayMap[key] = { dateKey: key, dateObj: d, reports: [], sessions: [], logs: [] };
      dayMap[key].logs.push(l);
    });

    return Object.values(dayMap).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [filteredReports, filteredSessions, filteredLogs]);

  // Daily Stats for Bar Chart
  const dailyChartStats = useMemo(() => {
    return [...dayTimelineFeed]
      .reverse()
      .map((item) => ({
        dateStr: item.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        scans: item.reports.length,
        sessions: item.sessions.length,
        logs: item.logs.length,
      }));
  }, [dayTimelineFeed]);

  // Risk Distribution in Selected Timeline
  const riskBreakdown = useMemo(() => {
    if (filteredReports.length === 0) return { highPct: 0, modPct: 0, lowPct: 0, highCount: 0, modCount: 0, lowCount: 0 };
    const highCount = filteredReports.filter((r: any) => r.riskLevel === 'High').length;
    const modCount = filteredReports.filter((r: any) => r.riskLevel === 'Moderate').length;
    const lowCount = filteredReports.filter((r: any) => r.riskLevel === 'Low' || !r.riskLevel).length;
    const total = filteredReports.length;
    return {
      highPct: Math.round((highCount / total) * 100),
      modPct: Math.round((modCount / total) * 100),
      lowPct: Math.round((lowCount / total) * 100),
      highCount,
      modCount,
      lowCount,
    };
  }, [filteredReports]);

  // Timeline Aggregates
  const averageRisk = useMemo(() => {
    if (filteredReports.length === 0) return 0;
    const sum = filteredReports.reduce((acc: number, curr: any) => {
      if (curr.riskLevel === 'High') return acc + 85;
      if (curr.riskLevel === 'Moderate') return acc + 50;
      return acc + 20;
    }, 0);
    return Math.round(sum / filteredReports.length);
  }, [filteredReports]);

  const uniqueDaysLogged = dayTimelineFeed.length;
  const wheezeSpikesCount = filteredReports.filter((r: any) => r.wheezingDetected === 'Yes').length;

  const stats = useMemo(
    () => [
      { label: 'Avg Risk', val: averageRisk > 0 ? averageRisk : 0, suffix: '%', icon: 'shield', color: averageRisk > 60 ? colors.danger : colors.accent },
      { label: 'Days Tracked', val: uniqueDaysLogged, icon: 'calendar', color: colors.mint },
      { label: 'Audio Scans', val: filteredReports.length, icon: 'mic', color: colors.accent },
      { label: 'Exercises', val: filteredSessions.length, icon: 'wind', color: colors.mint },
    ],
    [averageRisk, uniqueDaysLogged, filteredReports, filteredSessions, colors]
  );

  const handleGenerateReport = async () => {
    haptics.light();
    setLoadingReport(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    try {
      const bodyData = {
        patientName: user?.name || 'Kirthanaa',
        age: user?.profile?.age ? Number(user.profile.age) : 21,
        severity: user?.profile?.severity || 'Mild',
        inhaler: user?.profile?.inhaler || 'None',
        triggers: user?.profile?.triggers || ['Smoke', 'Dust'],
        timeline: timelineLabel,
        logs: filteredLogs.slice(0, 20),
        reports: filteredReports.slice(0, 15),
        sessions: filteredSessions.slice(0, 15),
        streak,
        uniqueDaysLogged,
      };

      const response = await fetch(`${API_BASE_URL}/api/breathing/clinical-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        const result = await response.json();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setAiReport(result);
        haptics.success();
      } else {
        const errJson = await response.json().catch(() => ({}));
        Alert.alert('Analysis Failed', errJson.error || 'Server returned an error generating pulmonology summary.');
      }
    } catch (e: any) {
      console.error('Failed to fetch clinical report:', e);
      Alert.alert('Network Error', 'Could not establish connection to AsthmaSense server.');
    } finally {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setLoadingReport(false);
    }
  };

  const handlePdfDownload = async () => {
    haptics.success();
    try {
      const patientName = user?.name || 'Kirthanaa';
      const patientAge = user?.profile?.age ? String(user.profile.age) : '21';
      const patientSeverity = user?.profile?.severity || 'Mild';
      const patientTriggers = user?.profile?.triggers && user.profile.triggers.length > 0 ? user.profile.triggers.join(', ') : 'Smoke, Dust';
      const patientInhaler = user?.profile?.inhaler || 'None';

      const summaryText =
        aiReport?.executiveSummary ||
        aiReport?.clinicalSummary ||
        `Comprehensive clinical report for patient ${patientName} over ${timelineLabel}. Computed respiratory risk averaged ${averageRisk}%, with ${wheezeSpikesCount} wheeze event(s) recorded. Continued breathing exercise compliance and trigger avoidance is strongly recommended.`;

      const triggerText =
        aiReport?.triggerAnalysis ||
        `Environmental triggers identified: ${patientTriggers}. Adherence to daily air quality checks and reducing exposure during high pollen/smoke intervals is advised.`;

      const complianceText =
        aiReport?.exerciseEvaluation ||
        aiReport?.complianceEvaluation ||
        `The patient completed ${filteredSessions.length} breathing exercise sessions in this timeline, improving diaphragmatic flow and calming acute respiratory fluctuations.`;

      const actionItems =
        (aiReport?.actionItems || aiReport?.actionPlan) && (aiReport?.actionItems || aiReport?.actionPlan).length > 0
          ? aiReport?.actionItems || aiReport?.actionPlan
          : [
              'Continue prescribed inhaler routine as directed by attending pulmonologist.',
              `Implement indoor air filtration to reduce contact with ${patientTriggers}.`,
              'Perform regular diaphragmatic and pursed-lip breathing exercises to maintain peak airflow stability.',
            ];

      const actionItemsHtml = actionItems
        .map(
          (item: string) => `
        <div style="display: flex; align-items: flex-start; margin-bottom: 10px; gap: 8px;">
          <span style="color: #0284C7; font-weight: bold; font-size: 14px;">☑</span>
          <span style="color: #374151; font-size: 12px; line-height: 1.5;">${item}</span>
        </div>
      `
        )
        .join('');

      const timelineActivitiesHtml = dayTimelineFeed
        .map((day) => {
          const formattedDate = day.dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          const scanDetails = day.reports.map((r) => `🎙️ Audio Scan: ${r.riskLevel} Risk (Wheeze: ${r.wheezingDetected}, RR: ${r.rr || 'N/A'})`).join('<br/>');
          const sessionDetails = day.sessions.map((s) => `🫁 Exercise: ${s.type || 'Breathing'} (${s.duration || 5} min)`).join('<br/>');
          const logDetails = day.logs.map((l) => `📝 Log: ${l.symptoms ? (Array.isArray(l.symptoms) ? l.symptoms.join(', ') : l.symptoms) : 'Recorded'} (Triggers: ${l.triggers || 'None'})`).join('<br/>');

          const allDetails = [scanDetails, sessionDetails, logDetails].filter(Boolean).join('<br/>');

          return `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 12px; font-size: 11px; font-weight: bold; color: #1E293B; vertical-align: top; width: 140px;">${formattedDate}</td>
            <td style="padding: 10px 12px; font-size: 11px; color: #475569; line-height: 1.6;">${allDetails || 'Standard monitoring activity recorded'}</td>
          </tr>
        `;
        })
        .join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Clinical Pulmonology Report - ${patientName}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; padding: 36px; line-height: 1.5; }
            .header-banner { border-bottom: 2px solid #0284C7; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header-title { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0; }
            .header-subtitle { font-size: 12px; color: #64748B; margin-top: 4px; }
            .timeline-pill { background: #E0F2FE; color: #0369A1; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: bold; }
            .patient-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px; border-radius: 8px; margin-bottom: 20px; }
            .metric-cell { text-align: left; }
            .metric-label { font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: bold; }
            .metric-val { font-size: 14px; color: #0F172A; font-weight: bold; margin-top: 2px; }
            .section-title { font-size: 13px; font-weight: 800; color: #0284C7; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 20px; margin-bottom: 8px; }
            .text-block { background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 4px solid #0284C7; padding: 12px 14px; border-radius: 6px; font-size: 12px; color: #334155; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 20px; }
            th { background: #F1F5F9; color: #475569; font-size: 11px; font-weight: bold; text-align: left; padding: 8px 12px; border-bottom: 1px solid #CBD5E1; }
            .footer { font-size: 10px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div>
              <h1 class="header-title">AsthmaSense Clinical Pulmonology Report</h1>
              <div class="header-subtitle">Comprehensive Patient Timeline Assessment & Respiratory Analytics</div>
            </div>
            <div class="timeline-pill">${timelineLabel}</div>
          </div>

          <div class="patient-grid">
            <div class="metric-cell"><div class="metric-label">Patient Name</div><div class="metric-val">${patientName}</div></div>
            <div class="metric-cell"><div class="metric-label">Age / Severity</div><div class="metric-val">${patientAge} yrs · ${patientSeverity}</div></div>
            <div class="metric-cell"><div class="metric-label">Average Risk</div><div class="metric-val">${averageRisk}%</div></div>
            <div class="metric-cell"><div class="metric-label">Wheeze Spikes</div><div class="metric-val">${wheezeSpikesCount} Events</div></div>
          </div>

          <div class="section-title">Executive Pulmonology Summary</div>
          <div class="text-block">${summaryText}</div>

          <div class="section-title">Trigger & Environmental Exposure Profile</div>
          <div class="text-block">${triggerText}</div>

          <div class="section-title">Breathing Exercise Compliance</div>
          <div class="text-block">${complianceText}</div>

          <div class="section-title">Timeline Activity & Risk Chronology</div>
          <table>
            <thead>
              <tr><th>Date</th><th>Logged Health Events & Acoustic Audio Screenings</th></tr>
            </thead>
            <tbody>
              ${timelineActivitiesHtml || '<tr><td colspan="2" style="padding: 12px; text-align: center; color: #64748B;">No records in selected timeline interval.</td></tr>'}
            </tbody>
          </table>

          <div class="section-title">Physician Action Plan & Clinical Guidance</div>
          <div>${actionItemsHtml}</div>

          <div class="footer">
            Confidential Medical Document · Generated by AsthmaSense Clinical AI Suite · Ref: AS-${Date.now().toString().slice(-6)}
          </div>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(htmlContent);
          doc.close();
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              try {
                document.body.removeChild(iframe);
              } catch {}
            }, 2000);
          }, 400);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Clinical Report PDF', UTI: 'com.adobe.pdf' });
      }
    } catch (e: any) {
      console.error('Failed to generate professional clinical PDF:', e);
      Alert.alert('PDF Error', 'Failed to generate clinical PDF file.');
    }
  };

  if (isSyncing && reports.length === 0 && logs.length === 0 && sessions.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.textSub, marginTop: 12 }}>Loading analysis history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>Clinical reports</Text>
        </View>
      </SafeAreaView>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── TIMELINE DATE FILTER SELECTOR ────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="calendar" size={16} color={colors.accent} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text }}>Timeline Period</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                setShowCustomDateInputs(!showCustomDateInputs);
                if (!showCustomDateInputs) setTimelinePreset('custom');
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.accent }}>
                {showCustomDateInputs ? 'Hide Custom' : 'Custom Dates'}
              </Text>
              <Feather name={showCustomDateInputs ? 'chevron-up' : 'chevron-down'} size={14} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Quick Preset Pills */}
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: '7d' as TimelinePreset, label: '7 Days' },
              { key: '14d' as TimelinePreset, label: '14 Days' },
              { key: '30d' as TimelinePreset, label: '30 Days' },
              { key: 'all' as TimelinePreset, label: 'All Time' },
            ].map((p) => {
              const active = timelinePreset === p.key && !showCustomDateInputs;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => {
                    haptics.light();
                    setTimelinePreset(p.key);
                    setShowCustomDateInputs(false);
                  }}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: active ? colors.accent : colors.surface,
                      borderColor: active ? colors.accent : colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: active ? '#fff' : colors.text }}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Date Inputs (if toggled) */}
          {showCustomDateInputs && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.cardBorder, gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.textSub }}>From Date (YYYY-MM-DD)</Text>
                  <TextInput
                    value={customStartDate}
                    onChangeText={setCustomStartDate}
                    placeholder="2026-08-01"
                    placeholderTextColor={colors.textSub}
                    style={[styles.dateInput, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.textSub }}>To Date (YYYY-MM-DD)</Text>
                  <TextInput
                    value={customEndDate}
                    onChangeText={setCustomEndDate}
                    placeholder="2026-08-10"
                    placeholderTextColor={colors.textSub}
                    style={[styles.dateInput, { backgroundColor: colors.bg, borderColor: colors.cardBorder, color: colors.text }]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Active Timeline Banner */}
          <View style={{ marginTop: 10, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: `${colors.accent}12` }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11.5, color: colors.accent }}>📅 Active: {timelineLabel}</Text>
          </View>
        </View>

        {/* 2x2 Stats Grid for Timeline */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </View>

        {/* ── GRAPH 1: RESPIRATORY RISK AREA CHART ─────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>Respiratory Risk Index</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="trending-up" size={14} color={colors.accent} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.accent }}>{averageRisk}% Avg</Text>
            </View>
          </View>
          <Text style={[styles.graphSubtitle, { color: colors.textSub }]}>
            Visualizes expiratory restriction levels over successive audio analysis records in the selected timeline.
          </Text>
          <RiskAreaChart reports={filteredReports} />

          {/* Risk Level Distribution Gauge */}
          {filteredReports.length > 0 && (
            <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.textSub, textTransform: 'uppercase' }}>Risk Distribution</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.textSub }}>{filteredReports.length} Scans</Text>
              </View>
              <View style={styles.riskBarContainer}>
                {riskBreakdown.highPct > 0 && <View style={[styles.riskBarSegment, { width: `${riskBreakdown.highPct}%`, backgroundColor: colors.danger }]} />}
                {riskBreakdown.modPct > 0 && <View style={[styles.riskBarSegment, { width: `${riskBreakdown.modPct}%`, backgroundColor: colors.amber }]} />}
                {riskBreakdown.lowPct > 0 && <View style={[styles.riskBarSegment, { width: `${riskBreakdown.lowPct}%`, backgroundColor: colors.mint }]} />}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.danger }}>High: {riskBreakdown.highPct}% ({riskBreakdown.highCount})</Text>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.amber }}>Mod: {riskBreakdown.modPct}% ({riskBreakdown.modCount})</Text>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.mint }}>Low: {riskBreakdown.lowPct}% ({riskBreakdown.lowCount})</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── GRAPH 2: DAILY ACTIVITY BREAKDOWN ────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>Daily Activity & Log Breakdown</Text>
          <Text style={[styles.graphSubtitle, { color: colors.textSub }]}>
            Timeline frequency of audio scans, breathing exercise sessions, and logged symptoms across active days.
          </Text>
          <DailyActivityBarChart dailyStats={dailyChartStats} />
        </View>

        {/* ── CLINICAL PULMONOLOGY REPORT CARD ─────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Feather name="activity" size={18} color={colors.accent} />
            <Text style={[styles.cardTitleNoMargin, { color: colors.text, fontFamily: 'Inter_700Bold', flex: 1 }]}>Clinical Pulmonology Report</Text>
            <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: `${colors.accent}12`, borderColor: `${colors.accent}30` }]}>
              <Feather name="zap" size={10} color={colors.accent} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.accent, letterSpacing: 0.3 }}>Unlimited</Text>
            </View>
          </View>

          {loadingReport ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSub }}>AI is compiling your clinical timeline logs...</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={[styles.cardDesc, { color: colors.textSub, marginTop: 0 }]}>
                Generate a comprehensive pulmonology summary analyzing your symptom trends, rescue inhaler usages, and audio recordings for {timelineLabel}.
              </Text>

              <View style={[styles.reportSection, { backgroundColor: colors.accentDim, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }]}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="info" size={14} color={colors.accent} />
                  <Text style={[styles.sectionHeadingLabel, { color: colors.accent, fontSize: 10, fontFamily: 'Inter_700Bold' }]}>EXECUTIVE TIMELINE SUMMARY</Text>
                </View>
                <Text style={[styles.sectionBodyText, { color: colors.text, fontSize: 13, marginTop: 6, lineHeight: 18 }]} numberOfLines={2}>
                  {aiReport?.executiveSummary ||
                    aiReport?.clinicalSummary ||
                    `Respiratory screening records for ${user?.name || 'Kirthanaa'} across ${timelineLabel} indicate ${averageRisk}% average risk with ${wheezeSpikesCount} wheezing event(s).`}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <TouchableOpacity onPress={() => { haptics.light(); setShowClinicalReportModal(true); }} style={[styles.downloadBtn, { backgroundColor: colors.accent, flex: 1 }]} activeOpacity={0.88}>
                  <Ionicons name="eye-outline" size={16} color="#fff" />
                  <Text style={styles.downloadBtnText}>View Clinical Report</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePdfDownload} style={[styles.downloadBtn, { backgroundColor: colors.accentDim, width: 50, paddingHorizontal: 0 }]} activeOpacity={0.88}>
                  <Feather name="download" size={16} color={colors.accent} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── DAY-BY-DAY ACTIVITY & RISK TIMELINE FEED ────────────────────── */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.textSub, marginBottom: 0 }]}>TIMELINE ACTIVITIES & LOGS</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.accent }}>{dayTimelineFeed.length} Active Days</Text>
          </View>

          {dayTimelineFeed.length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, alignItems: 'center', padding: 24, borderRadius: 14, borderWidth: 1 }]}>
              <Feather name="calendar" size={24} color={colors.textSub} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSub }}>No activities recorded in this timeline interval</Text>
            </View>
          ) : (
            dayTimelineFeed.map((dayGroup) => {
              const dayHeaderStr = dayGroup.dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <View key={dayGroup.dateKey} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  {/* Day Header Banner */}
                  <View style={[styles.dayHeaderRow, { borderBottomColor: colors.cardBorder }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="clock" size={14} color={colors.accent} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13.5, color: colors.text }}>{dayHeaderStr}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {dayGroup.reports.length > 0 && (
                        <View style={[styles.dayBadge, { backgroundColor: `${colors.accent}18` }]}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: colors.accent }}>{dayGroup.reports.length} Audio</Text>
                        </View>
                      )}
                      {dayGroup.sessions.length > 0 && (
                        <View style={[styles.dayBadge, { backgroundColor: `${colors.mint}18` }]}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: colors.mint }}>{dayGroup.sessions.length} Ex</Text>
                        </View>
                      )}
                      {dayGroup.logs.length > 0 && (
                        <View style={[styles.dayBadge, { backgroundColor: `${colors.amber}18` }]}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: colors.amber }}>{dayGroup.logs.length} Log</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Day Activities Content */}
                  <View style={{ paddingHorizontal: 12, paddingVertical: 8, gap: 10 }}>
                    {/* Audio Analyses for this day */}
                    {dayGroup.reports.map((r, rIdx) => {
                      const isHigh = r.riskLevel === 'High';
                      const isMod = r.riskLevel === 'Moderate';
                      const dotColor = isHigh ? colors.danger : isMod ? colors.amber : colors.mint;
                      const dotBg = isHigh ? colors.dangerTint : isMod ? colors.amberTint : colors.mintTint;

                      return (
                        <View key={r.id || rIdx} style={[styles.timelineItemRow, { backgroundColor: colors.bg, borderColor: colors.cardBorder, flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
                          <TouchableOpacity
                            onPress={() => { haptics.light(); setSelectedReport(r); }}
                            activeOpacity={0.82}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                          >
                            <View style={[styles.activityIconContainer, { backgroundColor: dotBg }]}>
                              <Feather name="mic" size={15} color={dotColor} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text }}>
                                  Audio Analysis: {r.riskLevel || 'Standard'} Risk
                                </Text>
                                <View style={[styles.pillBadge, { backgroundColor: dotBg }]}>
                                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10.5, color: dotColor }}>{r.riskLevel || 'Low'}</Text>
                                </View>
                              </View>
                              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11.5, color: colors.textSub }} numberOfLines={1}>
                                Wheezing: {r.wheezingDetected || 'No'} · RR: {r.rr || '16 bpm'} · {r.summary || 'Click to view'}
                              </Text>
                            </View>
                            <Feather name="chevron-right" size={14} color={colors.textSub} />
                          </TouchableOpacity>

                          {/* Embedded Audio Playback */}
                          <AudioPlaybackCard
                            audioUri={r.audioUri}
                            fileName={r.fileName || 'respiratory_audio.wav'}
                            durationSeconds={r.audioDuration || 5}
                            isWheeze={r.wheezingDetected === 'Yes'}
                            title="Original Audio"
                            subtitle="Listen to the original uploaded recording"
                          />
                        </View>
                      );
                    })}

                    {/* Breathing Sessions for this day */}
                    {dayGroup.sessions.map((s, sIdx) => (
                      <View key={s.id || sIdx} style={[styles.timelineItemRow, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                        <View style={[styles.activityIconContainer, { backgroundColor: `${colors.mint}18` }]}>
                          <Feather name="wind" size={15} color={colors.mint} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text }}>
                            Breathing Exercise: {s.type || 'Recovery'}
                          </Text>
                          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11.5, color: colors.textSub }}>
                            Duration: {s.duration || 5} min · Completed successfully
                          </Text>
                        </View>
                        <Feather name="check-circle" size={14} color={colors.mint} />
                      </View>
                    ))}

                    {/* Symptom / Trigger Logs for this day */}
                    {dayGroup.logs.map((l, lIdx) => (
                      <View key={l.id || lIdx} style={[styles.timelineItemRow, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                        <View style={[styles.activityIconContainer, { backgroundColor: `${colors.amber}18` }]}>
                          <Feather name="edit-3" size={15} color={colors.amber} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text }}>
                            Symptom Log: {l.symptoms ? (Array.isArray(l.symptoms) ? l.symptoms.join(', ') : l.symptoms) : 'General Check-in'}
                          </Text>
                          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11.5, color: colors.textSub }}>
                            Triggers: {l.triggers ? (Array.isArray(l.triggers) ? l.triggers.join(', ') : l.triggers) : 'None'} {l.notes ? `· "${l.notes}"` : ''}
                          </Text>
                        </View>
                        <Feather name="alert-triangle" size={14} color={colors.amber} />
                      </View>
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── CLINICAL REPORT FULL MODAL ────────────────────────────────────── */}
      <Modal visible={showClinicalReportModal} animationType="slide" transparent={true} onRequestClose={() => setShowClinicalReportModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowClinicalReportModal(false)} />
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="activity" size={20} color={colors.accent} />
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Clinical Pulmonology Report</Text>
              </View>
              <TouchableOpacity onPress={() => setShowClinicalReportModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={20} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 10 }}>
              <View style={{ backgroundColor: colors.bg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, gap: 4 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text }}>Patient: {user?.name || 'Kirthanaa'}</Text>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.textSub }}>
                  Age: {user?.profile?.age ? String(user.profile.age) : '21'} · Severity: {user?.profile?.severity || 'Mild'} · Timeline: {timelineLabel}
                </Text>
              </View>

              <View style={[styles.reportSection, { backgroundColor: colors.accentDim, padding: 12, borderRadius: 10 }]}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="star" size={14} color={colors.accent} />
                  <Text style={[styles.sectionHeadingLabel, { color: colors.accent, fontSize: 11, fontFamily: 'Inter_700Bold', marginLeft: 6 }]}>EXECUTIVE SUMMARY</Text>
                </View>
                <Text style={[styles.sectionBodyText, { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 8 }]}>
                  {aiReport?.executiveSummary ||
                    aiReport?.clinicalSummary ||
                    `Respiratory screening records for ${user?.name || 'Kirthanaa'} across ${timelineLabel} indicate an average risk of ${averageRisk}%, with ${wheezeSpikesCount} wheezing spike events recorded. Regular inhaler adherence and environmental monitoring are recommended.`}
                </Text>
              </View>

              <View style={[styles.reportSection, { backgroundColor: colors.bg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder }]}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="wind" size={14} color={colors.mint} />
                  <Text style={[styles.sectionHeadingLabel, { color: colors.mint, fontSize: 11, fontFamily: 'Inter_700Bold', marginLeft: 6 }]}>TIMELINE METRICS SUMMARY</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <View><Text style={{ fontSize: 10, color: colors.textSub }}>AVG RISK</Text><Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text }}>{averageRisk}%</Text></View>
                  <View><Text style={{ fontSize: 10, color: colors.textSub }}>AUDIO SCANS</Text><Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text }}>{filteredReports.length}</Text></View>
                  <View><Text style={{ fontSize: 10, color: colors.textSub }}>EXERCISES</Text><Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text }}>{filteredSessions.length}</Text></View>
                  <View><Text style={{ fontSize: 10, color: colors.textSub }}>DAYS ACTIVE</Text><Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text }}>{uniqueDaysLogged}</Text></View>
                </View>
              </View>

              <TouchableOpacity onPress={handlePdfDownload} style={[styles.downloadBtn, { backgroundColor: colors.accent, marginTop: 6 }]} activeOpacity={0.88}>
                <Feather name="download" size={16} color="#fff" />
                <Text style={[styles.downloadBtnText, { color: '#fff' }]}>Download PDF Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── AUDIO REPORT DETAIL MODAL ────────────────────────────────────── */}
      {selectedReport && (
        <Modal visible={true} animationType="slide" transparent={true} onRequestClose={() => setSelectedReport(null)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setSelectedReport(null)} />
            <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, maxHeight: '85%' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Audio Analysis Details</Text>
                <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.modalCloseBtn}>
                  <Feather name="x" size={20} color={colors.textSub} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 99,
                      backgroundColor: selectedReport.riskLevel === 'High' ? colors.dangerTint : selectedReport.riskLevel === 'Moderate' ? colors.amberTint : colors.mintTint,
                    }}
                  >
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: selectedReport.riskLevel === 'High' ? colors.danger : selectedReport.riskLevel === 'Moderate' ? colors.amber : colors.mint }}>
                      {selectedReport.riskLevel} Risk
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSub }}>Confidence: {selectedReport.confidence}</Text>
                </View>

                {/* Audio Recording Player */}
                <AudioPlaybackCard
                  audioUri={selectedReport.audioUri}
                  fileName={selectedReport.fileName || 'respiratory_audio.wav'}
                  durationSeconds={selectedReport.audioDuration || 5}
                  isWheeze={selectedReport.wheezingDetected === 'Yes'}
                  title="Original Audio"
                  subtitle="Listen to the original uploaded recording"
                />

                {/* 2x2 Grid of Metrics */}
                <View style={styles.modalGrid}>
                  {[
                    { icon: 'activity' as const, label: 'Respiratory Rate', val: selectedReport.rr || '16 bpm', color: colors.accent },
                    { icon: 'wind' as const, label: 'Wheezing Pattern', val: selectedReport.wheezePattern || (selectedReport.wheezingDetected === 'Yes' ? 'Audible whistle' : 'None detected'), color: colors.danger },
                    { icon: 'alert-circle' as const, label: 'Cough', val: selectedReport.pattern || 'None detected', color: colors.amber },
                    { icon: 'heart' as const, label: 'Regularity', val: selectedReport.regularity || '92%', color: colors.mint },
                  ].map((m) => (
                    <View key={m.label} style={[styles.modalGridCard, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                      <Feather name={m.icon} size={16} color={m.color} />
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.textSub, marginTop: 6 }} numberOfLines={1}>{m.label}</Text>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text, marginTop: 2 }} numberOfLines={1}>{m.val}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text }}>Overview</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSub, lineHeight: 18 }}>{selectedReport.summary}</Text>
                </View>

                {selectedReport.transcript && (
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text }}>Audio Transcript</Text>
                    <View style={{ padding: 12, borderRadius: 10, backgroundColor: colors.bg, borderLeftWidth: 3, borderLeftColor: colors.accent }}>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text, fontStyle: 'italic' }}>"{selectedReport.transcript}"</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ─── STYLESHEET ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    marginBottom: 4,
  },
  cardTitleNoMargin: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  graphSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
  },
  cardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
  },
  chartContainerEmpty: {
    height: 130,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  chartOverlayText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  riskBarContainer: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  riskBarSegment: {
    height: '100%',
  },
  reportSection: {
    marginVertical: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeadingLabel: {
    letterSpacing: 0.6,
  },
  sectionBodyText: {
    fontFamily: 'Inter_400Regular',
  },
  downloadBtn: {
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#fff',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  dayCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  modalGridCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  audioPlayerBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  audioPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioProgressTrack: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  audioProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  audioWaveIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
