import { emitToast } from '@/utils/toastEmitter';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export function showToast(message: string, opts?: { duration?: number; type?: 'info' | 'success' | 'error' }) {
  emitToast({ id: uuidv4(), message, duration: opts?.duration, type: opts?.type ?? 'info' });
}

export default function useToast() {
  return { showToast };
}
