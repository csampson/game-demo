import * as Phaser from "phaser";
import { BaseLevelScene } from "./BaseLevelScene";

const FLOOR_TEXTURE_KEY = "forest-grass-tile";
const TILE_SIZE = 64;
const GRASS_BASE_COLOR = 0x3f9a4d;
const GRASS_FLECK_LIGHT = 0x5cbf6a;
const GRASS_FLECK_DARK = 0x2f7a3d;
const FLECK_COUNT = 14;
const FLECK_MARGIN = 6;
const FLECK_SIZE = 2;

const STONE_PATCH_KEY = "forest-stone-patch";
const DIRT_PATCH_KEY = "forest-dirt-patch";
const POND_KEY = "forest-pond";
const BUSH_KEY = "forest-bush";

const DECORATION_RADIUS = 1200;
const DECORATION_DEPTH = -0.8;
const DIRT_PATCH_COUNT = 25;
const STONE_PATCH_COUNT = 20;
const POND_COUNT = 6;
const BUSH_COUNT = 90;
const BUSH_MIN_SCALE = 1.2;
const BUSH_MAX_SCALE = 2.4;

export class ForestScene extends BaseLevelScene {
  constructor() {
    super("ForestScene");
  }

  protected preloadTerrain(): void {
    this.load.image(STONE_PATCH_KEY, new URL("../assets/tilesets/forest/stone_patch.png", import.meta.url).href);
    this.load.image(DIRT_PATCH_KEY, new URL("../assets/tilesets/forest/dirt_patch.png", import.meta.url).href);
    this.load.image(POND_KEY, new URL("../assets/tilesets/forest/pond.png", import.meta.url).href);
    this.load.image(BUSH_KEY, new URL("../assets/tilesets/forest/bush.png", import.meta.url).href);
  }

  protected createTerrain(): void {
    this.createFloorTexture();

    const { width, height } = this.scale;
    this.floor = this.add.tileSprite(0, 0, width, height, FLOOR_TEXTURE_KEY);
    this.floor.setOrigin(0, 0);
    this.floor.setScrollFactor(0);
    this.floor.setDepth(-1);

    this.scatterDecorations();
  }

  private createFloorTexture(): void {
    if (this.textures.exists(FLOOR_TEXTURE_KEY)) return;

    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(GRASS_BASE_COLOR, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    const rng = new Phaser.Math.RandomDataGenerator([FLOOR_TEXTURE_KEY]);
    for (let i = 0; i < FLECK_COUNT; i++) {
      const x = rng.between(FLECK_MARGIN, TILE_SIZE - FLECK_MARGIN);
      const y = rng.between(FLECK_MARGIN, TILE_SIZE - FLECK_MARGIN);
      graphics.fillStyle(rng.frac() > 0.5 ? GRASS_FLECK_LIGHT : GRASS_FLECK_DARK, 1);
      graphics.fillRect(x, y, FLECK_SIZE, FLECK_SIZE);
    }

    graphics.generateTexture(FLOOR_TEXTURE_KEY, TILE_SIZE, TILE_SIZE);
    graphics.destroy();
  }

  private scatterDecorations(): void {
    this.scatterKey(DIRT_PATCH_KEY, DIRT_PATCH_COUNT);
    this.scatterKey(STONE_PATCH_KEY, STONE_PATCH_COUNT);
    this.scatterKey(POND_KEY, POND_COUNT);
    this.scatterBushes();
  }

  private scatterKey(key: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(-DECORATION_RADIUS, DECORATION_RADIUS);
      const y = Phaser.Math.Between(-DECORATION_RADIUS, DECORATION_RADIUS);
      this.add.image(x, y, key).setDepth(DECORATION_DEPTH);
    }
  }

  private scatterBushes(): void {
    for (let i = 0; i < BUSH_COUNT; i++) {
      const x = Phaser.Math.Between(-DECORATION_RADIUS, DECORATION_RADIUS);
      const y = Phaser.Math.Between(-DECORATION_RADIUS, DECORATION_RADIUS);
      const scale = Phaser.Math.FloatBetween(BUSH_MIN_SCALE, BUSH_MAX_SCALE);
      this.add.image(x, y, BUSH_KEY).setDepth(DECORATION_DEPTH).setScale(scale);
    }
  }
}
