import Phaser from "phaser";
import { phaserCommands, phaserEvents } from "@/game/phaser/events";
import type { SessionRoom } from "@/lib/models/session";
import type { WorldDecorState } from "@/lib/models/world";

type RoomZone = {
  room: SessionRoom;
  rect: Phaser.Geom.Rectangle;
  label: Phaser.GameObjects.Text;
  tile: Phaser.GameObjects.Rectangle;
};

export class WorldScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private player?: Phaser.Physics.Arcade.Sprite;

  private currentRoom: SessionRoom = "plaza";

  private controlsLocked = false;

  private zones: RoomZone[] = [];

  private cleanupCallbacks: Array<() => void> = [];

  constructor() {
    super("WorldScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#020617");
    this.physics.world.setBounds(0, 0, 1200, 720);
    this.createWorld();

    this.player = this.physics.add.sprite(600, 360, "hero");
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(650, 650);
    this.player.setDepth(5);

    const keyboard = this.input?.keyboard;
    this.cursors = keyboard?.createCursorKeys();

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    this.events.on(Phaser.Scenes.Events.DESTROY, () => this.teardown());

    this.registerCommandListeners();
    phaserEvents.emit("room:enter", { room: "plaza" });
  }

  update() {
    if (!this.player || !this.cursors) {
      return;
    }

    const speed = this.controlsLocked ? 0 : 230;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(0);

    if (this.cursors.left?.isDown) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown) {
      body.setVelocityX(speed);
    }

    if (this.cursors.up?.isDown) {
      body.setVelocityY(-speed);
    } else if (this.cursors.down?.isDown) {
      body.setVelocityY(speed);
    }

    body.velocity.normalize().scale(speed);

    this.checkRoomTransition();
  }

  private createWorld() {
    const colors: Record<SessionRoom, number> = {
      plaza: 0x0f172a,
      study: 0x312e81,
      build: 0x064e3b,
      training: 0x7c2d12,
    };

    const labels: Record<SessionRoom, string> = {
      plaza: "Central Plaza",
      study: "Study Room",
      build: "Build Room",
      training: "Training Room",
    };

    const rectangles: Record<SessionRoom, Phaser.Geom.Rectangle> = {
      plaza: new Phaser.Geom.Rectangle(450, 220, 300, 260),
      study: new Phaser.Geom.Rectangle(150, 120, 260, 220),
      build: new Phaser.Geom.Rectangle(800, 120, 260, 220),
      training: new Phaser.Geom.Rectangle(800, 440, 260, 200),
    };

    Object.entries(rectangles).forEach(([room, rect]) => {
      const tile = this.add
        .rectangle(rect.x, rect.y, rect.width, rect.height, colors[room as SessionRoom], 0.6)
        .setOrigin(0);
      tile.setStrokeStyle(2, 0xffffff, 0.08);
      tile.setDepth(1);

      const label = this.add
        .text(rect.x + rect.width / 2, rect.y + rect.height / 2, labels[room as SessionRoom], {
          fontSize: "18px",
          color: "#e2e8f0",
        })
        .setOrigin(0.5);
      label.setDepth(2);
      this.zones.push({
        room: room as SessionRoom,
        rect,
        label,
        tile,
      });
    });
  }

  private checkRoomTransition() {
    if (!this.player) return;
    const center = this.player.getCenter();
    const zone = this.zones.find((z) => z.rect.contains(center.x, center.y));
    const room = zone?.room ?? "plaza";
    if (room !== this.currentRoom) {
      phaserEvents.emit("room:leave", { room: this.currentRoom });
      this.currentRoom = room;
      phaserEvents.emit("room:enter", { room });
    }
  }

  private registerCommandListeners() {
    const lockHandler = () => {
      this.controlsLocked = true;
      if (this.player) {
        this.player.setTint(0xffffff);
      }
    };
    phaserCommands.on("command:lockMovement", lockHandler);
    this.cleanupCallbacks.push(() => phaserCommands.off("command:lockMovement", lockHandler));

    const unlockHandler = () => {
      this.controlsLocked = false;
    };
    phaserCommands.on("command:unlockMovement", unlockHandler);
    this.cleanupCallbacks.push(() => phaserCommands.off("command:unlockMovement", unlockHandler));

    const applyCosmetics = ({
      hatKey,
      outfitKey,
      accessoryKey,
    }: {
      hatKey?: string;
      outfitKey?: string;
      accessoryKey?: string;
    }) => {
      if (!this.player) return;
      const tint = hatKey || outfitKey || accessoryKey ? 0x7dd3fc : 0xffffff;
      this.player.setTint(tint);
    };
    phaserCommands.on("command:applyCosmetics", applyCosmetics);
    this.cleanupCallbacks.push(() => phaserCommands.off("command:applyCosmetics", applyCosmetics));

    const worldUpdate = (state: WorldDecorState) => {
      this.zones.forEach((zone) => {
        if (zone.room === "study" && state.studyLevel === 2) {
          zone.tile.fillAlpha = 0.8;
        }
        if (zone.room === "build" && state.buildLevel === 2) {
          zone.tile.setStrokeStyle(2, 0x38bdf8, 0.6);
        }
        if (zone.room === "plaza" && state.plazaUpgrade) {
          zone.label.setColor("#fcd34d");
        }
      });
    };
    phaserCommands.on("command:updateWorld", worldUpdate);
    this.cleanupCallbacks.push(() => phaserCommands.off("command:updateWorld", worldUpdate));

    const rewardFx = () => {
      if (!this.player) return;
      const emitter = this.add.particles(this.player.x, this.player.y, "tile", {
        speed: 120,
        lifespan: 400,
        quantity: 30,
        scale: { start: 0.2, end: 0 },
      });
      this.time.delayedCall(600, () => emitter.destroy());
    };
    phaserCommands.on("command:rewardFx", rewardFx);
    this.cleanupCallbacks.push(() => phaserCommands.off("command:rewardFx", rewardFx));
  }

  private teardown() {
    this.cleanupCallbacks.forEach((stop) => stop());
    this.cleanupCallbacks = [];
  }
}
