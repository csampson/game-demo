import { useRef, useState } from "react";
import { setJoystickVector } from "./joystickStore";

const BASE_RADIUS = 55;
const THUMB_RADIUS = 26;
const MAX_DISTANCE = 50;

export function VirtualJoystick() {
  const [base, setBase] = useState<{ x: number; y: number } | null>(null);
  const [thumb, setThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (pointerIdRef.current !== null) return;

    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setBase({ x: event.clientX, y: event.clientY });
    setThumb({ x: 0, y: 0 });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    if (pointerIdRef.current !== event.pointerId || !base) return;

    const dx = event.clientX - base.x;
    const dy = event.clientY - base.y;
    const distance = Math.min(Math.hypot(dx, dy), MAX_DISTANCE);
    const angle = Math.atan2(dy, dx);
    const clampedX = Math.cos(angle) * distance;
    const clampedY = Math.sin(angle) * distance;

    setThumb({ x: clampedX, y: clampedY });
    setJoystickVector({ x: clampedX / MAX_DISTANCE, y: clampedY / MAX_DISTANCE });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>): void {
    if (pointerIdRef.current !== event.pointerId) return;

    pointerIdRef.current = null;
    setBase(null);
    setThumb({ x: 0, y: 0 });
    setJoystickVector({ x: 0, y: 0 });
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "50%",
        height: "100%",
        pointerEvents: "auto",
        touchAction: "none"
      }}
    >
      {base && (
        <>
          <div
            style={{
              position: "fixed",
              left: base.x - BASE_RADIUS,
              top: base.y - BASE_RADIUS,
              width: BASE_RADIUS * 2,
              height: BASE_RADIUS * 2,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "2px solid rgba(255,255,255,0.35)",
              pointerEvents: "none"
            }}
          />
          <div
            style={{
              position: "fixed",
              left: base.x + thumb.x - THUMB_RADIUS,
              top: base.y + thumb.y - THUMB_RADIUS,
              width: THUMB_RADIUS * 2,
              height: THUMB_RADIUS * 2,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.55)",
              border: "2px solid rgba(255,255,255,0.7)",
              pointerEvents: "none"
            }}
          />
        </>
      )}
    </div>
  );
}
