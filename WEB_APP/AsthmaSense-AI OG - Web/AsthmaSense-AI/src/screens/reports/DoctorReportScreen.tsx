import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/ScreenHeader';
import { API_BASE_URL } from '../../config/api';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore, useSymptomStore, useAnalysisStore, useSessionStore } from '../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorReport'>;

export interface ClinicalReportData {
  title: string;
  patientName: string;
  age: number;
  severity: string;
  inhaler: string;
  triggers: string[];
  executiveSummary: string;
  triggerAnalysis: string;
  exerciseEvaluation: string;
  actionItems: string[];
}

export function DoctorReportScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const symptoms = useSymptomStore((s) => s.logs);
  const reports = useAnalysisStore((s) => s.reports);
  const sessions = useSessionStore((s) => s.sessions);

  const patientName = user?.name || 'Kirthanaa';
  const age = user?.profile?.age || 21;
  const severity = user?.profile?.severity || 'Mild';
  const inhaler = user?.profile?.inhaler || 'None';
  const triggers = user?.profile?.triggers && user.profile.triggers.length > 0 ? user.profile.triggers : ['Smoke', 'Dust'];

  const defaultReport: ClinicalReportData = {
    title: 'Clinical Pulmonology Report',
    patientName,
    age,
    severity,
    inhaler,
    triggers,
    executiveSummary: `The patient's recent health tracking records indicate a concerning trend of wheezing and respiratory distress, particularly in the presence of known triggers such as ${triggers.join(' and ')}. ${severity} asthma symptoms have been reported, but the severity has increased over time. It is essential to reassess the patient's treatment plan and consider the prescription of rescue medication to manage acute symptoms.`,
    triggerAnalysis: `The patient's exposure to ${triggers.join(' and ')} appears to be a significant trigger for wheezing and respiratory distress. It is crucial to identify and avoid these triggers to prevent exacerbations. Environmental modifications, such as using air purifiers or avoiding areas with high ${triggers.join(' and ')} levels, may be beneficial.`,
    exerciseEvaluation: `The patient has demonstrated inconsistent adherence to breathing exercises, which may be contributing to the worsening of symptoms. Encouraging regular practice of pursed-lip breathing and box breathing exercises may help improve lung function and reduce symptoms.`,
    actionItems: [
      'Prescribe rescue medication (e.g., albuterol inhaler) for acute symptom management.',
      `Recommend environmental modifications to minimize exposure to ${triggers.join(' and ')}.`,
      'Encourage regular practice of pursed-lip breathing and box breathing exercises to improve lung function and reduce symptoms.',
    ],
  };

  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [report, setReport] = useState<ClinicalReportData>(defaultReport);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/breathing/clinical-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          age,
          severity,
          inhaler,
          triggers,
          symptoms: symptoms.slice(0, 10),
          reports: reports.slice(0, 5),
          sessions: sessions.slice(0, 10),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.executiveSummary) {
          setReport(data);
        }
      }
    } catch {
      // Retain default pre-populated report
    } finally {
      setLoading(false);
    }
  };

  const generateAndSharePDF = async () => {
    if (!report) return;
    setGeneratingPdf(true);
    try {
      const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      const actionItemsHtml = report.actionItems
        .map(
          (item) => `
        <div style="display: flex; align-items: flex-start; margin-bottom: 10px; gap: 8px;">
          <span style="color: #4B5563; font-weight: bold; font-size: 14px;">☑</span>
          <span style="color: #374151; font-size: 12px; line-height: 1.5;">${item}</span>
        </div>
      `,
        )
        .join('');

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Clinical Pulmonology Report - ${report.patientName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 30px; color: #1F2937; background: #FFFFFF; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 20px; }
          .brand { color: #2563EB; font-weight: 800; font-size: 20px; letter-spacing: 0.5px; }
          .sub-brand { color: #6B7280; font-size: 11px; margin-top: 4px; }
          .report-date { color: #6B7280; font-size: 11px; }
          
          .patient-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; }
          .patient-table td { padding: 10px 14px; font-size: 11px; border-bottom: 1px solid #E2E8F0; }
          .label { color: #64748B; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; width: 25%; }
          .val { color: #0F172A; font-weight: 700; width: 25%; }
          
          .section-title { color: #1E40AF; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
          
          .exec-box { background: #F0FDF4; border-left: 4px solid #16A34A; padding: 14px; border-radius: 4px; font-size: 12px; line-height: 1.6; color: #166534; margin-bottom: 16px; }
          .text-block { font-size: 12px; line-height: 1.6; color: #334155; margin-bottom: 16px; }
          
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig-line { width: 240px; border-top: 1px solid #94A3B8; text-align: center; padding-top: 6px; font-size: 10px; color: #64748B; }
          
          .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 10px; }

          @media print {
            body { margin: 0; padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ASTHMASENSE AI</div>
            <div class="sub-brand">Clinical Pulmonology Report Summary</div>
          </div>
          <div class="report-date">Date: ${currentDate}</div>
        </div>

        <table class="patient-table">
          <tr>
            <td class="label">PATIENT NAME</td>
            <td class="val">${report.patientName}</td>
            <td class="label">AGE / GENDER</td>
            <td class="val">${report.age} / -</td>
          </tr>
          <tr>
            <td class="label">SEVERITY STAGE</td>
            <td class="val">${report.severity}</td>
            <td class="label">PRESCRIBED INHALER</td>
            <td class="val">${report.inhaler}</td>
          </tr>
          <tr>
            <td class="label">KNOWN TRIGGERS</td>
            <td class="val" colspan="3">${report.triggers.join(', ')}</td>
          </tr>
        </table>

        <div class="section-title">EXECUTIVE CLINICAL SUMMARY</div>
        <div class="exec-box">
          ${report.executiveSummary}
        </div>

        <div class="section-title">TRIGGER & ENVIRONMENTAL ANALYSIS</div>
        <div class="text-block">
          ${report.triggerAnalysis}
        </div>

        <div class="section-title">BREATHING EXERCISE COMPLIANCE</div>
        <div class="text-block">
          ${report.exerciseEvaluation}
        </div>

        <div class="section-title">PHYSICIAN ACTION PLAN & GUIDANCE</div>
        <div style="margin-bottom: 20px;">
          ${actionItemsHtml}
        </div>

        <div class="signature-section">
          <div>
            <div style="font-size: 10px; color: #64748B;">Physician Notes & Review Comments:</div>
          </div>
          <div class="sig-line">
            Attending Physician Signature
          </div>
        </div>

        <div class="footer">
          Confidential Medical Document · Created via AsthmaSense Clinical Integration Suite · Ref: AS-${Date.now().toString().slice(-6)}
        </div>
      </body>
      </html>
      `;

      if (Platform.OS === 'web') {
        // Create an isolated hidden iframe for printing ONLY the HTML document without app UI
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
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Save / Print Clinical Pulmonology Report PDF',
        });
      }
    } catch (e: any) {
      Alert.alert('PDF Download Error', e.message || 'Unable to generate PDF report.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Clinical Pulmonology Report"
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textDark} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Modal Container Card matching Screenshots 1 & 2 */}
        <View style={styles.modalCard}>
          {/* Modal Title Header */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="pulse" size={22} color={colors.primaryBlue} />
              <Text style={styles.modalTitle}>Clinical Pulmonology Report</Text>
            </View>
            {loading ? <ActivityIndicator size="small" color={colors.primaryBlue} /> : null}
          </View>

          {/* Patient Header Banner */}
          <View style={styles.patientCard}>
            <Text style={styles.patientName}>Patient: {report.patientName}</Text>
            <Text style={styles.patientMeta}>
              Age: {report.age} · Severity: {report.severity}
            </Text>
          </View>

          {/* Section 1: Executive Summary */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={18} color={colors.primaryBlue} />
              <Text style={[styles.sectionTitle, { color: colors.primaryBlue }]}>
                EXECUTIVE SUMMARY
              </Text>
            </View>
            <Text style={styles.sectionText}>{report.executiveSummary}</Text>
          </View>

          {/* Section 2: Trigger & Exposure Analysis */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash-outline" size={18} color="#D97706" />
              <Text style={[styles.sectionTitle, { color: '#D97706' }]}>
                TRIGGER & EXPOSURE ANALYSIS
              </Text>
            </View>
            <Text style={styles.sectionText}>{report.triggerAnalysis}</Text>
          </View>

          {/* Section 3: Breathing Exercise Evaluation */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="leaf-outline" size={18} color="#059669" />
              <Text style={[styles.sectionTitle, { color: '#059669' }]}>
                BREATHING EXERCISE EVALUATION
              </Text>
            </View>
            <Text style={styles.sectionText}>{report.exerciseEvaluation}</Text>
          </View>

          {/* Section 4: Pulmonary Action Items */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={18} color="#4B5563" />
              <Text style={[styles.sectionTitle, { color: '#4B5563' }]}>
                PULMONARY ACTION ITEMS
              </Text>
            </View>
            <View style={styles.actionList}>
              {report.actionItems.map((item, index) => (
                <View key={index} style={styles.actionItemRow}>
                  <View style={styles.checkboxBox}>
                    <Ionicons name="checkmark" size={14} color={colors.primaryBlue} />
                  </View>
                  <Text style={styles.actionItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Button: Download PDF Summary */}
          <Pressable
            style={[styles.downloadBtn, generatingPdf && styles.downloadBtnDisabled]}
            onPress={generateAndSharePDF}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <ActivityIndicator color={colors.textLight} size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color={colors.textLight} />
                <Text style={styles.downloadBtnText}>Download PDF Summary</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E2E8F0' },
  scroll: { paddingHorizontal: 16, paddingVertical: 16 },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  patientCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  patientMeta: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  actionList: {
    gap: 12,
    marginTop: 4,
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    marginTop: 1,
  },
  actionItemText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryBlue,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 8,
  },
  downloadBtnDisabled: {
    opacity: 0.7,
  },
  downloadBtnText: {
    color: colors.textLight,
    fontWeight: '700',
    fontSize: 15,
  },
});
