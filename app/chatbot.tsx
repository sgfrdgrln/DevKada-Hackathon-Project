import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
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

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'assistant-1', role: 'assistant', text: 'Hi! Ask me anything about your expenses or budgets.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatDisabled = useMemo(() => loading || !input.trim(), [input, loading]);

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

    if (!GEMINI_API_KEY) {
      setError('Gemini API key is not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to .env.');
      appendMessage('assistant', 'Unable to send your message because the API key is missing.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const apiError = data?.error?.message || data?.message || response.statusText;
        throw new Error(`Gemini error ${response.status}: ${apiError}`);
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.message ||
        'I could not generate a reply. Please try again.';

      appendMessage('assistant', reply);
    } catch (fetchError: any) {
      console.error(fetchError);
      const message = fetchError?.message || 'There was an error contacting the chatbot.';
      setError(`Failed to contact Gemini: ${message}`);
      appendMessage('assistant', 'There was an error contacting the chatbot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>AI Chatbot</Text>
          <Text style={styles.subtitle}>Ask about spending, budgets, or your finance insights.</Text>
        </View>

        <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'assistant' ? styles.botBubble : styles.userBubble,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a question..."
            placeholderTextColor="#999"
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
    color: '#FF6B6B',
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
