import { BaseLevelScene } from "./BaseLevelScene";

const TILE_SIZE = 64;

export class DungeonScene extends BaseLevelScene {
  constructor() {
    super("DungeonScene");
  }

  protected preloadTerrain(): void {}

  protected createTerrain(): void {
    this.createFloorTexture();

    const { width, height } = this.scale;
    this.floor = this.add.tileSprite(0, 0, width, height, "dungeon-floor-tile");
    this.floor.setOrigin(0, 0);
    this.floor.setScrollFactor(0);
    this.floor.setDepth(-1);
  }

  private createFloorTexture(): void {
    if (this.textures.exists("dungeon-floor-tile")) return;

    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x2b2b33, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.lineStyle(1, 0x35353f, 1);
    graphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture("dungeon-floor-tile", TILE_SIZE, TILE_SIZE);
    graphics.destroy();
  }
}
