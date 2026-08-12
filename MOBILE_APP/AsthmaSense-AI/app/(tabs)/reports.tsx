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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, radius, typography } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useAuthStore, useSessionStore, useSymptomStore, useAnalysisStore } from '../../src/store';
import { API_BASE_URL } from '../../src/config/api';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;

function StatCard({ label, val, suffix }: { label: string; val: number | string; suffix?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Text style={[styles.statLabel, { color: colors.textSub }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>
        {val}
        {suffix ?? ''}
      </Text>
    </View>
  );
}

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
    // Smooth bezier curve generator for SVG
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
        <Text style={[styles.chartOverlayText, { color: colors.textSub }]}>No audio analyses saved yet</Text>
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

        {/* Horizontal dotted grid lines mapped to risk levels */}
        <Line
          x1={PADDING_LEFT}
          y1={yHigh}
          x2={PADDING_LEFT + graphWidth}
          y2={yHigh}
          stroke={colors.cardBorder}
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <Line
          x1={PADDING_LEFT}
          y1={yMod}
          x2={PADDING_LEFT + graphWidth}
          y2={yMod}
          stroke={colors.cardBorder}
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <Line
          x1={PADDING_LEFT}
          y1={yLow}
          x2={PADDING_LEFT + graphWidth}
          y2={yLow}
          stroke={colors.cardBorder}
          strokeDasharray="4 4"
          strokeWidth={1}
        />

        {/* Y-Axis text labels */}
        <SvgText
          x={PADDING_LEFT - 8}
          y={yHigh + 3}
          fill={colors.textSub}
          fontSize={10}
          fontFamily="Inter_600SemiBold"
          textAnchor="end"
        >
          High
        </SvgText>

        <SvgText
          x={PADDING_LEFT - 8}
          y={yMod + 3}
          fill={colors.textSub}
          fontSize={10}
          fontFamily="Inter_600SemiBold"
          textAnchor="end"
        >
          Mod
        </SvgText>

        <SvgText
          x={PADDING_LEFT - 8}
          y={yLow + 3}
          fill={colors.textSub}
          fontSize={10}
          fontFamily="Inter_600SemiBold"
          textAnchor="end"
        >
          Low
        </SvgText>

        {/* Gradient Area Fill */}
        {areaPathD ? <Path d={areaPathD} fill="url(#chartGradient)" /> : null}

        {/* Main Glowing Line */}
        {pathD ? (
          <>
            <Path d={pathD} fill="none" stroke={colors.accent} strokeWidth={6} strokeOpacity={0.15} strokeLinecap="round" />
            <Path d={pathD} fill="none" stroke={colors.accent} strokeWidth={3} strokeLinecap="round" />
          </>
        ) : null}

        {/* Data Points and chronological labels */}
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
                <SvgText
                  x={p.x}
                  y={PADDING_TOP + graphHeight + 16}
                  fill={colors.textSub}
                  fontSize={9.5}
                  fontFamily="Inter_600SemiBold"
                  textAnchor="middle"
                >
                  {dateStr}
                </SvgText>
              )}

              {/* Glowing Halo Dot */}
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

  const [accordionOpen, setAccordionOpen] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showClinicalReportModal, setShowClinicalReportModal] = useState(false);

  // ── Weekly Report Limit ────────────────────────────────────────────────────
  const WEEKLY_LIMIT = 3;
  const getWeekKey = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `asthmasense_report_week_${now.getFullYear()}_${weekNum}`;
  };
  const [weeklyReportCount, setWeeklyReportCount] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(getWeekKey()).then((val) => {
      setWeeklyReportCount(val ? parseInt(val, 10) : 0);
    });
  }, []);

  const isLimitReached = weeklyReportCount >= WEEKLY_LIMIT;

  const incrementWeeklyCount = useCallback(async () => {
    const next = weeklyReportCount + 1;
    setWeeklyReportCount(next);
    await AsyncStorage.setItem(getWeekKey(), String(next));
  }, [weeklyReportCount]);

  // Load stores
  const token = useAuthStore((s: any) => s.token);
  const user = useAuthStore((s: any) => s.user);
  const streak = useAuthStore((s: any) => s.streak) || 0;
  const loginDates = useAuthStore((s: any) => s.loginDates) || [];
  const logs = useSymptomStore((s: any) => s.logs) || [];
  const sessions = useSessionStore((s: any) => s.sessions) || [];
  const reports = useAnalysisStore((s: any) => s.reports) || [];
  const isSyncing = useAuthStore((s: any) => s.isSyncing);

  const handleGenerateReport = async () => {
    if (isLimitReached) return;
    haptics.light();
    setLoadingReport(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    try {
      const bodyData = {
        logs: logs.slice(0, 15),
        reports: reports.slice(0, 10),
        sessions: sessions.slice(0, 10),
        streak,
        uniqueDaysLogged,
      };

      const response = await fetch(`${API_BASE_URL}/api/breathing/clinical-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        const result = await response.json();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setAiReport(result);
        await incrementWeeklyCount();
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

  const toggleAccordion = () => {
    haptics.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAccordionOpen(!accordionOpen);
  };

  // Dynamic values
  const uniqueDaysLogged = useMemo(() => {
    const daysSet = new Set([
      ...logs.map((l: any) => new Date(l.createdAt).toDateString()),
      ...reports.map((r: any) => new Date(r.date).toDateString()),
      ...loginDates.map((d: string) => new Date(d).toDateString()),
    ]);
    return daysSet.size;
  }, [logs, reports, loginDates]);

  const aiScans = useMemo(() => {
    return reports.length;
  }, [reports]);

  const averageRisk = useMemo(() => {
    if (reports.length === 0) return 0;
    const sum = reports.reduce((acc: number, curr: any) => {
      if (curr.riskLevel === 'High') return acc + 85;
      if (curr.riskLevel === 'Moderate') return acc + 50;
      return acc + 20;
    }, 0);
    return Math.round(sum / reports.length);
  }, [reports]);

  const stats = useMemo(() => [
    { label: 'Avg Risk', val: averageRisk > 0 ? averageRisk : 0, suffix: '%' },
    { label: 'Days Tracked', val: uniqueDaysLogged },
    { label: 'AI Scans', val: aiScans },
    { label: 'Sessions', val: sessions.length },
  ], [averageRisk, uniqueDaysLogged, aiScans, sessions]);

  // Dynamic AI summary text based on real logs
  const dynamicAiSummary = useMemo(() => {
    if (reports.length === 0 && logs.length === 0) {
      return `Welcome to your clinical dashboard! Record breathing analysis scans and daily symptom logs to generate a personalized AI summary. This summary will automatically highlight your risk index drop rates, environmental correlations, and targeted recovery recommendations.`;
    }
    
    const wheezeCount = reports.filter((r: any) => r.wheezingDetected === 'Yes').length;
    const activeRisk = averageRisk > 0 ? averageRisk : 24;
    const recommendedExStr = reports.length > 0 && reports[0].recommendedExercise !== 'none'
      ? `${reports[0].recommendedExercise} breathing`
      : 'Pursed Lip recovery exercises';

    return `Your computed respiratory risk average is currently ${activeRisk}%. Out of your saved audio analysis screenings, ${wheezeCount} session(s) detected wheezing acoustic spikes. Your completed breathing exercises (${sessions.length} sessions) indicate positive correlation with calmer night indexes. Recommended focus: Continue ${recommendedExStr} before bed and track local AQI.`;
  }, [reports, logs, averageRisk, sessions]);

  const handlePdfDownload = async () => {
    if (!aiReport) {
      Alert.alert('No Report Available', 'Please generate the clinical report first.');
      return;
    }

    haptics.success();
    try {
      const patientName = user?.name || 'Sarah';
      const patientAge = user?.profile?.age ? String(user.profile.age) : '32';
      const patientSeverity = user?.profile?.severity || 'Mild';
      const patientTriggers = user?.profile?.triggers && user.profile.triggers.length > 0
        ? user.profile.triggers.join(', ')
        : 'Pollen, dust';
      const patientInhaler = user?.profile?.inhaler || 'Albuterol';
      
      const actionItemsHtml = aiReport.actionPlan && aiReport.actionPlan.length > 0
        ? aiReport.actionPlan.map((item: string) => `
            <div class="checklist-item">
              <span class="checkmark">&#9745;</span>
              <span>${item}</span>
            </div>
          `).join('')
        : '<p style="color: #666; font-style: italic;">No specific clinical action items reported.</p>';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>AsthmaSense Clinical Report</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #333333;
              padding: 40px;
              line-height: 1.5;
            }
            .header-table {
              width: 100%;
              border-bottom: 2px solid #2D7DD2;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            .header-logo {
              font-size: 26px;
              font-weight: 700;
              color: #2D7DD2;
              letter-spacing: -0.5px;
            }
            .header-subtitle {
              font-size: 13px;
              color: #666666;
              margin-top: 4px;
            }
            .meta-table {
              width: 100%;
              margin-bottom: 30px;
              background: #F4F8FC;
              border: 1px solid #D6E4F0;
              border-radius: 6px;
              padding: 15px;
              border-collapse: collapse;
            }
            .meta-row {
              border-bottom: 1px solid #E2ECF5;
            }
            .meta-row:last-child {
              border-bottom: none;
            }
            .meta-cell {
              padding: 8px 12px;
              font-size: 13px;
            }
            .meta-label {
              font-weight: 700;
              color: #555555;
              text-transform: uppercase;
              font-size: 11px;
              width: 25%;
            }
            .meta-value {
              color: #111111;
            }
            .section-title {
              font-size: 15px;
              font-weight: 700;
              color: #2D7DD2;
              border-bottom: 1px solid #D6E4F0;
              padding-bottom: 6px;
              margin-top: 25px;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-box {
              background: #F4FAF5;
              border: 1px solid #E1F0E4;
              border-left: 4px solid #2ECC71;
              border-radius: 4px;
              padding: 15px;
              font-size: 13.5px;
              color: #2c3e50;
              margin-bottom: 20px;
            }
            .text-block {
              font-size: 13.5px;
              color: #333333;
              margin-bottom: 15px;
              text-align: justify;
            }
            .checklist-item {
              margin-bottom: 10px;
              font-size: 13.5px;
              display: flex;
              align-items: center;
            }
            .checkmark {
              color: #2D7DD2;
              font-weight: bold;
              margin-right: 10px;
              font-size: 16px;
            }
            .sig-table {
              width: 100%;
              margin-top: 50px;
              margin-bottom: 30px;
            }
            .sig-title {
              font-size: 12px;
              color: #666666;
              margin-bottom: 40px;
            }
            .sig-line {
              border-top: 1px solid #888888;
              width: 220px;
              text-align: center;
              padding-top: 6px;
              font-size: 12px;
              color: #666666;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #E6E6E6;
              padding-top: 15px;
              font-size: 11px;
              color: #888888;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="header-logo">ASTHMASENSE AI</div>
                <div class="header-subtitle">Clinical Pulmonology Report Summary</div>
              </td>
              <td style="text-align: right; font-size: 12px; color: #666666; vertical-align: bottom;">
                Report Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </td>
            </tr>
          </table>

          <table class="meta-table">
            <tr class="meta-row">
              <td class="meta-cell meta-label">PATIENT NAME</td>
              <td class="meta-cell meta-value" style="font-weight: 700;">${patientName}</td>
              <td class="meta-cell meta-label">AGE / GENDER</td>
              <td class="meta-cell meta-value">${patientAge} / --</td>
            </tr>
            <tr class="meta-row">
              <td class="meta-cell meta-label">SEVERITY STAGE</td>
              <td class="meta-cell meta-value">${patientSeverity}</td>
              <td class="meta-cell meta-label">PRESCRIBED INHALER</td>
              <td class="meta-cell meta-value">${patientInhaler}</td>
            </tr>
            <tr class="meta-row">
              <td class="meta-cell meta-label">KNOWN TRIGGERS</td>
              <td class="meta-cell meta-value" colspan="3">${patientTriggers}</td>
            </tr>
          </table>

          <div class="section-title">Executive Clinical Summary</div>
          <div class="summary-box">
            ${aiReport.clinicalSummary}
          </div>

          <div class="section-title">Trigger & Environmental Analysis</div>
          <div class="text-block">
            ${aiReport.triggerAnalysis}
          </div>

          <div class="section-title">Breathing Exercise Compliance</div>
          <div class="text-block">
            ${aiReport.complianceEvaluation}
          </div>

          <div class="section-title">Physician Action Plan & Guidance</div>
          <div style="margin-top: 10px; margin-bottom: 20px;">
            ${actionItemsHtml}
          </div>

          <table class="sig-table">
            <tr>
              <td>
                <div class="sig-title">Physician Notes & Review Comments:</div>
                <div style="height: 60px; border-bottom: 1px dashed #CCCCCC; width: 90%;"></div>
              </td>
              <td style="width: 250px; vertical-align: bottom;">
                <div class="sig-line">Attending Physician Signature</div>
              </td>
            </tr>
          </table>

          <div class="footer">
            Confidential Medical Document · Created via AsthmaSense Clinical Integration Suite · Ref: AS-${Math.floor(100000 + Math.random() * 900000)}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Clinical Report PDF', UTI: 'com.adobe.pdf' });
    } catch (e: any) {
      console.error('Failed to generate professional clinical PDF:', e);
      Alert.alert('PDF Error', 'Failed to generate clinical PDF file.');
    }
  };

  if (isSyncing && reports.length === 0 && logs.length === 0 && sessions.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.textSub, marginTop: 12 }}>
          Loading analysis history...
        </Text>
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


        {/* 2x2 Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </View>

        {/* Chart 1: Risk */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Respiratory Risk Index</Text>
          <Text style={[styles.graphSubtitle, { color: colors.textSub }]}>
            Visualizes expiratory restriction levels over successive audio analysis records. Higher scores represent higher wheeze and cough intensity.
          </Text>
          <RiskAreaChart reports={reports} />
        </View>



        {/* Groq-Powered AI Pulmonology Clinical Report Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Feather name="activity" size={18} color={colors.accent} />
            <Text style={[styles.cardTitleNoMargin, { color: colors.text, fontFamily: 'Inter_700Bold', flex: 1 }]}>Clinical Pulmonology Report</Text>
            {/* Weekly usage pill */}
            <View style={[
              {
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 10, paddingVertical: 4,
                borderRadius: 20, borderWidth: 1,
                backgroundColor: isLimitReached ? `${colors.danger}15` : `${colors.accent}12`,
                borderColor: isLimitReached ? `${colors.danger}40` : `${colors.accent}30`,
              }
            ]}>
              <Feather
                name={isLimitReached ? 'lock' : 'zap'}
                size={10}
                color={isLimitReached ? colors.danger : colors.accent}
              />
              <Text style={{
                fontFamily: 'Inter_700Bold', fontSize: 11,
                color: isLimitReached ? colors.danger : colors.accent,
                letterSpacing: 0.3,
              }}>
                {weeklyReportCount}/{WEEKLY_LIMIT} this week
              </Text>
            </View>
          </View>

          {loadingReport ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSub }}>AI is compiling your clinical logs...</Text>
            </View>
          ) : aiReport ? (
            <View style={{ gap: 10 }}>
              <Text style={[styles.cardDesc, { color: colors.textSub, marginTop: 0 }]}>
                Your pulmonology report has been successfully compiled. View the full baseline review or download the clinical copy.
              </Text>
              
              <View style={[styles.reportSection, { backgroundColor: colors.accentDim, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }]}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="info" size={14} color={colors.accent} />
                  <Text style={[styles.sectionHeadingLabel, { color: colors.accent, fontSize: 10, fontFamily: 'Inter_700Bold' }]}>LATEST EXECUTIVE SUMMARY</Text>
                </View>
                <Text style={[styles.sectionBodyText, { color: colors.text, fontSize: 13, marginTop: 6, lineHeight: 18 }]} numberOfLines={2}>
                  {aiReport.clinicalSummary}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <TouchableOpacity
                  onPress={() => { haptics.light(); setShowClinicalReportModal(true); }}
                  style={[styles.downloadBtn, { backgroundColor: colors.accent, flex: 1 }]}
                  activeOpacity={0.88}
                >
                  <Ionicons name="eye-outline" size={16} color="#fff" />
                  <Text style={styles.downloadBtnText}>View Clinical Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePdfDownload}
                  style={[styles.downloadBtn, { backgroundColor: colors.accentDim, width: 50, paddingHorizontal: 0 }]}
                  activeOpacity={0.88}
                >
                  <Feather name="download" size={16} color={colors.accent} />
                </TouchableOpacity>
              </View>

              {/* Generate Another Report button below existing report */}
              {isLimitReached ? (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  marginTop: 6, padding: 12, borderRadius: 12,
                  backgroundColor: `${colors.danger}10`,
                  borderWidth: 1, borderColor: `${colors.danger}20`,
                }}>
                  <Feather name="lock" size={14} color={colors.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.danger }}>Weekly limit reached</Text>
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSub, marginTop: 2, lineHeight: 16 }}>
                      You've used all 3 reports for this week. Come back next week to generate more.
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleGenerateReport}
                  disabled={loadingReport}
                  style={[styles.downloadBtn, { backgroundColor: colors.accentDim, marginTop: 6 }]}
                  activeOpacity={0.88}
                >
                  <Feather name="refresh-cw" size={14} color={colors.accent} />
                  <Text style={[styles.downloadBtnText, { color: colors.accent }]}>Generate Another Report</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <Text style={[styles.cardDesc, { color: colors.textSub, marginTop: 0 }]}>
                Generate a comprehensive pulmonology report analyzing your symptom trends, rescue inhaler usages, and breathing exercise logs. You can share this with your doctor.
              </Text>
              {logs.length === 0 && reports.length === 0 && sessions.length === 0 ? (
                <View style={{ marginTop: 4, padding: 12, borderRadius: 12, backgroundColor: `${colors.danger}10`, borderWidth: 1, borderColor: `${colors.danger}20` }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.danger }}>No tracking data available</Text>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSub, marginTop: 4, lineHeight: 16 }}>
                    Please log symptoms, record a breathing analysis, or complete respiratory exercises first to generate a report.
                  </Text>
                </View>
              ) : null}
              {isLimitReached ? (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  marginTop: 6, padding: 12, borderRadius: 12,
                  backgroundColor: `${colors.danger}10`,
                  borderWidth: 1, borderColor: `${colors.danger}20`,
                }}>
                  <Feather name="lock" size={14} color={colors.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.danger }}>Weekly limit reached</Text>
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSub, marginTop: 2, lineHeight: 16 }}>
                      You've used all 3 reports for this week. Come back next week to generate more.
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleGenerateReport}
                  disabled={logs.length === 0 && reports.length === 0 && sessions.length === 0}
                  style={[
                    styles.downloadBtn,
                    { backgroundColor: colors.accent, marginTop: 12 },
                    (logs.length === 0 && reports.length === 0 && sessions.length === 0) && { backgroundColor: colors.cardBorder, opacity: 0.6 }
                  ]}
                  activeOpacity={0.88}
                >
                  <Ionicons name="sparkles" size={16} color={logs.length === 0 && reports.length === 0 && sessions.length === 0 ? colors.textSub : "#fff"} />
                  <Text style={[styles.downloadBtnText, (logs.length === 0 && reports.length === 0 && sessions.length === 0) && { color: colors.textSub }]}>
                    {logs.length === 0 && reports.length === 0 && sessions.length === 0 ? 'No Data Available' : 'Generate Report'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Saved Audio Analyses Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub, marginBottom: 12 }]}>SAVED AUDIO ANALYSES</Text>
          {reports.length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, alignItems: 'center', padding: 24, borderRadius: 14, borderWidth: 1 }]}>
              <Feather name="mic-off" size={24} color={colors.textSub} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSub }}>No saved audio analyses found</Text>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, paddingVertical: 6, paddingHorizontal: 12 }]}>
              {reports.map((item: any, i: number) => {
                const dateStr = new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isHigh = item.riskLevel === 'High';
                const isMod = item.riskLevel === 'Moderate';
                const dotColor = isHigh ? colors.danger : isMod ? colors.amber : colors.mint;
                const dotBg = isHigh ? colors.dangerTint : isMod ? colors.amberTint : colors.mintTint;

                return (
                  <TouchableOpacity
                    key={item.id || i}
                    onPress={() => { haptics.light(); setSelectedReport(item); }}
                    activeOpacity={0.8}
                    style={[
                      styles.activityRow,
                      i < reports.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
                    ]}
                  >
                    <View style={[styles.activityIconContainer, { backgroundColor: dotBg }]}>
                      <Feather name="mic" size={16} color={dotColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text }} numberOfLines={1}>
                        AI Audio Scan: {item.riskLevel} Risk
                      </Text>
                      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSub, marginTop: 2 }}>
                        {dateStr} · {item.summary || 'Click to view details'}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={14} color={colors.textSub} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Clinical Pulmonology Report Modal */}
      <Modal
        visible={showClinicalReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowClinicalReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowClinicalReportModal(false)} />
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, maxHeight: '85%' }]}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="activity" size={20} color={colors.accent} />
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Clinical Pulmonology Report</Text>
              </View>
              <TouchableOpacity onPress={() => setShowClinicalReportModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={20} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            {aiReport && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 10 }}>
                {/* Patient Mini Banner */}
                <View style={{ backgroundColor: colors.bg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, gap: 4 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text }}>
                    Patient: {user?.name || 'Sarah'}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.textSub }}>
                    Age: {user?.profile?.age ? String(user.profile.age) : '32'} · Severity: {user?.profile?.severity || 'Mild'}
                  </Text>
                </View>

                {/* Section 1: Executive Summary */}
                <View style={[styles.reportSection, { backgroundColor: colors.accentDim, padding: 12, borderRadius: 10 }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Feather name="star" size={14} color={colors.accent} />
                    <Text style={[styles.sectionHeadingLabel, { color: colors.accent, fontSize: 11, fontFamily: 'Inter_700Bold', marginLeft: 6 }]}>EXECUTIVE SUMMARY</Text>
                  </View>
                  <Text style={[styles.sectionBodyText, { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 8 }]}>{aiReport.clinicalSummary}</Text>
                </View>

                {/* Section 2: Trigger Analysis */}
                <View style={[styles.reportSection, { backgroundColor: colors.bg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Feather name="zap" size={14} color={colors.amber} />
                    <Text style={[styles.sectionHeadingLabel, { color: colors.amber, fontSize: 11, fontFamily: 'Inter_700Bold', marginLeft: 6 }]}>TRIGGER & EXPOSURE ANALYSIS</Text>
                  </View>
                  <Text style={[styles.sectionBodyText, { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 8 }]}>{aiReport.triggerAnalysis}</Text>
                </View>

                {/* Section 3: Compliance Evaluation */}
                <View style={[styles.reportSection, { backgroundColor: colors.bg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Feather name="wind" size={14} color={colors.mint} />
                    <Text style={[styles.sectionHeadingLabel, { color: colors.mint, fontSize: 11, fontFamily: 'Inter_700Bold', marginLeft: 6 }]}>BREATHING EXERCISE EVALUATION</Text>
                  </View>
                  <Text style={[styles.sectionBodyText, { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 8 }]}>{aiReport.complianceEvaluation}</Text>
                </View>

                {/* Section 4: Pulmonary Action Plan Checklist */}
                <View style={[styles.reportSection, { backgroundColor: colors.bg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Feather name="list" size={14} color={colors.textSub} />
                    <Text style={[styles.sectionHeadingLabel, { color: colors.textSub, fontSize: 11, fontFamily: 'Inter_700Bold', marginLeft: 6 }]}>PULMONARY ACTION ITEMS</Text>
                  </View>
                  <View style={{ marginTop: 10, gap: 10 }}>
                    {aiReport.actionPlan && aiReport.actionPlan.map((item: string, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Feather name="check-square" size={14} color={colors.accent} />
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text, flex: 1 }}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Download PDF button inside Modal */}
                <TouchableOpacity
                  onPress={handlePdfDownload}
                  style={[styles.downloadBtn, { backgroundColor: colors.accent, marginTop: 8 }]}
                  activeOpacity={0.88}
                >
                  <Feather name="download" size={16} color="#fff" />
                  <Text style={styles.downloadBtnText}>Download PDF Summary</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Detailed Audio Report Modal */}
      <Modal
        visible={!!selectedReport}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setSelectedReport(null)} />
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="bar-chart-2" size={20} color={colors.accent} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Audio Analysis Details</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.modalCloseBtn}>
                <Feather name="x" size={20} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                
                {/* Risk Level Badge Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 99,
                      backgroundColor:
                        selectedReport.riskLevel === 'High'
                          ? colors.dangerTint
                          : selectedReport.riskLevel === 'Moderate'
                            ? colors.amberTint
                            : colors.mintTint,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter_700Bold',
                        fontSize: 12,
                        color:
                          selectedReport.riskLevel === 'High'
                            ? colors.danger
                            : selectedReport.riskLevel === 'Moderate'
                              ? colors.amber
                              : colors.mint,
                      }}
                    >
                      {selectedReport.riskLevel} Risk
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSub }}>
                    Confidence: {selectedReport.confidence}
                  </Text>
                </View>

                {/* 2x2 Grid of Metrics inside the Modal */}
                <View style={styles.modalGrid}>
                  {[
                    { icon: 'activity' as const, label: 'Respiratory Rate', val: selectedReport.rr || '16 bpm', color: colors.accent },
                    { icon: 'wind' as const, label: 'Wheezing Pattern', val: selectedReport.wheezePattern || (selectedReport.wheezingDetected === 'Yes' ? 'Audible whistle' : 'None detected'), color: colors.danger },
                    { icon: 'alert-circle' as const, label: 'Cough', val: selectedReport.pattern || 'None detected', color: colors.amber },
                    { icon: 'heart' as const, label: 'Regularity', val: selectedReport.regularity || '92%', color: colors.mint },
                  ].map((m) => (
                    <View
                      key={m.label}
                      style={[
                        styles.modalGridCard,
                        { backgroundColor: colors.bg, borderColor: colors.cardBorder },
                      ]}
                    >
                      <Feather name={m.icon} size={16} color={m.color} />
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.textSub, marginTop: 6 }} numberOfLines={1}>{m.label}</Text>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text, marginTop: 2 }} numberOfLines={1}>{m.val}</Text>
                    </View>
                  ))}
                </View>

                {/* Summary Section */}
                <View style={{ gap: 6 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text }}>Overview</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSub, lineHeight: 18 }}>
                    {selectedReport.summary}
                  </Text>
                </View>

                {/* Transcript Section */}
                {selectedReport.transcript && (
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text }}>Audio Transcript</Text>
                    <View style={{ padding: 12, borderRadius: 10, backgroundColor: colors.bg, borderLeftWidth: 3, borderLeftColor: colors.accent }}>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text, fontStyle: 'italic' }}>
                        "{selectedReport.transcript}"
                      </Text>
                    </View>
                  </View>
                )}

                {/* Clinical Findings Section */}
                {selectedReport.clinicalFindings && (
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text }}>Detailed Clinical Findings</Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSub, lineHeight: 18 }}>
                      {selectedReport.clinicalFindings}
                    </Text>
                  </View>
                )}

                {/* Action recommendations checklist */}
                {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text }}>Pulmonary Action Plan</Text>
                    <View style={{ gap: 8 }}>
                      {selectedReport.recommendations.map((rec: string, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                          <Feather name="check" size={14} color={colors.mint} style={{ marginTop: 2 }} />
                          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12.5, color: colors.textSub, flex: 1, lineHeight: 17 }}>
                            {rec}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 26 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  tabBarContainer: { flexDirection: 'row', padding: 4, borderRadius: 99, borderWidth: 1, marginBottom: 16, alignSelf: 'flex-start' },
  tabBtn: { height: 36, paddingHorizontal: 20, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 14, borderWidth: 1, padding: 16 },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, uppercase: true, letterSpacing: 1 } as any,
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 28, marginTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12, overflow: 'hidden' },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  cardTitleNoMargin: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  graphSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, marginTop: 4, marginBottom: 10 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartLabelText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accordionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accordionContent: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(74,158,255,0.06)' },
  summaryText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 12 },
  summaryBtn: { height: 38, borderRadius: 99, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  summaryBtnText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  cardDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2, marginBottom: 12 },
  inputsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  inputField: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 13 },
  downloadBtn: { height: 46, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  downloadBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 14 },
  reportSection: { borderRadius: 12, padding: 14, marginTop: 4 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionHeadingLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionBodyText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 },
  
  chartContainerEmpty: {
    height: 120,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  chartOverlayText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },

  sectionTitleHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginTop: 12,
  },
  seeAllBtn: {
    height: 38,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  section: {
    marginBottom: 24,
    marginTop: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
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
  historyDate: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  historyConfidence: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  historyBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  historySummary: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 6,
  },
  historyTranscriptBox: {
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  transcriptLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  transcriptText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
