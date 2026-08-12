import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { cardShadow } from '../../theme/shadows';
import { RootStackParamList } from '../../navigation/types';
import { sendChatMessage, fetchChatHistory } from '../../services/aiChatService';

type Props = NativeStackScreenProps<RootStackParamList, 'AIChat'>;

type Msg = { text: string; isUser: boolean; isError?: boolean };

const INITIAL: Msg[] = [
  { text: "Hi! I'm your AsthmaSense AI powered by Grok. How can I help you today?", isUser: false },
];

const QUICK_REPLIES = ['Breathing exercise', 'Medication help', 'Sleep tips', 'Emergency'];

export function AIChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Load chat history from MongoDB on screen mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await fetchChatHistory('default');
        if (history.length > 0) {
          const formatted: Msg[] = history.map((item) => ({
            text: item.content,
            isUser: item.role === 'user',
          }));
          setMessages(formatted);
        }
      } catch {
        // Fallback to default initial message
      }
    }
    loadHistory();
  }, []);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMessage: Msg = { text: msg, isUser: true };
    const historyPayload = messages.map((m) => ({
      role: (m.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await sendChatMessage(msg, historyPayload);
      setMessages((prev) => [...prev, { text: response.reply, isUser: false }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          text: err.message || 'Failed to communicate with AsthmaSense AI. Please check server connection.',
          isUser: false,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.textDark} />
        </Pressable>
        <View style={styles.appBar}>
          <View style={styles.aiAvatar}>
            <Ionicons name="cloud-outline" size={18} color={colors.textLight} />
          </View>
          <View>
            <Text style={styles.aiTitle}>AsthmaSense AI</Text>
            <Text style={styles.online}>Online • Grok AI & MongoDB</Text>
          </View>
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => (
            <View style={[styles.bubbleWrap, item.isUser && styles.bubbleWrapUser]}>
              <View
                style={[
                  styles.bubble,
                  cardShadow,
                  item.isUser ? styles.bubbleUser : item.isError ? styles.bubbleError : styles.bubbleAi,
                ]}
              >
                <Text style={[styles.bubbleText, item.isUser && styles.bubbleTextUser, item.isError && styles.bubbleTextError]}>
                  {item.text}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            loading ? (
              <View style={[styles.bubbleWrap, styles.loadingWrap]}>
                <View style={[styles.bubble, styles.bubbleAi, styles.loadingBubble]}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                  <Text style={styles.loadingText}>Grok AI is thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />
        <View style={styles.quickBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QUICK_REPLIES.map((r) => (
              <Pressable key={r} style={styles.quickChip} onPress={() => send(r)} disabled={loading}>
                <Text style={styles.quickText}>{r}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything..."
              placeholderTextColor={colors.textGrey}
              style={styles.input}
              onSubmitEditing={() => send()}
              editable={!loading}
            />
          </View>
          <Pressable style={[styles.sendBtn, loading && styles.sendBtnDisabled]} onPress={() => send()} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.textLight} />
            ) : (
              <Ionicons name="send" size={20} color={colors.textLight} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEFF5',
  },
  backBtn: { width: 40, alignItems: 'center' },
  appBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { fontSize: 15, fontWeight: '600', color: colors.textDark },
  online: { fontSize: 11, color: colors.greenSuccess },
  messages: { paddingHorizontal: 16, paddingVertical: 12 },
  bubbleWrap: { alignSelf: 'flex-start', marginVertical: 4, maxWidth: '82%' },
  bubbleWrapUser: { alignSelf: 'flex-end' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleUser: { backgroundColor: colors.primaryBlue },
  bubbleAi: { backgroundColor: colors.cardWhite },
  bubbleError: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  bubbleText: { fontSize: 14, color: colors.textDark, lineHeight: 20 },
  bubbleTextUser: { color: colors.textLight },
  bubbleTextError: { color: '#991B1B' },
  loadingWrap: { marginVertical: 6 },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13, color: colors.textGrey },
  quickBar: {
    backgroundColor: colors.cardWhite,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickChip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: `${colors.primaryBlue}1A`,
    borderWidth: 1,
    borderColor: `${colors.primaryBlue}4D`,
  },
  quickText: { color: colors.primaryBlue, fontSize: 12, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.cardWhite,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: 24,
    paddingHorizontal: 14,
  },
  input: { paddingVertical: 10, fontSize: 14 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
});
