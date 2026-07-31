import * as Phaser from "phaser";
import { getJoystickVector } from "../ui/joystickStore";
import { consumeAttackRequest, consumeShieldRequest } from "../ui/touchControlsStore";

const FRAME_SIZE = 100;
const MOVE_SPEED = 160;
const MAX_HP = 5;
const INVULNERABILITY_MS = 800;
const HURT_FLICKER_INTERVAL_MS = 80;
const SHIELD_DURATION_MS = 1500;
const SHIELD_MAX_ABSORB = 3;
const SHIELD_RADIUS = 20;
const BASE_ATTACK_DAMAGE = 10;
const EMPOWERED_ATTACK_DAMAGE = 20;
const EMPOWER_DURATION_MS = 3000;
const AURA_SCALE = 1.25;
const AURA_TINT = 0x8fd8ff;
const AURA_ALPHA = 0.8;
const PROJECTILE_COOLDOWN_MS = 500;
const KNOCKBACK_SPEED = 220;
const KNOCKBACK_DURATION_MS = 150;
const ATTACK_COOLDOWN_MS = 500;
const JOYSTICK_DEADZONE = 0.15;

export interface ProjectileSpawn {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
}

export class Hero extends Phaser.Physics.Arcade.Sprite {
  private keys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    attack: Phaser.Input.Keyboard.Key;
    shield: Phaser.Input.Keyboard.Key;
  };
  private attacking = false;
  private lastAttackAt = -Infinity;
  private facingLeft = false;
  private lastProjectileFiredAt = -Infinity;
  private currentHp = MAX_HP;
  private dead = false;
  private lastHitAt = -Infinity;
  private knockbackUntil = -Infinity;
  private shieldActive = false;
  private shieldAbsorbed = 0;
  private shieldActivatedAt = -Infinity;
  private shieldVisual: Phaser.GameObjects.Arc;
  private empoweredUntil = -Infinity;
  private auraVisual: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "soldier-idle");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.play("soldier-idle");

    const keyboard = scene.input.keyboard!;
    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      attack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      shield: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B)
    };

    this.shieldVisual = scene.add.circle(x, y, SHIELD_RADIUS, 0x66ccff, 0.35);
    this.shieldVisual.setStrokeStyle(2, 0x99e6ff, 0.8);
    this.shieldVisual.setDepth(5);
    this.shieldVisual.setVisible(false);

    this.auraVisual = scene.add.sprite(x, y, "soldier-idle");
    this.auraVisual.setTint(AURA_TINT);
    this.auraVisual.setTintMode(Phaser.TintModes.FILL);
    this.auraVisual.setAlpha(AURA_ALPHA);
    this.auraVisual.setScale(AURA_SCALE);
    this.auraVisual.setDepth(-0.5);
    this.auraVisual.setVisible(false);

    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, this.handleAnimationComplete, this);
  }

  static preload(scene: Phaser.Scene): void {
    scene.load.spritesheet(
      "soldier-idle",
      new URL("../assets/sprites/characters/Soldier/Soldier with shadows/Soldier_Idle.png", import.meta.url).href,
      { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE }
    );
    scene.load.spritesheet(
      "soldier-walk",
      new URL("../assets/sprites/characters/Soldier/Soldier with shadows/Soldier_Walk.png", import.meta.url).href,
      { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE }
    );
    scene.load.spritesheet(
      "soldier-attack",
      new URL("../assets/sprites/characters/Soldier/Soldier with shadows/Soldier_Attack01.png", import.meta.url).href,
      { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE }
    );
    scene.load.spritesheet(
      "soldier-hurt",
      new URL("../assets/sprites/characters/Soldier/Soldier with shadows/Soldier_Hurt.png", import.meta.url).href,
      { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE }
    );
    scene.load.spritesheet(
      "soldier-death",
      new URL("../assets/sprites/characters/Soldier/Soldier with shadows/Soldier_Death.png", import.meta.url).href,
      { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE }
    );
  }

  static createAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists("soldier-idle")) return;

    scene.anims.create({
      key: "soldier-idle",
      frames: scene.anims.generateFrameNumbers("soldier-idle"),
      frameRate: 8,
      repeat: -1
    });
    scene.anims.create({
      key: "soldier-walk",
      frames: scene.anims.generateFrameNumbers("soldier-walk"),
      frameRate: 12,
      repeat: -1
    });
    scene.anims.create({
      key: "soldier-attack",
      frames: scene.anims.generateFrameNumbers("soldier-attack"),
      frameRate: 20,
      repeat: 0
    });
    scene.anims.create({
      key: "soldier-hurt",
      frames: scene.anims.generateFrameNumbers("soldier-hurt"),
      frameRate: 10,
      repeat: 0
    });
    scene.anims.create({
      key: "soldier-death",
      frames: scene.anims.generateFrameNumbers("soldier-death"),
      frameRate: 8,
      repeat: 0
    });
  }

  get isAttacking(): boolean {
    return this.attacking;
  }

  get isDead(): boolean {
    return this.dead;
  }

  get hp(): number {
    return this.currentHp;
  }

  get maxHp(): number {
    return MAX_HP;
  }

  get isShielded(): boolean {
    return this.shieldActive;
  }

  get attackDamage(): number {
    return this.scene.time.now < this.empoweredUntil ? EMPOWERED_ATTACK_DAMAGE : BASE_ATTACK_DAMAGE;
  }

  takeDamage(amount: number, sourceX?: number, sourceY?: number): void {
    if (this.dead) return;

    if (this.shieldActive) {
      this.shieldAbsorbed += amount;
      this.activateEmpower();
      if (this.shieldAbsorbed >= SHIELD_MAX_ABSORB) {
        this.deactivateShield();
      }
      return;
    }

    if (this.scene.time.now - this.lastHitAt < INVULNERABILITY_MS) return;

    this.lastHitAt = this.scene.time.now;
    this.currentHp = Math.max(0, this.currentHp - amount);
    this.applyKnockback(sourceX, sourceY);

    if (this.currentHp === 0) {
      this.die();
    } else {
      this.attacking = false;
      this.play("soldier-hurt");
    }
  }

  heal(amount: number): void {
    if (this.dead) return;

    this.currentHp = Math.min(MAX_HP, this.currentHp + amount);
  }

  private applyKnockback(sourceX?: number, sourceY?: number): void {
    if (sourceX === undefined || sourceY === undefined) return;

    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y);
    this.setVelocity(Math.cos(angle) * KNOCKBACK_SPEED, Math.sin(angle) * KNOCKBACK_SPEED);
    this.knockbackUntil = this.scene.time.now + KNOCKBACK_DURATION_MS;
  }

  private die(): void {
    this.dead = true;
    this.setVelocity(0, 0);
    this.play("soldier-death");
  }

  tryFireProjectile(targetX: number, targetY: number): ProjectileSpawn | null {
    if (this.dead) return null;
    if (this.scene.time.now - this.lastProjectileFiredAt < PROJECTILE_COOLDOWN_MS) return null;

    this.lastProjectileFiredAt = this.scene.time.now;

    const direction = new Phaser.Math.Vector2(targetX - this.x, targetY - this.y).normalize();

    return {
      x: this.x,
      y: this.y,
      directionX: direction.x,
      directionY: direction.y
    };
  }

  private activateShield(): void {
    this.shieldActive = true;
    this.shieldAbsorbed = 0;
    this.shieldActivatedAt = this.scene.time.now;
    this.shieldVisual.setVisible(true);
  }

  private deactivateShield(): void {
    this.shieldActive = false;
    this.shieldVisual.setVisible(false);
  }

  private updateShield(): void {
    const shieldPressed = Phaser.Input.Keyboard.JustDown(this.keys.shield);
    const shieldTapped = consumeShieldRequest();

    if ((shieldPressed || shieldTapped) && !this.shieldActive) {
      this.activateShield();
    }

    if (!this.shieldActive) return;

    this.shieldVisual.setPosition(this.x, this.y);

    if (this.scene.time.now - this.shieldActivatedAt >= SHIELD_DURATION_MS) {
      this.deactivateShield();
    }
  }

  private activateEmpower(): void {
    this.empoweredUntil = this.scene.time.now + EMPOWER_DURATION_MS;
  }

  private updateEmpower(): void {
    const active = this.scene.time.now < this.empoweredUntil;
    this.auraVisual.setVisible(active);
    if (active) {
      this.auraVisual.setPosition(this.x, this.y);
      this.auraVisual.setFlipX(this.flipX);
      this.auraVisual.setTexture(this.texture.key, this.frame.name);
    }
  }

  private handleAnimationComplete(animation: Phaser.Animations.Animation): void {
    if (animation.key === "soldier-attack") {
      this.attacking = false;
    }
  }

  update(): void {
    if (this.dead) return;

    this.updateHurtFlicker();
    this.updateShield();
    this.updateEmpower();

    if (this.scene.time.now < this.knockbackUntil) {
      return;
    }

    const attackPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack);
    const attackTapped = consumeAttackRequest();

    if (
      (attackPressed || attackTapped) &&
      !this.attacking &&
      this.scene.time.now - this.lastAttackAt >= ATTACK_COOLDOWN_MS
    ) {
      this.attacking = true;
      this.lastAttackAt = this.scene.time.now;
      this.setVelocity(0, 0);
      this.play("soldier-attack");
      return;
    }

    if (this.attacking) {
      return;
    }

    const joystick = getJoystickVector();
    const joystickVector = new Phaser.Math.Vector2(joystick.x, joystick.y);

    let inputVector: Phaser.Math.Vector2;
    if (joystickVector.length() > JOYSTICK_DEADZONE) {
      inputVector = joystickVector;
    } else {
      const moveX = (this.keys.right.isDown ? 1 : 0) - (this.keys.left.isDown ? 1 : 0);
      const moveY = (this.keys.down.isDown ? 1 : 0) - (this.keys.up.isDown ? 1 : 0);
      inputVector = new Phaser.Math.Vector2(moveX, moveY);
      if (inputVector.length() > 0) {
        inputVector.normalize();
      }
    }

    const velocity = inputVector.clone().scale(MOVE_SPEED);
    this.setVelocity(velocity.x, velocity.y);

    if (inputVector.x < 0) this.facingLeft = true;
    else if (inputVector.x > 0) this.facingLeft = false;
    this.setFlipX(this.facingLeft);

    const nextAnim = velocity.length() > 0 ? "soldier-walk" : "soldier-idle";
    if (this.anims.currentAnim?.key !== nextAnim) {
      this.play(nextAnim);
    }
  }

  private updateHurtFlicker(): void {
    const elapsedSinceHit = this.scene.time.now - this.lastHitAt;
    if (elapsedSinceHit >= INVULNERABILITY_MS) {
      this.setAlpha(1);
      return;
    }

    const flickerOn = Math.floor(elapsedSinceHit / HURT_FLICKER_INTERVAL_MS) % 2 === 0;
    this.setAlpha(flickerOn ? 1 : 0.35);
  }
}
