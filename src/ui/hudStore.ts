export interface HudState {
  hp: number;
  maxHp: number;
  isShielded: boolean;
}

const listeners = new Set<() => void>();

let state: HudState = { hp: 0, maxHp: 0, isShielded: false };

export function getHudState(): HudState {
  return state;
}

export function setHudState(next: HudState): void {
  if (state.hp === next.hp && state.maxHp === next.maxHp && state.isShielded === next.isShielded) {
    return;
  }

  state = next;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeHudState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}