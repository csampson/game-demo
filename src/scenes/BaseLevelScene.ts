import * as Phaser from "phaser";
import { Hero } from "../entities/Hero";
import { Orc } from "../entities/Orc";
import { Projectile } from "../entities/Projectile";
import { HeartPickup } from "../entities/HeartPickup";
import { setHudState } from "../ui/hudStore";

const MAX_ORCS = 40;
const ORC_SPAWN_INTERVAL_MS = 1200;
const ORC_SPAWN_MARGIN = 80;
const HERO_ATTACK_RANGE = 55;
const PROJECTILE_HIT_RADIUS = 22;
const PROJECTILE_RANGE = 220;
const HEART_SPAWN_INTERVAL_MS = 5000;
const MAX_HEARTS = 6;
const HEART_SPAWN_MIN_RADIUS = 150;
const HEART_SPAWN_MAX_RADIUS = 400;
const HEART_PICKUP_RADIUS = 30;

export abstract class BaseLevelScene extends Phaser.Scene {
  protected hero!: Hero;
  protected floor!: Phaser.GameObjects.TileSprite;
  private orcs: Orc[] = [];
  private projectiles: Projectile[] = [];
  private hearts: HeartPickup[] = [];
  private deathText?: Phaser.GameObjects.Text;

  protected abstract preloadTerrain(): void;
  protected abstract createTerrain(): void;

  preload(): void {
    Hero.preload(this);
    Orc.preload(this);
    Projectile.preload(this);
    HeartPickup.preload(this);
    this.preloadTerrain();
  }

  create(): void {
    this.createTerrain();

    Hero.createAnimations(this);
    Orc.createAnimations(this);
    this.hero = new Hero(this, 0, 0);
    this.hero.setBodySize(40, 56);

    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);

    this.time.addEvent({ delay: ORC_SPAWN_INTERVAL_MS, loop: true, callback: this.spawnOrc, callbackScope: this });
    this.time.addEvent({ delay: HEART_SPAWN_INTERVAL_MS, loop: true, callback: this.spawnHeart, callbackScope: this });

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  update(_time: number, delta: number): void {
    this.hero.update();
    this.floor.tilePositionX = this.cameras.main.scrollX;
    this.floor.tilePositionY = this.cameras.main.scrollY;

    for (const orc of this.orcs) {
      orc.update(this.hero);
      if (this.hero.isAttacking) {
        const distance = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, orc.x, orc.y);
        if (distance <= HERO_ATTACK_RANGE) {
          orc.takeDamage(this.hero.attackDamage, this.hero.x, this.hero.y);
        }
      }
    }
    for (let i = this.orcs.length - 1; i >= 0; i--) {
      if (!this.orcs[i].active) {
        this.orcs.splice(i, 1);
      }
    }

    for (const heart of this.hearts) {
      heart.update();
      if (this.hero.hp < this.hero.maxHp) {
        const distance = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, heart.x, heart.y);
        if (distance <= HEART_PICKUP_RADIUS) {
          this.hero.heal(heart.healAmount);
          heart.collect();
        }
      }
    }
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      if (!this.hearts[i].active) {
        this.hearts.splice(i, 1);
      }
    }

    const nearestOrc = this.findNearestOrcWithinRange(PROJECTILE_RANGE);
    if (nearestOrc) {
      const shot = this.hero.tryFireProjectile(nearestOrc.x, nearestOrc.y);
      if (shot) {
        this.projectiles.push(new Projectile(this, shot.x, shot.y, shot.directionX, shot.directionY));
      }
    }

    for (const projectile of this.projectiles) {
      projectile.update(delta);
      if (!projectile.active) continue;

      for (const orc of this.orcs) {
        const distance = Phaser.Math.Distance.Between(projectile.x, projectile.y, orc.x, orc.y);
        if (distance <= PROJECTILE_HIT_RADIUS) {
          orc.takeDamage(projectile.damage);
          projectile.destroy();
          break;
        }
      }
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (!this.projectiles[i].active) {
        this.projectiles.splice(i, 1);
      }
    }

    setHudState({ hp: this.hero.hp, maxHp: this.hero.maxHp, isShielded: this.hero.isShielded });
    this.updateDeathText();
  }

  private updateDeathText(): void {
    if (!this.hero.isDead || this.deathText) return;

    this.deathText = this.add.text(this.scale.width / 2, this.scale.height / 2, "You Died", {
      fontSize: "32px",
      color: "#e8e8ee"
    });
    this.deathText.setOrigin(0.5, 0.5);
    this.deathText.setScrollFactor(0);
    this.deathText.setDepth(20);
  }

  private findNearestOrcWithinRange(range: number): Orc | null {
    let nearest: Orc | null = null;
    let nearestDistance = range;

    for (const orc of this.orcs) {
      const distance = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, orc.x, orc.y);
      if (distance <= nearestDistance) {
        nearest = orc;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private spawnOrc(): void {
    if (this.hero.isDead) return;
    if (this.orcs.length >= MAX_ORCS) return;

    const worldView = this.cameras.main.worldView;
    const radius = Phaser.Math.Distance.Between(0, 0, worldView.width, worldView.height) / 2 + ORC_SPAWN_MARGIN;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = this.hero.x + Math.cos(angle) * radius;
    const y = this.hero.y + Math.sin(angle) * radius;

    this.orcs.push(new Orc(this, x, y));
  }

  private spawnHeart(): void {
    if (this.hero.isDead) return;
    if (this.hearts.length >= MAX_HEARTS) return;

    const radius = Phaser.Math.FloatBetween(HEART_SPAWN_MIN_RADIUS, HEART_SPAWN_MAX_RADIUS);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = this.hero.x + Math.cos(angle) * radius;
    const y = this.hero.y + Math.sin(angle) * radius;

    this.hearts.push(new HeartPickup(this, x, y));
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.floor.setSize(gameSize.width, gameSize.height);
    this.deathText?.setPosition(gameSize.width / 2, gameSize.height / 2);
  }
}
