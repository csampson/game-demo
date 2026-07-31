import { useState, useSyncExternalStore } from "react";
import { getHudState, subscribeHudState } from "./hudStore";
import { requestAttack, requestShield } from "./touchControlsStore";

const ATTACK_BUTTON_SIZE = 76;
const SHIELD_BUTTON_SIZE = 56;
const BUTTON_MARGIN = 24;
const BUTTON_GAP = 16;

export function TouchActionButtons() {
  const state = useSyncExternalStore(subscribeHudState, getHudState);
  const [attackPressed, setAttackPressed] = useState(false);
  const [shieldPressed, setShieldPressed] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
      <button
        onPointerDown={(event) => {
          event.preventDefault();
          requestShield();
          setShieldPressed(true);
        }}
        onPointerUp={() => setShieldPressed(false)}
        onPointerLeave={() => setShieldPressed(false)}
        style={{
          position: "fixed",
          right: BUTTON_MARGIN + (ATTACK_BUTTON_SIZE - SHIELD_BUTTON_SIZE) / 2,
          bottom: BUTTON_MARGIN + ATTACK_BUTTON_SIZE + BUTTON_GAP,
          width: SHIELD_BUTTON_SIZE,
          height: SHIELD_BUTTON_SIZE,
          padding: 0,
          borderRadius: "50%",
          background: state.isShielded ? "#3d7aa8" : "#1c3a52",
          border: `2px solid ${state.isShielded ? "#bdeeff" : "#66ccff"}`,
          color: "#99e6ff",
          fontSize: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
          touchAction: "none",
          cursor: "pointer",
          transform: shieldPressed ? "scale(0.92)" : "scale(1)",
          WebkitTapHighlightColor: "transparent"
        }}
      >
        🛡
      </button>

      <button
        onPointerDown={(event) => {
          event.preventDefault();
          requestAttack();
          setAttackPressed(true);
        }}
        onPointerUp={() => setAttackPressed(false)}
        onPointerLeave={() => setAttackPressed(false)}
        style={{
          position: "fixed",
          right: BUTTON_MARGIN,
          bottom: BUTTON_MARGIN,
          width: ATTACK_BUTTON_SIZE,
          height: ATTACK_BUTTON_SIZE,
          padding: 0,
          borderRadius: "50%",
          background: "#5a2323",
          border: "2px solid #d97a5a",
          color: "#ffcdb3",
          fontSize: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
          touchAction: "none",
          cursor: "pointer",
          transform: attackPressed ? "scale(0.92)" : "scale(1)",
          WebkitTapHighlightColor: "transparent"
        }}
      >
        ⚔
      </button>
    </div>
  );
}
