import { useSyncExternalStore } from "react";
import { getHudState, subscribeHudState } from "./hudStore";

const heroIdleSheetUrl = new URL(
  "../assets/sprites/characters/Soldier/Soldier with shadows/Soldier_Idle.png",
  import.meta.url
).href;

const FRAME_SIZE = 100;
const PORTRAIT_SIZE = 48;
const HEALTH_BAR_WIDTH = 160;
const HEALTH_BAR_HEIGHT = 14;
const SHIELD_ICON_SIZE = 32;

export function Hud() {
  const state = useSyncExternalStore(subscribeHudState, getHudState);
  const healthRatio = state.maxHp > 0 ? Math.max(0, Math.min(1, state.hp / state.maxHp)) : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: "sans-serif"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: PORTRAIT_SIZE,
            height: PORTRAIT_SIZE,
            overflow: "hidden",
            background: "#2b2b33",
            border: "2px solid #4a4a55",
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: FRAME_SIZE,
              height: FRAME_SIZE,
              backgroundImage: `url(${heroIdleSheetUrl})`,
              backgroundPosition: "0 0",
              transform: `scale(${PORTRAIT_SIZE / FRAME_SIZE})`,
              transformOrigin: "top left",
              imageRendering: "pixelated"
            }}
          />
        </div>

        <div>
          <div
            style={{
              position: "relative",
              width: HEALTH_BAR_WIDTH,
              height: HEALTH_BAR_HEIGHT,
              background: "#2b2b33",
              border: "1px solid #35353f"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: `${healthRatio * 100}%`,
                background: "#b33c3c"
              }}
            />
          </div>
          <div style={{ color: "#e8e8ee", fontSize: 11, marginTop: 2 }}>
            {state.hp}/{state.maxHp}
          </div>
        </div>
      </div>

      <div
        style={{
          width: SHIELD_ICON_SIZE,
          height: SHIELD_ICON_SIZE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: state.isShielded ? "#3d7aa8" : "#1c3a52",
          border: `2px solid ${state.isShielded ? "#bdeeff" : "#66ccff"}`,
          color: "#99e6ff",
          fontSize: 16,
          fontWeight: "bold"
        }}
      >
        B
      </div>
    </div>
  );
}