import * as Phaser from "phaser";

const TEXTURE_KEY = "heart-pickup";
const DISPLAY_SIZE = 14;
const HEAL_AMOUNT = 1;
const BOB_AMPLITUDE = 3;
const BOB_PERIOD_MS = 1400;

export class HeartPickup {
  private readonly scene: Phaser.Scene;
  private readonly visual: Phaser.GameObjects.Image;
  private readonly baseY: number;
  private readonly spawnedAt: number;
  private collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.visual = scene.add.image(x, y, TEXTURE_KEY);
    this.visual.setDisplaySize(DISPLAY_SIZE, DISPLAY_SIZE);
    this.baseY = y;
    this.spawnedAt = scene.time.now;
  }

  static preload(scene: Phaser.Scene): void {
    scene.load.image(TEXTURE_KEY, new URL("../assets/pickups/heart.png", import.meta.url).href);
  }

  get x(): number {
    return this.visual.x;
  }

  get y(): number {
    return this.visual.y;
  }

  get healAmount(): number {
    return HEAL_AMOUNT;
  }

  get active(): boolean {
    return !this.collected;
  }

  update(): void {
    if (this.collected) return;

    const elapsed = this.scene.time.now - this.spawnedAt;
    const bobOffset = Math.sin((elapsed / BOB_PERIOD_MS) * Math.PI * 2) * BOB_AMPLITUDE;
    this.visual.y = this.baseY + bobOffset;
  }

  collect(): void {
    if (this.collected) return;

    this.collected = true;
    this.visual.destroy();
  }
}