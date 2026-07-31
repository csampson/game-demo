let attackRequested = false;
let shieldRequested = false;

export function requestAttack(): void {
  attackRequested = true;
}

export function consumeAttackRequest(): boolean {
  if (!attackRequested) return false;
  attackRequested = false;
  return true;
}

export function requestShield(): void {
  shieldRequested = true;
}

export function consumeShieldRequest(): boolean {
  if (!shieldRequested) return false;
  shieldRequested = false;
  return true;
}
