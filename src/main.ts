import * as Phaser from "phaser";
import { MainScene } from "./scenes/MainScene";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight
  },
  scene: [MainScene]
};

new Phaser.Game(config);
