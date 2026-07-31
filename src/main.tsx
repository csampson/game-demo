import * as Phaser from "phaser";
import { createRoot } from "react-dom/client";
import { DungeonScene } from "./scenes/DungeonScene";
import { ForestScene } from "./scenes/ForestScene";
import { Hud } from "./ui/Hud";
import { VirtualJoystick } from "./ui/VirtualJoystick";
import { TouchActionButtons } from "./ui/TouchActionButtons";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: [ForestScene, DungeonScene]
};

new Phaser.Game(config);

const hudRoot = document.getElementById("hud-root")!;
createRoot(hudRoot).render(
  <>
    <Hud />
    <VirtualJoystick />
    <TouchActionButtons />
  </>
);