import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const avatar = this.add.graphics();
    avatar.fillStyle(0xffffff, 1);
    avatar.fillRoundedRect(0, 0, 32, 32, 10);
    avatar.lineStyle(2, 0x61dafb, 1);
    avatar.strokeRoundedRect(0, 0, 32, 32, 10);
    avatar.generateTexture("hero", 32, 32);
    avatar.destroy();

    const tile = this.add.graphics();
    tile.fillStyle(0x0f172a, 1);
    tile.fillRect(0, 0, 64, 64);
    tile.generateTexture("tile", 64, 64);
    tile.destroy();
  }

  create() {
    this.scene.start("WorldScene");
  }
}
