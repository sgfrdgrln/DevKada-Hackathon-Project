type Listener = (name: string) => void;

const listeners = new Set<Listener>();

export function emitNameChange(name: string) {
  listeners.forEach((listener) => listener(name));
}

export function subscribeToNameChange(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}