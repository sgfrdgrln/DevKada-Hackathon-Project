import { subscribeToToasts, ToastPayload } from '@/utils/toastEmitter';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

function ToastItem({ payload, onDone }: { payload: ToastPayload; onDone: () => void }) {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onDone());
    }, payload.duration ?? 3000);
    return () => clearTimeout(timer);
  }, [opacity, payload.duration, onDone]);

  const bg = payload.type === 'error' ? '#FF6B6B' : payload.type === 'success' ? '#2ECC71' : '#333';

  return (
    <Animated.View style={[styles.toast, { opacity, backgroundColor: bg }]}> 
      <Text style={styles.text}>{payload.message}</Text>
    </Animated.View>
  );
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((payload) => {
      setToasts((prev) => [...prev, payload]);
    });
    return unsubscribe;
  }, []);

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          payload={t}
          onDone={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
    minWidth: 160,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    color: '#fff',
  },
});
