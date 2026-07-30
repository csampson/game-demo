import * as Phaser from "phaser";

const TEXTURE_KEY = "projectile-nugget";
const DISPLAY_SCALE = 0.05;
const SPEED = 350;
const MAX_LIFETIME_MS = 2000;
const DAMAGE = 8;
const SPIN_DEGREES_PER_SECOND = 360;

export class Projectile {
  private readonly scene: Phaser.Scene;
  private readonly visual: Phaser.GameObjects.Image;
  private readonly velocityX: number;
  private readonly velocityY: number;
  private readonly spawnedAt: number;
  private destroyed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, directionX: number, directionY: number) {
    this.scene = scene;
    this.visual = scene.add.image(x, y, TEXTURE_KEY);
    this.visual.setScale(DISPLAY_SCALE);

    this.velocityX = directionX * SPEED;
    this.velocityY = directionY * SPEED;
    this.spawnedAt = scene.time.now;
  }

  static preload(scene: Phaser.Scene): void {
    scene.load.image(TEXTURE_KEY, new URL("../assets/sprites/projectiles/nugget.png", import.meta.url).href);
  }

  get x(): number {
    return this.visual.x;
  }

  get y(): number {
    return this.visual.y;
  }

  get damage(): number {
    return DAMAGE;
  }

  get active(): boolean {
    return !this.destroyed;
  }

  update(deltaMs: number): void {
    if (this.destroyed) return;

    const deltaSeconds = deltaMs / 1000;
    this.visual.x += this.velocityX * deltaSeconds;
    this.visual.y += this.velocityY * deltaSeconds;
    this.visual.rotation += Phaser.Math.DegToRad(SPIN_DEGREES_PER_SECOND) * deltaSeconds;

    if (this.scene.time.now - this.spawnedAt >= MAX_LIFETIME_MS) {
      this.destroy();
    }
  }

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;
    this.visual.destroy();
  }
}
