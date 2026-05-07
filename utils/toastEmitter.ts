export type ToastPayload = {
  id: string;
  message: string;
  duration?: number; // ms
  type?: 'info' | 'success' | 'error';
};

type Listener = (payload: ToastPayload) => void;

const listeners = new Set<Listener>();

export function emitToast(payload: ToastPayload) {
  listeners.forEach((l) => l(payload));
}

export function subscribeToToasts(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
