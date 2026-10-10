import Phaser from 'phaser';
import { generateGameTextures } from '../utils/textureGenerator';
import { socketService } from '../../services/socket';
import { ISLAND_LOCATIONS } from '../../data/locations';
import { PlayerState } from '../../types/game';
import { getCharacterById } from '../../data/characters';

export interface RemotePlayerSprite {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  nameText: Phaser.GameObjects.Text;
  badgeText: Phaser.GameObjects.Text;
  emoteBubble?: Phaser.GameObjects.Container;
  targetX: number;
  targetY: number;
}

export class IslandScene extends Phaser.Scene {
  private localPlayer!: Phaser.GameObjects.Container;
  private localPlayerSprite!: Phaser.GameObjects.Sprite;
  private localPlayerNameText!: Phaser.GameObjects.Text;
  private localPlayerBadgeText!: Phaser.GameObjects.Text;

  private remotePlayers: Map<string, RemotePlayerSprite> = new Map();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private targetClickPos: Phaser.Math.Vector2 | null = null;
  private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup;

  private localNickname = 'ChogExplorer';
  private localCharacterId = 'chog-genesis-purple';
  private localIsRealNFT = false;
  private localNftImageUrl?: string;
  private localNftTokenId?: string;

  private localDiscoveredLocations: Set<string> = new Set();
  
  private onDiscoveryCallback?: (locationId: string, locationName: string) => void;
  private onEmoteTriggerCallback?: (type: string, text: string) => void;

  private lastMoveSendTime = 0;
  private moveSendInterval = 50;

  constructor() {
    super({ key: 'IslandScene' });
  }

  public init(data: {
    nickname?: string;
    characterId?: string;
    isRealNFT?: boolean;
    nftImageUrl?: string;
    nftTokenId?: string;
    walletAddress?: string;
    onDiscovery?: (locationId: string, locationName: string) => void;
    onEmoteTrigger?: (type: string, text: string) => void;
  }) {
    if (data.nickname) this.localNickname = data.nickname;
    if (data.characterId) this.localCharacterId = data.characterId;
    if (data.isRealNFT) this.localIsRealNFT = data.isRealNFT;
    if (data.nftImageUrl) this.localNftImageUrl = data.nftImageUrl;
    if (data.nftTokenId) this.localNftTokenId = data.nftTokenId;
    if (data.onDiscovery) this.onDiscoveryCallback = data.onDiscovery;
    if (data.onEmoteTrigger) this.onEmoteTriggerCallback = data.onEmoteTrigger;
  }

  public preload() {
    generateGameTextures(this);

    // Preload NFT image if available
    if (this.localNftImageUrl && this.localNftTokenId) {
      this.load.image(`nft_local_${this.localNftTokenId}`, this.localNftImageUrl);
    }
  }

  public create() {
    const MAP_WIDTH = 1200;
    const MAP_HEIGHT = 900;
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    this.renderMapTerrain(MAP_WIDTH, MAP_HEIGHT);

    this.obstaclesGroup = this.physics.add.staticGroup();
    this.setupMapObstacles(MAP_WIDTH, MAP_HEIGHT);

    this.renderLandmarks();

    this.createLocalPlayer(550 + Math.random() * 80, 480 + Math.random() * 80);

    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.1);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 40) return;
      this.targetClickPos = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
    });

    this.setupSocketEvents();

    socketService.joinRoom(this.localNickname, this.localCharacterId, {
      isRealNFT: this.localIsRealNFT,
      nftTokenId: this.localNftTokenId,
      nftImageUrl: this.localNftImageUrl,
    });
  }

  private renderMapTerrain(width: number, height: number) {
    const TILE_SIZE = 64;

    for (let x = 0; x < width; x += TILE_SIZE) {
      for (let y = 0; y < height; y += TILE_SIZE) {
        const isBorder = x < 96 || x > width - 96 || y < 96 || y > height - 96;
        if (isBorder) {
          this.add.image(x + 32, y + 32, 'tile_water');
        } else if (x < 144 || x > width - 144 || y < 144 || y > height - 144) {
          this.add.image(x + 32, y + 32, 'tile_sand');
        } else {
          this.add.image(x + 32, y + 32, 'tile_grass');
        }
      }
    }

    for (let x = 550; x <= 750; x += TILE_SIZE) {
      this.add.image(x, 560, 'tile_path').setAlpha(0.95);
    }
    for (let y = 480; y <= 650; y += TILE_SIZE) {
      this.add.image(750, y, 'tile_path').setAlpha(0.95);
    }

    for (let x = 250; x <= 550; x += TILE_SIZE) {
      this.add.image(x, 340, 'tile_path').setAlpha(0.95);
    }
    for (let y = 220; y <= 480; y += TILE_SIZE) {
      this.add.image(250, y, 'tile_path').setAlpha(0.95);
    }

    for (let x = 550; x <= 750; x += TILE_SIZE) {
      this.add.image(x, 340, 'tile_path').setAlpha(0.95);
    }
    for (let y = 220; y <= 340; y += TILE_SIZE) {
      this.add.image(750, y, 'tile_path').setAlpha(0.95);
    }

    for (let px = 686; px <= 814; px += TILE_SIZE) {
      for (let py = 586; py <= 714; py += TILE_SIZE) {
        this.add.image(px, py, 'tile_plaza');
      }
    }
  }

  private setupMapObstacles(width: number, height: number) {
    const northWall = this.add.rectangle(width / 2, 60, width, 120, 0x000000, 0);
    const southWall = this.add.rectangle(width / 2, height - 60, width, 120, 0x000000, 0);
    const westWall = this.add.rectangle(60, height / 2, 120, height, 0x000000, 0);
    const eastWall = this.add.rectangle(width - 60, height / 2, 120, height, 0x000000, 0);

    [northWall, southWall, westWall, eastWall].forEach((w) => {
      this.physics.add.existing(w, true);
      this.obstaclesGroup.add(w);
    });

    const pondBody = this.add.circle(250, 220, 75, 0x0288d1, 0.85);
    this.physics.add.existing(pondBody, true);
    this.obstaclesGroup.add(pondBody);

    this.add.image(220, 200, 'obj_lily');
    this.add.image(280, 230, 'obj_lily');
    this.add.image(240, 250, 'obj_lily');

    const treePositions = [
      { x: 380, y: 180 },
      { x: 440, y: 160 },
      { x: 200, y: 450 },
      { x: 180, y: 550 },
      { x: 920, y: 420 },
      { x: 980, y: 500 },
      { x: 600, y: 150 },
      { x: 350, y: 720 },
      { x: 450, y: 780 },
    ];

    treePositions.forEach((pos) => {
      const tree = this.add.image(pos.x, pos.y, 'obj_tree');
      tree.setDepth(pos.y);
      const collider = this.add.circle(pos.x, pos.y + 20, 24, 0x000000, 0);
      this.physics.add.existing(collider, true);
      this.obstaclesGroup.add(collider);
    });

    const rockPositions = [
      { x: 160, y: 280 },
      { x: 330, y: 280 },
      { x: 880, y: 180 },
      { x: 680, y: 780 },
    ];

    rockPositions.forEach((pos) => {
      const rock = this.add.image(pos.x, pos.y, 'obj_rock');
      rock.setDepth(pos.y);
      const collider = this.add.circle(pos.x, pos.y, 20, 0x000000, 0);
      this.physics.add.existing(collider, true);
      this.obstaclesGroup.add(collider);
    });
  }

  private renderLandmarks() {
    const shrine = this.add.image(750, 200, 'obj_shrine');
    shrine.setDepth(200);
    const shrineCollider = this.add.rectangle(750, 210, 80, 50, 0x000000, 0);
    this.physics.add.existing(shrineCollider, true);
    this.obstaclesGroup.add(shrineCollider);

    this.add
      .text(750, 130, '⚡ SHRINE OF MONAD', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        color: '#00F58C',
        stroke: '#121026',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(250, 130, '💧 POND OF TRANQUILITY', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        color: '#4fc3f7',
        stroke: '#121026',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(750, 550, '🏛️ MONAD SPEED PLAZA', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        color: '#836EF9',
        stroke: '#121026',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  private createLocalPlayer(x: number, y: number) {
    this.localPlayer = this.add.container(x, y);
    this.physics.world.enable(this.localPlayer);

    const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(36, 36);
    body.setOffset(-18, -18);

    const key = this.textures.exists(`nft_local_${this.localNftTokenId}`)
      ? `nft_local_${this.localNftTokenId}`
      : this.localCharacterId;

    this.localPlayerSprite = this.add.sprite(0, 0, key);
    if (key.startsWith('nft_local_')) {
      this.localPlayerSprite.setDisplaySize(44, 44);
    }
    this.localPlayer.add(this.localPlayerSprite);

    const charDef = getCharacterById(this.localCharacterId);

    this.localPlayerNameText = this.add
      .text(0, -44, this.localNickname, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        color: '#FFFFFF',
        stroke: '#121026',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.localPlayer.add(this.localPlayerNameText);

    const badgeTitle = this.localIsRealNFT
      ? `⚡ VERIFIED MONAD NFT #${this.localNftTokenId || 'GENESIS'}`
      : `[${charDef.rarity}] ${charDef.name}`;

    const badgeColor = this.localIsRealNFT ? '#00F58C' : charDef.colorHex;

    this.localPlayerBadgeText = this.add
      .text(0, -30, badgeTitle, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '10px',
        color: badgeColor,
        stroke: '#121026',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    this.localPlayer.add(this.localPlayerBadgeText);

    this.localPlayer.setDepth(y);
    this.physics.add.collider(this.localPlayer, this.obstaclesGroup);
  }

  private createRemotePlayer(player: PlayerState): RemotePlayerSprite {
    const container = this.add.container(player.x, player.y);
    const spriteKey = player.characterId || 'chog-genesis-purple';
    const sprite = this.add.sprite(0, 0, spriteKey);
    container.add(sprite);

    const charDef = getCharacterById(spriteKey);

    const nameText = this.add
      .text(0, -44, player.nickname || 'ChogPlayer', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        color: player.isVerifiedNFT ? '#00F58C' : '#FFFFFF',
        stroke: '#121026',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    container.add(nameText);

    const badgeTitle = player.isVerifiedNFT
      ? `⚡ VERIFIED MONAD NFT #${player.nftTokenId || ''}`
      : `[${charDef.rarity}] ${charDef.name}`;

    const badgeColor = player.isVerifiedNFT ? '#00F58C' : charDef.colorHex;

    const badgeText = this.add
      .text(0, -30, badgeTitle, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '10px',
        color: badgeColor,
        stroke: '#121026',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    container.add(badgeText);

    container.setDepth(player.y);

    const remoteObj: RemotePlayerSprite = {
      container,
      sprite,
      nameText,
      badgeText,
      targetX: player.x,
      targetY: player.y,
    };

    if (player.currentEmote) {
      this.showEmoteBubbleOnContainer(container, player.currentEmote.text);
    }

    this.remotePlayers.set(player.id, remoteObj);
    return remoteObj;
  }

  private setupSocketEvents() {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on('roomInit', (data: { selfId: string; room: { players: Record<string, PlayerState> } }) => {
      Object.values(data.room.players).forEach((p) => {
        if (p.id !== data.selfId && !this.remotePlayers.has(p.id)) {
          this.createRemotePlayer(p);
        }
      });
    });

    socket.on('playerJoined', (p: PlayerState) => {
      if (!this.remotePlayers.has(p.id)) {
        this.createRemotePlayer(p);
      }
    });

    socket.on('playerMoved', (data: { id: string; x: number; y: number; direction?: string }) => {
      const remote = this.remotePlayers.get(data.id);
      if (remote) {
        remote.targetX = data.x;
        remote.targetY = data.y;
      }
    });

    socket.on('playerEmoted', (data: { id: string; nickname: string; emote: { type: string; text: string } }) => {
      if (data.id === socket.id) {
        this.showLocalEmoteBubble(data.emote.text);
      } else {
        const remote = this.remotePlayers.get(data.id);
        if (remote) {
          this.showEmoteBubbleOnContainer(remote.container, data.emote.text);
        }
      }
    });

    socket.on('playerLeft', (data: { id: string }) => {
      const remote = this.remotePlayers.get(data.id);
      if (remote) {
        remote.container.destroy();
        this.remotePlayers.delete(data.id);
      }
    });
  }

  public update(time: number, delta: number) {
    if (!this.localPlayer) return;

    const SPEED = 220;
    const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    let moveX = 0;
    let moveY = 0;
    let dir: 'up' | 'down' | 'left' | 'right' = 'down';

    if (this.wasdKeys) {
      if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
        moveX = -1;
        dir = 'left';
      } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
        moveX = 1;
        dir = 'right';
      }

      if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
        moveY = -1;
        dir = 'up';
      } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
        moveY = 1;
        dir = 'down';
      }
    }

    if (moveX !== 0 || moveY !== 0) {
      this.targetClickPos = null;
    } else if (this.targetClickPos) {
      const dist = Phaser.Math.Distance.Between(
        this.localPlayer.x,
        this.localPlayer.y,
        this.targetClickPos.x,
        this.targetClickPos.y
      );

      if (dist > 10) {
        const angle = Phaser.Math.Angle.Between(
          this.localPlayer.x,
          this.localPlayer.y,
          this.targetClickPos.x,
          this.targetClickPos.y
        );
        moveX = Math.cos(angle);
        moveY = Math.sin(angle);
      } else {
        this.targetClickPos = null;
      }
    }

    if (moveX !== 0 || moveY !== 0) {
      const vec = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(SPEED);
      body.setVelocity(vec.x, vec.y);
      this.localPlayer.setDepth(this.localPlayer.y);
      this.localPlayerSprite.y = Math.sin(time / 80) * 3;
    } else {
      this.localPlayerSprite.y = 0;
    }

    if (time - this.lastMoveSendTime > this.moveSendInterval) {
      this.lastMoveSendTime = time;
      socketService.sendMove(
        Math.round(this.localPlayer.x),
        Math.round(this.localPlayer.y),
        dir,
        moveX !== 0 || moveY !== 0
      );
    }

    this.remotePlayers.forEach((remote) => {
      remote.container.x = Phaser.Math.Linear(remote.container.x, remote.targetX, 0.25);
      remote.container.y = Phaser.Math.Linear(remote.container.y, remote.targetY, 0.25);
      remote.container.setDepth(remote.container.y);
    });

    this.checkLandmarkDiscoveries();
  }

  private checkLandmarkDiscoveries() {
    const px = this.localPlayer.x;
    const py = this.localPlayer.y;

    ISLAND_LOCATIONS.forEach((loc) => {
      if (this.localDiscoveredLocations.has(loc.id)) return;

      const dist = Phaser.Math.Distance.Between(px, py, loc.x, loc.y);
      if (dist <= loc.radius) {
        this.localDiscoveredLocations.add(loc.id);

        socketService.sendDiscover(loc.id, loc.name);

        if (this.onDiscoveryCallback) {
          this.onDiscoveryCallback(loc.id, loc.name);
        }

        this.triggerSparklesAt(loc.x, loc.y, 0x00F58C);
      }
    });
  }

  public triggerLocalEmote(type: string, text: string) {
    socketService.sendEmote(type, text);
    this.showLocalEmoteBubble(text);

    const charDef = getCharacterById(this.localCharacterId);
    this.triggerSparklesAt(this.localPlayer.x, this.localPlayer.y - 20, charDef.particleColor);
  }

  private showLocalEmoteBubble(text: string) {
    this.showEmoteBubbleOnContainer(this.localPlayer, text);
  }

  private showEmoteBubbleOnContainer(container: Phaser.GameObjects.Container, text: string) {
    const existing = container.getByName('emoteBubble');
    if (existing) existing.destroy();

    const bubbleGroup = this.add.container(0, -68);
    bubbleGroup.setName('emoteBubble');

    const bubbleText = this.add
      .text(0, 0, text, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        color: '#FFFFFF',
        backgroundColor: 'rgba(18, 16, 38, 0.9)',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);

    bubbleGroup.add(bubbleText);
    container.add(bubbleGroup);

    this.tweens.add({
      targets: bubbleGroup,
      y: -84,
      alpha: 0,
      duration: 3000,
      ease: 'Power1',
      onComplete: () => bubbleGroup.destroy(),
    });
  }

  private triggerSparklesAt(x: number, y: number, colorHex: number) {
    for (let i = 0; i < 12; i++) {
      const p = this.add.image(x, y, 'spark_particle');
      p.setTint(colorHex);
      p.setDepth(y + 100);

      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 40;

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 800 + Math.random() * 400,
        onComplete: () => p.destroy(),
      });
    }
  }

  public updateCharacter(newCharacterId: string) {
    this.localCharacterId = newCharacterId;
    if (this.localPlayerSprite) {
      this.localPlayerSprite.setTexture(newCharacterId);
      const charDef = getCharacterById(newCharacterId);
      this.localPlayerBadgeText.setText(`[${charDef.rarity}] ${charDef.name}`);
      this.localPlayerBadgeText.setColor(charDef.colorHex);
    }
  }
}
