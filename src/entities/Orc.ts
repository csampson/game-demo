import * as Phaser from "phaser";

const FRAME_SIZE = 100;
const MOVE_SPEED = 90;
const MAX_HP = 20;
const HIT_COOLDOWN_MS = 500;
const HEALTH_BAR_WIDTH = 20;
const HEALTH_BAR_HEIGHT = 2;
const HEALTH_BAR_OFFSET_Y = -15;
const ATTACK_RANGE = 20;
const ATTACK_DAMAGE = 1;
const ATTACK_COOLDOWN_MS = 2000;
const KNOCKBACK_SPEED = 260;
const KNOCKBACK_DURATION_MS = 150;

export interface OrcAttackTarget {
  x: number;
  y: number;
  takeDamage(amount: number, sourceX?: number, sourceY?: number): void;
}

export class Orc extends Phaser.Physics.Arcade.Sprite {
  private dying = false;
  private hp = MAX_HP;
  private lastHitAt = -Infinity;
  private lastAttackAt = -Infinity;
  private knockbackUntil = -Infinity;
  private healthBarBackground: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "orc-walk");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setBodySize(40, 54);
    this.play("orc-walk");

    this.healthBarBackground = scene.add.rectangle(x - HEALTH_BAR_WIDTH / 2, y + HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, 0x2b2b33);
    this.healthBarBackground.setOrigin(0, 0.5);
    this.healthBarBackground.setDepth(1);
    this.healthBarFill = scene.add.rectangle(x - HEALTH_BAR_WIDTH / 2, y + HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, 0xcc2222);
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarFill.setDepth(2);

    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, this.handleAnimationComplete, this);
  }

  static preload(scene: Phaser.Scene): void {
    scene.load.spritesheet(
      "orc-walk",
      new URL("../assets/sprites/characters/Orc/Orc with shadows/Orc_Walk.png", import.meta.url).href,
      { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE }
    );
    scene.load.spritesheet(
      "orc-death",
      new URL("../assets/sprites/characters/Orc/Orc with shadows/Orc_Death.png", import.meta.url).href,
      { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE }
    );
    scene.load.spritesheet(
      "orc-attack",
      new URL("../assets/sprites/characters/Orc/Orc with shadows/Orc_Attack01.png", import.meta.url).href,
      { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE }
    );
  }

  static createAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists("orc-walk")) return;

    scene.anims.create({
      key: "orc-walk",
      frames: scene.anims.generateFrameNumbers("orc-walk"),
      frameRate: 10,
      repeat: -1
    });
    scene.anims.create({
      key: "orc-death",
      frames: scene.anims.generateFrameNumbers("orc-death"),
      frameRate: 10,
      repeat: 0
    });
    scene.anims.create({
      key: "orc-attack",
      frames: scene.anims.generateFrameNumbers("orc-attack"),
      frameRate: 10,
      repeat: 0
    });
  }

  get isDying(): boolean {
    return this.dying;
  }

  update(target: OrcAttackTarget): void {
    if (this.dying) return;

    if (this.scene.time.now < this.knockbackUntil) {
      this.updateHealthBar();
      return;
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    this.setFlipX(target.x < this.x);

    if (distance <= ATTACK_RANGE) {
      this.setVelocity(0, 0);
      if (this.anims.currentAnim?.key !== "orc-attack" || !this.anims.isPlaying) {
        this.play("orc-attack");
      }
      if (this.scene.time.now - this.lastAttackAt >= ATTACK_COOLDOWN_MS) {
        this.lastAttackAt = this.scene.time.now;
        target.takeDamage(ATTACK_DAMAGE, this.x, this.y);
      }
    } else {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      this.setVelocity(Math.cos(angle) * MOVE_SPEED, Math.sin(angle) * MOVE_SPEED);
      if (this.anims.currentAnim?.key !== "orc-walk") {
        this.play("orc-walk");
      }
    }

    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    const barX = this.x - HEALTH_BAR_WIDTH / 2;
    const barY = this.y + HEALTH_BAR_OFFSET_Y;
    this.healthBarBackground.setPosition(barX, barY);
    this.healthBarFill.setPosition(barX, barY);

    const ratio = Phaser.Math.Clamp(this.hp / MAX_HP, 0, 1);
    this.healthBarFill.width = HEALTH_BAR_WIDTH * ratio;
  }

  takeDamage(amount: number, sourceX?: number, sourceY?: number): void {
    if (this.dying) return;
    if (this.scene.time.now - this.lastHitAt < HIT_COOLDOWN_MS) return;

    this.lastHitAt = this.scene.time.now;
    this.hp = Math.max(0, this.hp - amount);
    this.applyKnockback(sourceX, sourceY);

    if (this.hp === 0) {
      this.die();
    }
  }

  private applyKnockback(sourceX?: number, sourceY?: number): void {
    if (sourceX === undefined || sourceY === undefined) return;

    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y);
    this.setVelocity(Math.cos(angle) * KNOCKBACK_SPEED, Math.sin(angle) * KNOCKBACK_SPEED);
    this.knockbackUntil = this.scene.time.now + KNOCKBACK_DURATION_MS;
  }

  private die(): void {
    this.dying = true;
    this.setVelocity(0, 0);
    this.disableBody(false, false);
    this.play("orc-death");
    this.healthBarBackground.destroy();
    this.healthBarFill.destroy();
  }

  private handleAnimationComplete(animation: Phaser.Animations.Animation): void {
    if (animation.key === "orc-death") {
      this.destroy();
    }
  }
}
