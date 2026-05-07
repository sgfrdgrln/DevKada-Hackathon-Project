export type MonthlyIncomeChangeEvent = {
  type: 'update' | 'delete';
  income: number | null;
};

type Listener = (event: MonthlyIncomeChangeEvent) => void;

const listeners = new Set<Listener>();

export function emitMonthlyIncomeChange(event: MonthlyIncomeChangeEvent) {
  listeners.forEach((listener) => listener(event));
}

export function subscribeToMonthlyIncomeChange(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
