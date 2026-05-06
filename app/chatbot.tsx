import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

import OpenAI from 'openai';

const groq = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export default function ChatbotScreen() {
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'assistant-1', role: 'assistant', text: 'Hi! Ask me anything about your expenses or budgets.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReply, setCurrentReply] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const chatDisabled = useMemo(() => loading || !input.trim(), [input, loading]);

  useEffect(() => {
    if (isTyping && currentReply) {
      const interval = setInterval(() => {
        setTypingIndex((prev) => {
          const next = prev + 1;
          if (next > currentReply.length) {
            setIsTyping(false);
            appendMessage('assistant', currentReply);
            setCurrentReply('');
            setTypingIndex(0);
            return 0;
          }
          return next;
        });
      }, 20);
      return () => clearInterval(interval);
    }
  }, [isTyping, currentReply]);

  const appendMessage = (role: ChatMessage['role'], text: string) => {
    setMessages((prev) => [...prev, { id: `${role}-${prev.length + 1}`, role, text }]);
  };

  const sendMessage = async () => {
  const text = input.trim();
  if (!text) return;

  setError(null);
  appendMessage('user', text);
  setInput('');
  setLoading(true);

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // fast + free tier
      messages: [
        {
          role: 'system',
          content: 'You are a helpful finance assistant. Help users understand expenses and budgets.',
        },
        ...messages.map((m) => ({
          role: m.role,
          content: m.text,
        })),
        {
          role: 'user',
          content: text,
        },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      'I could not generate a reply.';

    setCurrentReply(reply);
    setTypingIndex(0);
    setIsTyping(true);
  } catch (err: any) {
    console.error(err);
    setError(err.message || 'Groq request failed');
    appendMessage('assistant', 'There was an error contacting the chatbot.');
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}> 
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: activeColors.text }]}>AI Chatbot</Text>
          <Text style={[styles.subtitle, { color: activeColors.icon }]}>Ask about spending, budgets, or your finance insights.</Text>
        </View>

        <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
          {messages.concat(
            isTyping
              ? [{ id: 'typing', role: 'assistant' as const, text: currentReply.slice(0, typingIndex) }]
              : []
          ).map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'assistant'
                  ? [
                      styles.botBubble,
                      {
                        backgroundColor: theme === 'light' ? '#F0F3FF' : '#21163C',
                        borderColor: theme === 'light' ? '#CBD5E1' : '#39324A',
                      },
                    ]
                  : [
                      styles.userBubble,
                      {
                        backgroundColor: theme === 'light' ? '#D9E0FF' : '#3C1F6A',
                        borderColor: theme === 'light' ? '#C7D2FE' : '#332655',
                      },
                    ],
              ]}
            >
              <Text style={[styles.messageText, { color: theme === 'light' ? '#111827' : activeColors.text }]}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>

        {error ? <Text style={[styles.errorText, { color: theme === 'light' ? '#B00020' : '#FF7D7D' }]}>{error}</Text> : null}

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { backgroundColor: theme === 'light' ? '#F2F4F7' : '#1D1433', color: activeColors.text, borderColor: theme === 'light' ? '#D6D9E2' : '#3F3B4B' }]}
            value={input}
            onChangeText={setInput}
            placeholder="Type a question..."
            placeholderTextColor={theme === 'light' ? '#9A9AA8' : '#999'}
            editable={!loading}
            multiline
          />
          <Pressable
            onPress={sendMessage}
            style={[styles.sendButton, chatDisabled && styles.sendButtonDisabled]}
            disabled={chatDisabled}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Send</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0C19',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#A39CB5',
    fontSize: 14,
  },
  messages: {
    flex: 1,
    marginBottom: 12,
  },
  messagesContent: {
    paddingBottom: 12,
  },
  messageBubble: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    maxWidth: '85%',
  },
  botBubble: {
    backgroundColor: '#21163C',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#3C1F6A',
    alignSelf: 'flex-end',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    backgroundColor: '#1D1433',
    color: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  sendButton: {
    width: 72,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#723FEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
