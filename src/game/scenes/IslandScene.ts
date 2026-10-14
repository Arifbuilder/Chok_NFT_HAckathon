import Phaser from 'phaser';
import { generateGameTextures } from '../utils/textureGenerator';
import { socketService } from '../../services/socket';
import { ISLAND_LOCATIONS } from '../../data/locations';
import { PlayerState } from '../../types/game';
import { getCharacterById } from '../../data/characters';

const MAX_HEALTH = 100;
const ATTACK_RANGE = 80;
const ATTACK_DAMAGE = 20;
const HEALTH_BAR_W = 40;
const HEALTH_BAR_H = 5;

export interface RemotePlayerSprite {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  nameText: Phaser.GameObjects.Text;
  badgeText: Phaser.GameObjects.Text;
  emoteBubble?: Phaser.GameObjects.Container;
  targetX: number;
  targetY: number;
  health: number;
  maxHealth: number;
  isDead: boolean;
  healthBarBg: Phaser.GameObjects.Rectangle;
  healthBarFill: Phaser.GameObjects.Rectangle;
  swordSprite: Phaser.GameObjects.Image;
  socketId: string;
}

export class IslandScene extends Phaser.Scene {
  private localPlayer!: Phaser.GameObjects.Container;
  private localPlayerSprite!: Phaser.GameObjects.Sprite;
  private localPlayerNameText!: Phaser.GameObjects.Text;
  private localPlayerBadgeText!: Phaser.GameObjects.Text;
  private localSwordSprite!: Phaser.GameObjects.Image;

  private localHealth = MAX_HEALTH;
  private localMaxHealth = MAX_HEALTH;
  private localIsDead = false;
  private localHealthBarBg!: Phaser.GameObjects.Rectangle;
  private localHealthBarFill!: Phaser.GameObjects.Rectangle;

  private remotePlayers: Map<string, RemotePlayerSprite> = new Map();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private targetClickPos: Phaser.Math.Vector2 | null = null;
  private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup;

  private localNickname = 'ChogExplorer';
  private localCharacterId = 'chog-genesis-purple';
  private localIsRealNFT = false;
  private localNftImageUrl?: string;
  private localNftTokenId?: string;
  private localWalletAddress?: string;

  private localDiscoveredLocations: Set<string> = new Set();
  private onDiscoveryCallback?: (locationId: string, locationName: string) => void;

  private lastMoveSendTime = 0;
  private moveSendInterval = 50;
  private lastAttackTime = 0;
  private attackCooldown = 650;
  private isSwinging = false;

  // Track our own socket id so we can filter correctly
  private mySocketId = '';

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
  }) {
    if (data.nickname) this.localNickname = data.nickname;
    if (data.characterId) this.localCharacterId = data.characterId;
    if (data.isRealNFT !== undefined) this.localIsRealNFT = data.isRealNFT;
    if (data.nftImageUrl) this.localNftImageUrl = data.nftImageUrl;
    if (data.nftTokenId) this.localNftTokenId = data.nftTokenId;
    if (data.walletAddress) this.localWalletAddress = data.walletAddress;
    if (data.onDiscovery) this.onDiscoveryCallback = data.onDiscovery;
    // Reset combat state on scene restart
    this.localHealth = MAX_HEALTH;
    this.localIsDead = false;
    this.remotePlayers.clear();
    this.mySocketId = '';
  }

  public preload() {
    generateGameTextures(this);
    if (this.localNftImageUrl && this.localNftTokenId) {
      const imgUrl = this.localNftImageUrl.startsWith('ipfs://')
        ? this.localNftImageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
        : this.localNftImageUrl;
      this.load.image(`nft_local_${this.localNftTokenId}`, imgUrl);
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
      this.input.keyboard.disableGlobalCapture();
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 50) return;
      this.targetClickPos = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
    });

    // Attack hint (fixed on screen)
    this.add
      .text(MAP_WIDTH / 2, 24, '⚔️ SPACE / Tap ⚔ button to attack!', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '12px',
        color: '#FFD700',
        stroke: '#121026',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9999);

    // Register clean shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupSocketListeners());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanupSocketListeners());

    // Setup socket listeners THEN join (so we catch roomInit)
    this.setupSocketListeners();

    socketService.joinRoom(this.localNickname, this.localCharacterId, {
      isRealNFT: this.localIsRealNFT,
      nftTokenId: this.localNftTokenId,
      nftImageUrl: this.localNftImageUrl,
      walletAddress: this.localWalletAddress,
    });
  }

  // ──────────────────────────────────────────────
  //  MAP
  // ──────────────────────────────────────────────

  private renderMapTerrain(width: number, height: number) {
    const T = 64;
    for (let x = 0; x < width; x += T) {
      for (let y = 0; y < height; y += T) {
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
    for (let x = 550; x <= 750; x += T) this.add.image(x, 560, 'tile_path').setAlpha(0.95);
    for (let y = 480; y <= 650; y += T) this.add.image(750, y, 'tile_path').setAlpha(0.95);
    for (let x = 250; x <= 550; x += T) this.add.image(x, 340, 'tile_path').setAlpha(0.95);
    for (let y = 220; y <= 480; y += T) this.add.image(250, y, 'tile_path').setAlpha(0.95);
    for (let x = 550; x <= 750; x += T) this.add.image(x, 340, 'tile_path').setAlpha(0.95);
    for (let y = 220; y <= 340; y += T) this.add.image(750, y, 'tile_path').setAlpha(0.95);
    for (let px = 686; px <= 814; px += T)
      for (let py = 586; py <= 714; py += T)
        this.add.image(px, py, 'tile_plaza');
  }

  private setupMapObstacles(width: number, height: number) {
    const walls = [
      this.add.rectangle(width / 2, 60, width, 120, 0, 0),
      this.add.rectangle(width / 2, height - 60, width, 120, 0, 0),
      this.add.rectangle(60, height / 2, 120, height, 0, 0),
      this.add.rectangle(width - 60, height / 2, 120, height, 0, 0),
    ];
    walls.forEach(w => { this.physics.add.existing(w, true); this.obstaclesGroup.add(w); });

    const pond = this.add.circle(250, 220, 75, 0x0288d1, 0.85);
    this.physics.add.existing(pond, true);
    this.obstaclesGroup.add(pond);
    this.add.image(220, 200, 'obj_lily');
    this.add.image(280, 230, 'obj_lily');
    this.add.image(240, 250, 'obj_lily');

    [
      { x: 380, y: 180 }, { x: 440, y: 160 }, { x: 200, y: 450 }, { x: 180, y: 550 },
      { x: 920, y: 420 }, { x: 980, y: 500 }, { x: 600, y: 150 }, { x: 350, y: 720 }, { x: 450, y: 780 },
    ].forEach(pos => {
      this.add.image(pos.x, pos.y, 'obj_tree').setDepth(pos.y);
      const c = this.add.circle(pos.x, pos.y + 20, 24, 0, 0);
      this.physics.add.existing(c, true); this.obstaclesGroup.add(c);
    });

    [{ x: 160, y: 280 }, { x: 330, y: 280 }, { x: 880, y: 180 }, { x: 680, y: 780 }].forEach(pos => {
      this.add.image(pos.x, pos.y, 'obj_rock').setDepth(pos.y);
      const c = this.add.circle(pos.x, pos.y, 20, 0, 0);
      this.physics.add.existing(c, true); this.obstaclesGroup.add(c);
    });
  }

  private renderLandmarks() {
    this.add.image(750, 200, 'obj_shrine').setDepth(200);
    const sc = this.add.rectangle(750, 210, 80, 50, 0, 0);
    this.physics.add.existing(sc, true); this.obstaclesGroup.add(sc);

    const style = (c: string) => ({ fontFamily: 'Outfit,sans-serif', fontSize: '14px', color: c, stroke: '#121026', strokeThickness: 3 });
    this.add.text(750, 130, '⚡ SHRINE OF MONAD', style('#00F58C')).setOrigin(0.5);
    this.add.text(250, 130, '💧 POND OF TRANQUILITY', style('#4fc3f7')).setOrigin(0.5);
    this.add.text(750, 550, '🏛️ MONAD SPEED PLAZA', style('#836EF9')).setOrigin(0.5);
  }

  // ──────────────────────────────────────────────
  //  PLAYER CREATION
  // ──────────────────────────────────────────────

  private createLocalPlayer(x: number, y: number) {
    this.localPlayer = this.add.container(x, y);
    this.physics.world.enable(this.localPlayer);
    const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(36, 36);
    body.setOffset(-18, -18);

    const key =
      this.localNftTokenId && this.textures.exists(`nft_local_${this.localNftTokenId}`)
        ? `nft_local_${this.localNftTokenId}`
        : this.textures.exists(this.localCharacterId)
        ? this.localCharacterId
        : 'chog-genesis-purple';

    this.localPlayerSprite = this.add.sprite(0, 0, key);
    if (key.startsWith('nft_local_')) this.localPlayerSprite.setDisplaySize(44, 44);
    this.localPlayer.add(this.localPlayerSprite);

    this.localSwordSprite = this.add.image(20, 6, 'sword');
    this.localSwordSprite.setDisplaySize(16, 26);
    this.localPlayer.add(this.localSwordSprite);

    const charDef = getCharacterById(this.localCharacterId);

    this.localHealthBarBg = this.add.rectangle(0, -60, HEALTH_BAR_W + 2, HEALTH_BAR_H + 2, 0x111111);
    this.localHealthBarBg.setOrigin(0.5, 0.5);
    this.localPlayer.add(this.localHealthBarBg);

    this.localHealthBarFill = this.add.rectangle(-HEALTH_BAR_W / 2, -60, HEALTH_BAR_W, HEALTH_BAR_H, 0x00e676);
    this.localHealthBarFill.setOrigin(0, 0.5);
    this.localPlayer.add(this.localHealthBarFill);

    this.localPlayerNameText = this.add.text(0, -46, this.localNickname, {
      fontFamily: 'Outfit,sans-serif', fontSize: '13px', color: '#FFFFFF',
      stroke: '#121026', strokeThickness: 3,
    }).setOrigin(0.5);
    this.localPlayer.add(this.localPlayerNameText);

    const badgeTitle = this.localIsRealNFT
      ? `⚡ NFT #${this.localNftTokenId || 'GENESIS'}`
      : `[${charDef.rarity}] ${charDef.name}`;
    this.localPlayerBadgeText = this.add.text(0, -33, badgeTitle, {
      fontFamily: 'Outfit,sans-serif', fontSize: '10px',
      color: this.localIsRealNFT ? '#00F58C' : charDef.colorHex,
      stroke: '#121026', strokeThickness: 2,
    }).setOrigin(0.5);
    this.localPlayer.add(this.localPlayerBadgeText);

    this.localPlayer.setDepth(y);
    this.physics.add.collider(this.localPlayer, this.obstaclesGroup);
  }

  private createRemotePlayer(player: PlayerState): RemotePlayerSprite {
    // Guard: don't create if already exists or it's us
    if (this.mySocketId && player.id === this.mySocketId) return null as any;
    if (this.remotePlayers.has(player.id)) return this.remotePlayers.get(player.id)!;

    const container = this.add.container(player.x, player.y);
    const spriteKey = this.textures.exists(player.characterId) ? player.characterId : 'chog-genesis-purple';
    const sprite = this.add.sprite(0, 0, spriteKey);
    container.add(sprite);

    const swordSprite = this.add.image(20, 6, 'sword');
    swordSprite.setDisplaySize(16, 26);
    container.add(swordSprite);

    const charDef = getCharacterById(player.characterId || 'chog-genesis-purple');

    const healthBarBg = this.add.rectangle(0, -60, HEALTH_BAR_W + 2, HEALTH_BAR_H + 2, 0x111111);
    healthBarBg.setOrigin(0.5, 0.5);
    container.add(healthBarBg);

    const healthBarFill = this.add.rectangle(-HEALTH_BAR_W / 2, -60, HEALTH_BAR_W, HEALTH_BAR_H, 0x00e676);
    healthBarFill.setOrigin(0, 0.5);
    container.add(healthBarFill);

    const nameText = this.add.text(0, -46, player.nickname || 'ChogPlayer', {
      fontFamily: 'Outfit,sans-serif', fontSize: '13px',
      color: player.isVerifiedNFT ? '#00F58C' : '#FFFFFF',
      stroke: '#121026', strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(nameText);

    const badgeTitle = player.isVerifiedNFT
      ? `⚡ NFT #${player.nftTokenId || ''}`
      : `[${charDef.rarity}] ${charDef.name}`;
    const badgeText = this.add.text(0, -33, badgeTitle, {
      fontFamily: 'Outfit,sans-serif', fontSize: '10px',
      color: player.isVerifiedNFT ? '#00F58C' : charDef.colorHex,
      stroke: '#121026', strokeThickness: 2,
    }).setOrigin(0.5);
    container.add(badgeText);

    container.setDepth(player.y);

    const remoteObj: RemotePlayerSprite = {
      container, sprite, nameText, badgeText,
      targetX: player.x, targetY: player.y,
      health: player.health ?? MAX_HEALTH,
      maxHealth: player.maxHealth ?? MAX_HEALTH,
      isDead: player.isDead ?? false,
      healthBarBg, healthBarFill, swordSprite,
      socketId: player.id,
    };

    if (player.currentEmote) {
      this.showEmoteBubbleOnContainer(container, player.currentEmote.text);
    }

    this.remotePlayers.set(player.id, remoteObj);
    return remoteObj;
  }

  private removeRemotePlayer(id: string) {
    const remote = this.remotePlayers.get(id);
    if (remote) {
      remote.container.destroy();
      this.remotePlayers.delete(id);
    }
  }

  // ──────────────────────────────────────────────
  //  HEALTH BAR
  // ──────────────────────────────────────────────

  private updateHealthBar(fill: Phaser.GameObjects.Rectangle, health: number, maxHealth: number) {
    const pct = Math.max(0, Math.min(1, health / maxHealth));
    fill.width = HEALTH_BAR_W * pct;
    if (pct > 0.6) fill.setFillStyle(0x00e676);
    else if (pct > 0.3) fill.setFillStyle(0xffee58);
    else fill.setFillStyle(0xff1744);
  }

  // ──────────────────────────────────────────────
  //  SOCKET EVENTS — Dedicated callbacks to prevent wiping App.tsx listeners
  // ──────────────────────────────────────────────

  private onRoomInit = (data: { selfId: string; room: { players: Record<string, PlayerState> } }) => {
    this.mySocketId = data.selfId;
    this.remotePlayers.forEach((_, id) => this.removeRemotePlayer(id));
    this.remotePlayers.clear();

    Object.values(data.room.players).forEach((p) => {
      if (p.id !== data.selfId) {
        this.createRemotePlayer(p);
      }
    });
  };

  private onPlayerJoined = (p: PlayerState) => {
    if (p.id === this.mySocketId) return;
    if (!this.remotePlayers.has(p.id)) {
      this.createRemotePlayer(p);
    }
  };

  private onPlayerMoved = (data: { id: string; x: number; y: number }) => {
    const remote = this.remotePlayers.get(data.id);
    if (remote && !remote.isDead) {
      remote.targetX = data.x;
      remote.targetY = data.y;
    }
  };

  private onPlayerEmoted = (data: { id: string; emote: { text: string } }) => {
    const socket = socketService.getSocket();
    if (socket && data.id === socket.id) {
      this.showLocalEmoteBubble(data.emote.text);
    } else {
      const remote = this.remotePlayers.get(data.id);
      if (remote) this.showEmoteBubbleOnContainer(remote.container, data.emote.text);
    }
  };

  private onPlayerLeft = (data: { id: string }) => {
    this.removeRemotePlayer(data.id);
  };

  private onPlayerHit = (data: { attackerId: string; targetId: string; damage: number; targetHealth: number; targetMaxHealth: number }) => {
    const socket = socketService.getSocket();
    const selfId = socket ? socket.id : this.mySocketId;
    const iAmTarget = data.targetId === selfId;

    if (iAmTarget) {
      this.localHealth = data.targetHealth;
      this.updateHealthBar(this.localHealthBarFill, this.localHealth, this.localMaxHealth);
      this.showDamageNumber(this.localPlayer.x, this.localPlayer.y, data.damage, true);
      this.cameras.main.shake(120, 0.008);
      this.localPlayerSprite.setTint(0xff4444);
      this.time.delayedCall(300, () => {
        if (this.localPlayerSprite && this.localPlayerSprite.active) this.localPlayerSprite.clearTint();
      });
    } else {
      const remote = this.remotePlayers.get(data.targetId);
      if (remote) {
        remote.health = data.targetHealth;
        this.updateHealthBar(remote.healthBarFill, remote.health, remote.maxHealth);
        this.showDamageNumber(remote.container.x, remote.container.y, data.damage, false);
        remote.sprite.setTint(0xff4444);
        this.time.delayedCall(300, () => {
          if (remote.sprite && remote.sprite.active) remote.sprite.clearTint();
        });
      }
    }

    // Animate attacker's sword swing (for remote attackers)
    if (data.attackerId !== selfId) {
      const remoteAttacker = this.remotePlayers.get(data.attackerId);
      if (remoteAttacker && remoteAttacker.swordSprite) {
        this.swingRemoteSword(remoteAttacker.swordSprite);
      }
    }

    // Trigger slash effect at target location visible to ALL clients
    const targetX = iAmTarget ? this.localPlayer.x : this.remotePlayers.get(data.targetId)?.container.x;
    const targetY = iAmTarget ? this.localPlayer.y : this.remotePlayers.get(data.targetId)?.container.y;
    if (targetX !== undefined && targetY !== undefined) {
      this.triggerSlashAt(targetX, targetY);
    }
  };

  private onPlayerDied = (data: { targetId: string }) => {
    const socket = socketService.getSocket();
    const selfId = socket ? socket.id : this.mySocketId;
    if (data.targetId === selfId) {
      this.handleLocalDeath();
    } else {
      const remote = this.remotePlayers.get(data.targetId);
      if (remote) this.handleRemoteDeath(remote);
    }
  };

  private onPlayerRespawned = (data: { id: string; x: number; y: number; health: number; maxHealth: number }) => {
    const socket = socketService.getSocket();
    const selfId = socket ? socket.id : this.mySocketId;
    if (data.id === selfId) {
      this.handleLocalRespawn(data.x, data.y, data.health);
    } else {
      const remote = this.remotePlayers.get(data.id);
      if (remote) this.handleRemoteRespawn(remote, data.x, data.y, data.health, data.maxHealth);
    }
  };

  private setupSocketListeners() {
    const socket = socketService.getSocket();
    if (!socket) return;

    this.cleanupSocketListeners();

    socket.on('roomInit', this.onRoomInit);
    socket.on('playerJoined', this.onPlayerJoined);
    socket.on('playerMoved', this.onPlayerMoved);
    socket.on('playerEmoted', this.onPlayerEmoted);
    socket.on('playerLeft', this.onPlayerLeft);
    socket.on('playerHit', this.onPlayerHit);
    socket.on('playerDied', this.onPlayerDied);
    socket.on('playerRespawned', this.onPlayerRespawned);
  }

  private cleanupSocketListeners() {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.off('roomInit', this.onRoomInit);
    socket.off('playerJoined', this.onPlayerJoined);
    socket.off('playerMoved', this.onPlayerMoved);
    socket.off('playerEmoted', this.onPlayerEmoted);
    socket.off('playerLeft', this.onPlayerLeft);
    socket.off('playerHit', this.onPlayerHit);
    socket.off('playerDied', this.onPlayerDied);
    socket.off('playerRespawned', this.onPlayerRespawned);
  }

  // ──────────────────────────────────────────────
  //  COMBAT
  // ──────────────────────────────────────────────

  public performAttack() {
    if (this.localIsDead) return;
    const now = this.time.now;
    if (now - this.lastAttackTime < this.attackCooldown) return;
    this.lastAttackTime = now;

    let nearestId: string | null = null;
    let nearestDist = Infinity;

    this.remotePlayers.forEach((remote, id) => {
      if (remote.isDead) return;
      const dist = Phaser.Math.Distance.Between(
        this.localPlayer.x, this.localPlayer.y,
        remote.container.x, remote.container.y
      );
      if (dist <= ATTACK_RANGE && dist < nearestDist) {
        nearestDist = dist;
        nearestId = id;
      }
    });

    this.swingSword(this.localSwordSprite);

    if (nearestId) {
      socketService.sendAttack(nearestId, ATTACK_DAMAGE);
    }
  }

  private swingSword(sword: Phaser.GameObjects.Image) {
    if (this.isSwinging) return;
    this.isSwinging = true;
    this.tweens.add({
      targets: sword,
      angle: { from: -100, to: 50 },
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => { sword.angle = 0; this.isSwinging = false; },
    });
  }

  private swingRemoteSword(sword: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: sword,
      angle: { from: -100, to: 50 },
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => { sword.angle = 0; },
    });
  }

  private triggerSlashAt(x: number, y: number) {
    const slash = this.add.image(x, y - 10, 'slash_effect');
    slash.setDepth(y + 200).setScale(0.4);
    this.tweens.add({
      targets: slash, scale: 1.4, alpha: 0, angle: 25, duration: 320, ease: 'Power2',
      onComplete: () => slash.destroy(),
    });
  }

  private showDamageNumber(x: number, y: number, damage: number, isLocal: boolean) {
    const dmgText = this.add.text(x, y - 28, `-${damage}`, {
      fontFamily: 'Outfit,sans-serif', fontSize: '20px', fontStyle: 'bold',
      color: isLocal ? '#FF4444' : '#FFD700',
      stroke: '#121026', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(9999);
    this.tweens.add({
      targets: dmgText, y: y - 80, alpha: 0, scale: 1.4, duration: 900, ease: 'Power2',
      onComplete: () => dmgText.destroy(),
    });
  }

  // ──────────────────────────────────────────────
  //  DEATH / RESPAWN
  // ──────────────────────────────────────────────

  private handleLocalDeath() {
    this.localIsDead = true;
    this.localHealth = 0;
    this.updateHealthBar(this.localHealthBarFill, 0, this.localMaxHealth);
    this.tweens.add({ targets: this.localPlayer, angle: 360, alpha: 0.3, scale: 0.6, duration: 600, ease: 'Power2' });

    const deathText = this.add.text(
      this.cameras.main.width / 2, this.cameras.main.height / 2,
      '💀 YOU DIED!\nRespawning in 5s...', {
        fontFamily: 'Outfit,sans-serif', fontSize: '26px', fontStyle: 'bold',
        color: '#FF1744', stroke: '#121026', strokeThickness: 6, align: 'center',
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(10000);

    this.time.delayedCall(4800, () => deathText.destroy());
  }

  private handleLocalRespawn(x: number, y: number, health: number) {
    this.localIsDead = false;
    this.localHealth = health;
    this.localPlayer.setAngle(0);
    this.localPlayer.x = x;
    this.localPlayer.y = y;
    const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
    if (body) body.reset(x, y);
    this.tweens.add({ targets: this.localPlayer, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
    this.updateHealthBar(this.localHealthBarFill, health, this.localMaxHealth);
    this.triggerSparklesAt(x, y, 0x00F58C);
  }

  private handleRemoteDeath(remote: RemotePlayerSprite) {
    remote.isDead = true;
    remote.health = 0;
    this.updateHealthBar(remote.healthBarFill, 0, remote.maxHealth);
    this.tweens.add({ targets: remote.container, angle: 360, alpha: 0.3, scale: 0.6, duration: 600, ease: 'Power2' });
  }

  private handleRemoteRespawn(remote: RemotePlayerSprite, x: number, y: number, health: number, maxHealth: number) {
    remote.isDead = false;
    remote.health = health;
    remote.maxHealth = maxHealth;
    remote.targetX = x;
    remote.targetY = y;
    remote.container.setAngle(0);
    remote.container.x = x;
    remote.container.y = y;
    this.tweens.add({ targets: remote.container, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
    this.updateHealthBar(remote.healthBarFill, health, maxHealth);
    this.triggerSparklesAt(x, y, 0x00F58C);
  }

  // ──────────────────────────────────────────────
  //  UPDATE
  // ──────────────────────────────────────────────

  public update(time: number, _delta: number) {
    if (!this.localPlayer) return;
    const SPEED = 220;
    const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    // If typing in an input field (e.g. chat box), do not capture movement or attack keys
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    const isTyping = activeTag === 'input' || activeTag === 'textarea';

    if (!isTyping && this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.performAttack();
    }

    if (this.localIsDead) return;

    let moveX = 0;
    let moveY = 0;
    let dir: 'up' | 'down' | 'left' | 'right' = 'down';

    if (!isTyping && this.cursors && this.wasdKeys) {
      if (this.cursors.left.isDown || this.wasdKeys.A.isDown) { moveX = -1; dir = 'left'; }
      else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) { moveX = 1; dir = 'right'; }
      if (this.cursors.up.isDown || this.wasdKeys.W.isDown) { moveY = -1; dir = 'up'; }
      else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) { moveY = 1; dir = 'down'; }
    }

    if (moveX !== 0 || moveY !== 0) {
      this.targetClickPos = null;
    } else if (this.targetClickPos) {
      const dist = Phaser.Math.Distance.Between(
        this.localPlayer.x, this.localPlayer.y, this.targetClickPos.x, this.targetClickPos.y
      );
      if (dist > 10) {
        const angle = Phaser.Math.Angle.Between(
          this.localPlayer.x, this.localPlayer.y, this.targetClickPos.x, this.targetClickPos.y
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
      if (moveX < 0) {
        this.localPlayerSprite.setFlipX(true);
        this.localSwordSprite.x = -20;
        this.localSwordSprite.setFlipX(true);
      } else if (moveX > 0) {
        this.localPlayerSprite.setFlipX(false);
        this.localSwordSprite.x = 20;
        this.localSwordSprite.setFlipX(false);
      }
    } else {
      this.localPlayerSprite.y = 0;
    }

    if (time - this.lastMoveSendTime > this.moveSendInterval) {
      this.lastMoveSendTime = time;
      socketService.sendMove(
        Math.round(this.localPlayer.x), Math.round(this.localPlayer.y), dir,
        moveX !== 0 || moveY !== 0
      );
    }

    this.remotePlayers.forEach((remote) => {
      if (!remote.isDead) {
        const prevX = remote.container.x;
        remote.container.x = Phaser.Math.Linear(remote.container.x, remote.targetX, 0.25);
        remote.container.y = Phaser.Math.Linear(remote.container.y, remote.targetY, 0.25);
        remote.container.setDepth(remote.container.y);

        const dx = remote.targetX - prevX;
        if (Math.abs(dx) > 0.5) {
          const facingLeft = dx < 0;
          remote.sprite.setFlipX(facingLeft);
          remote.swordSprite.x = facingLeft ? -20 : 20;
          remote.swordSprite.setFlipX(facingLeft);
        }
      }
    });

    this.checkLandmarkDiscoveries();
  }

  // ──────────────────────────────────────────────
  //  EMOTES / DISCOVERIES / SPARKLES
  // ──────────────────────────────────────────────

  private checkLandmarkDiscoveries() {
    const px = this.localPlayer.x;
    const py = this.localPlayer.y;
    ISLAND_LOCATIONS.forEach((loc) => {
      if (this.localDiscoveredLocations.has(loc.id)) return;
      if (Phaser.Math.Distance.Between(px, py, loc.x, loc.y) <= loc.radius) {
        this.localDiscoveredLocations.add(loc.id);
        socketService.sendDiscover(loc.id, loc.name);
        if (this.onDiscoveryCallback) this.onDiscoveryCallback(loc.id, loc.name);
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
    const existing = container.getByName('emoteBubble') as Phaser.GameObjects.Container;
    if (existing) existing.destroy();
    const group = this.add.container(0, -80);
    group.setName('emoteBubble');
    const t = this.add.text(0, 0, text, {
      fontFamily: 'Outfit,sans-serif', fontSize: '14px', color: '#FFFFFF',
      backgroundColor: 'rgba(18,16,38,0.9)', padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
    group.add(t);
    container.add(group);
    this.tweens.add({ targets: group, y: -96, alpha: 0, duration: 3000, ease: 'Power1', onComplete: () => group.destroy() });
  }

  private triggerSparklesAt(x: number, y: number, colorHex: number) {
    for (let i = 0; i < 12; i++) {
      const p = this.add.image(x, y, 'spark_particle').setTint(colorHex).setDepth(y + 100);
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 40;
      this.tweens.add({
        targets: p, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0.2, duration: 800 + Math.random() * 400,
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
