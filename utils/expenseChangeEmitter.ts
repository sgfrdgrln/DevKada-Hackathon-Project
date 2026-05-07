export type ExpenseChangeEvent = {
  type: 'create' | 'update' | 'delete';
  id: string;
};

type Listener = (event: ExpenseChangeEvent) => void;

const listeners = new Set<Listener>();

export function emitExpenseChange(event: ExpenseChangeEvent) {
  listeners.forEach((listener) => listener(event));
}

export function subscribeToExpenseChange(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
