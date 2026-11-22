// Mini bus de notifications (toasts) sans dépendance
export interface ToastMsg {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}
type Listener = (t: ToastMsg) => void;
const listeners = new Set<Listener>();
let seq = 0;

export function toast(text: string, action?: ToastMsg['action']) {
  const t = { id: ++seq, text, action };
  listeners.forEach((l) => l(t));
}

export function onToast(l: Listener) {
  listeners.add(l);
  return () => void listeners.delete(l);
}
