import React, { useRef, useState } from 'react';
import {
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

type Props = NativeStackScreenProps<RootStackParamList, 'AIChat'>;

type Msg = { text: string; isUser: boolean };

const INITIAL: Msg[] = [
  { text: "Hi Isaac! I'm your AsthmaSense AI. How can I help?", isUser: false },
  { text: 'What to do during an attack?', isUser: true },
  {
    text: 'If you feel a sudden attack: 1) Take 1 puff of your inhaler, 2) Sit down, 3) Learn to start a breathing guide!',
    isUser: false,
  },
];

const QUICK_REPLIES = ['Breathing exercise', 'Medication help', 'Sleep tips', 'Emergency'];

export function AIChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const send = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages((m) => [
      ...m,
      { text: msg, isUser: true },
      { text: 'I understand. Let me help you with that...', isUser: false },
    ]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
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
          <Text style={styles.online}>Online</Text>
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
                  item.isUser ? styles.bubbleUser : styles.bubbleAi,
                ]}
              >
                <Text style={[styles.bubbleText, item.isUser && styles.bubbleTextUser]}>
                  {item.text}
                </Text>
              </View>
            </View>
          )}
        />
        <View style={styles.quickBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QUICK_REPLIES.map((r) => (
              <Pressable key={r} style={styles.quickChip} onPress={() => send(r)}>
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
            />
          </View>
          <Pressable style={styles.sendBtn} onPress={() => send()}>
            <Ionicons name="send" size={20} color={colors.textLight} />
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
    paddingBottom: 4,
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
  messages: { paddingHorizontal: 16, paddingVertical: 8 },
  bubbleWrap: { alignSelf: 'flex-start', marginVertical: 4, maxWidth: '80%' },
  bubbleWrapUser: { alignSelf: 'flex-end' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleUser: { backgroundColor: colors.primaryBlue },
  bubbleAi: { backgroundColor: colors.cardWhite },
  bubbleText: { fontSize: 14, color: colors.textDark },
  bubbleTextUser: { color: colors.textLight },
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
});
