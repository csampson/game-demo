export interface JoystickVector {
  x: number;
  y: number;
}

let vector: JoystickVector = { x: 0, y: 0 };

export function getJoystickVector(): JoystickVector {
  return vector;
}

export function setJoystickVector(next: JoystickVector): void {
  vector = next;
}
