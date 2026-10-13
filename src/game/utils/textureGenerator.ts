import Phaser from 'phaser';
import { CHOG_CHARACTERS } from '../../data/characters';

/**
 * Generates custom canvas textures for Chog characters, tiles, and map elements.
 * Features the authentic Chog Genesis spiky-haired creature design!
 */
export function generateGameTextures(scene: Phaser.Scene) {
  generateGrassTile(scene);
  generatePathTile(scene);
  generateWaterTile(scene);
  generateSandTile(scene);
  generatePlazaTile(scene);

  generateTreeTexture(scene);
  generateRockTexture(scene);
  generateShrineTexture(scene);
  generatePondDetailTexture(scene);
  generateParticleTexture(scene);
  generateSwordTexture(scene);
  generateSlashTexture(scene);

  // Generate authentic spiky Chog character textures
  CHOG_CHARACTERS.forEach((char) => {
    generateAuthenticChogSprite(scene, char.id, char.colorHex, char.secondaryColorHex, char.auraColorHex, char.id);
  });
}

function generateGrassTile(scene: Phaser.Scene) {
  if (scene.textures.exists('tile_grass')) return;
  const canvas = scene.textures.createCanvas('tile_grass', 64, 64);
  if (!canvas) return;
  const ctx = canvas.context;

  const grad = ctx.createLinearGradient(0, 0, 64, 64);
  grad.addColorStop(0, '#2e7d32');
  grad.addColorStop(1, '#1b5e20');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#4caf50';
  for (let i = 0; i < 14; i++) {
    const rx = (i * 17 + 5) % 58;
    const ry = (i * 23 + 9) % 58;
    ctx.fillRect(rx, ry, 3, 7);
    ctx.fillRect(rx + 2, ry - 2, 2, 5);
  }
  canvas.refresh();
}

function generatePathTile(scene: Phaser.Scene) {
  if (scene.textures.exists('tile_path')) return;
  const canvas = scene.textures.createCanvas('tile_path', 64, 64);
  if (!canvas) return;
  const ctx = canvas.context;

  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(0, 0, 64, 64);

  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = 0; y < 64; y += 16) {
    ctx.moveTo(0, y);
    ctx.lineTo(64, y);
  }
  for (let x = 0; x < 64; x += 16) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 64);
  }
  ctx.stroke();
  canvas.refresh();
}

function generateWaterTile(scene: Phaser.Scene) {
  if (scene.textures.exists('tile_water')) return;
  const canvas = scene.textures.createCanvas('tile_water', 64, 64);
  if (!canvas) return;
  const ctx = canvas.context;

  ctx.fillStyle = '#0288d1';
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(8, 12, 20, 4);
  ctx.fillRect(36, 40, 18, 4);
  canvas.refresh();
}

function generateSandTile(scene: Phaser.Scene) {
  if (scene.textures.exists('tile_sand')) return;
  const canvas = scene.textures.createCanvas('tile_sand', 64, 64);
  if (!canvas) return;
  const ctx = canvas.context;

  ctx.fillStyle = '#fbc02d';
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#fff59d';
  for (let i = 0; i < 10; i++) {
    ctx.fillRect((i * 13) % 60, (i * 19) % 60, 2, 2);
  }
  canvas.refresh();
}

function generatePlazaTile(scene: Phaser.Scene) {
  if (scene.textures.exists('tile_plaza')) return;
  const canvas = scene.textures.createCanvas('tile_plaza', 64, 64);
  if (!canvas) return;
  const ctx = canvas.context;

  ctx.fillStyle = '#261b4d';
  ctx.fillRect(0, 0, 64, 64);

  ctx.strokeStyle = 'rgba(131, 110, 249, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 56, 56);

  ctx.fillStyle = '#00F58C';
  ctx.fillRect(28, 28, 8, 8);
  canvas.refresh();
}

function generateTreeTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('obj_tree')) return;
  const canvas = scene.textures.createCanvas('obj_tree', 80, 96);
  if (!canvas) return;
  const ctx = canvas.context;

  ctx.fillStyle = '#4e342e';
  ctx.fillRect(32, 56, 16, 40);

  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.arc(40, 44, 32, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#388e3c';
  ctx.beginPath();
  ctx.arc(32, 36, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(46, 32, 18, 0, Math.PI * 2);
  ctx.fill();

  canvas.refresh();
}

function generateRockTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('obj_rock')) return;
  const canvas = scene.textures.createCanvas('obj_rock', 64, 64);
  if (!canvas) return;
  const ctx = canvas.context;

  ctx.fillStyle = '#78909c';
  ctx.beginPath();
  ctx.ellipse(32, 36, 24, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#b0bec5';
  ctx.beginPath();
  ctx.ellipse(26, 30, 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  canvas.refresh();
}

function generateShrineTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('obj_shrine')) return;
  const canvas = scene.textures.createCanvas('obj_shrine', 120, 120);
  if (!canvas) return;
  const ctx = canvas.context;

  ctx.fillStyle = '#37474f';
  ctx.fillRect(10, 80, 100, 30);
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(20, 65, 80, 20);

  ctx.fillStyle = '#78909c';
  ctx.fillRect(25, 20, 14, 50);
  ctx.fillRect(81, 20, 14, 50);

  const grad = ctx.createRadialGradient(60, 45, 5, 60, 45, 30);
  grad.addColorStop(0, '#00F58C');
  grad.addColorStop(0.5, '#836EF9');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(60, 45, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(60, 30);
  ctx.lineTo(72, 45);
  ctx.lineTo(60, 60);
  ctx.lineTo(48, 45);
  ctx.closePath();
  ctx.fill();

  canvas.refresh();
}

function generatePondDetailTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('obj_lily')) return;
  const canvas = scene.textures.createCanvas('obj_lily', 40, 40);
  if (!canvas) return;
  const ctx = canvas.context;

  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.arc(20, 20, 16, 0.2, Math.PI * 1.9);
  ctx.lineTo(20, 20);
  ctx.fill();

  ctx.fillStyle = '#f48fb1';
  ctx.beginPath();
  ctx.arc(20, 20, 6, 0, Math.PI * 2);
  ctx.fill();

  canvas.refresh();
}

function generateParticleTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('spark_particle')) return;
  const canvas = scene.textures.createCanvas('spark_particle', 16, 16);
  if (!canvas) return;
  const ctx = canvas.context;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(8, 8, 6, 0, Math.PI * 2);
  ctx.fill();

  canvas.refresh();
}

/**
 * Procedurally draws the authentic Chog Genesis spiky-haired creature sprite sheet!
 * Features the signature 5 spiky hair tufts, cream face oval, big eyes & rosy cheeks!
 */
function generateAuthenticChogSprite(
  scene: Phaser.Scene,
  textureKey: string,
  primaryHex: string,
  secondaryHex: string,
  auraHex: string,
  charId: string
) {
  if (scene.textures.exists(textureKey)) return;

  const canvas = scene.textures.createCanvas(textureKey, 64, 64);
  if (!canvas) return;
  const ctx = canvas.context;

  // 1. Glowing Aura Ring
  const auraGrad = ctx.createRadialGradient(32, 32, 10, 32, 32, 30);
  auraGrad.addColorStop(0, auraHex);
  auraGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();

  // 2. Chog Spiky Hair Tufts (5 signature spikes surrounding head)
  ctx.fillStyle = primaryHex;

  // Center Top Spike
  ctx.beginPath();
  ctx.moveTo(32, 4);
  ctx.lineTo(24, 20);
  ctx.lineTo(40, 20);
  ctx.closePath();
  ctx.fill();

  // Top Left Spike
  ctx.beginPath();
  ctx.moveTo(14, 10);
  ctx.lineTo(8, 26);
  ctx.lineTo(24, 24);
  ctx.closePath();
  ctx.fill();

  // Top Right Spike
  ctx.beginPath();
  ctx.moveTo(50, 10);
  ctx.lineTo(40, 24);
  ctx.lineTo(56, 26);
  ctx.closePath();
  ctx.fill();

  // Mid Left Spike
  ctx.beginPath();
  ctx.moveTo(4, 28);
  ctx.lineTo(12, 42);
  ctx.lineTo(20, 32);
  ctx.closePath();
  ctx.fill();

  // Mid Right Spike
  ctx.beginPath();
  ctx.moveTo(60, 28);
  ctx.lineTo(44, 32);
  ctx.lineTo(52, 42);
  ctx.closePath();
  ctx.fill();

  // 3. Chog Round Head & Body
  ctx.beginPath();
  ctx.arc(32, 30, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(32, 50, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Cream Face Oval Mask (Signature Chog Face)
  ctx.fillStyle = '#FFFDF0';
  ctx.beginPath();
  ctx.ellipse(32, 34, 15, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Rosy Cheeks (Signature Pink Spots)
  ctx.fillStyle = '#FF4081';
  ctx.beginPath();
  ctx.arc(20, 38, 3.5, 0, Math.PI * 2);
  ctx.arc(44, 38, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 6. Big Expressive Eyes
  if (charId === 'chog-cyber-neon') {
    // Cyber HUD Visor
    ctx.fillStyle = '#00E5FF';
    ctx.fillRect(16, 26, 32, 8);
    ctx.fillStyle = '#FF007F';
    ctx.fillRect(20, 28, 8, 4);
    ctx.fillRect(36, 28, 8, 4);
  } else {
    // Large Sclera & Pupils
    ctx.fillStyle = '#121026';
    ctx.beginPath();
    ctx.ellipse(24, 29, 4.5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(40, 29, 4.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye Catchlight Shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(25.5, 27, 2, 0, Math.PI * 2);
    ctx.arc(41.5, 27, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Cute Nose & Smile
  ctx.fillStyle = '#E91E63';
  ctx.beginPath();
  ctx.arc(32, 35, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#121026';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(32, 37, 4, 0.1, Math.PI - 0.1);
  ctx.stroke();

  canvas.refresh();
}

export function generateSwordTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('sword')) return;
  const canvas = scene.textures.createCanvas('sword', 32, 48);
  if (!canvas) return;
  const ctx = canvas.context;

  const bladeGrad = ctx.createLinearGradient(12, 4, 20, 40);
  bladeGrad.addColorStop(0, '#E0E0E0');
  bladeGrad.addColorStop(0.5, '#FFFFFF');
  bladeGrad.addColorStop(1, '#9E9E9E');
  ctx.fillStyle = bladeGrad;
  ctx.beginPath();
  ctx.moveTo(16, 2);
  ctx.lineTo(20, 36);
  ctx.lineTo(12, 36);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#DDDDDD';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, 2);
  ctx.lineTo(13, 34);
  ctx.stroke();

  ctx.fillStyle = '#FFD700';
  ctx.fillRect(7, 34, 18, 5);
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 1;
  ctx.strokeRect(7, 34, 18, 5);

  const handleGrad = ctx.createLinearGradient(13, 39, 19, 46);
  handleGrad.addColorStop(0, '#5D4037');
  handleGrad.addColorStop(1, '#3E2723');
  ctx.fillStyle = handleGrad;
  ctx.fillRect(13, 39, 6, 7);

  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(16, 46, 3, 0, Math.PI * 2);
  ctx.fill();

  canvas.refresh();
}

export function generateSlashTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('slash_effect')) return;
  const canvas = scene.textures.createCanvas('slash_effect', 80, 80);
  if (!canvas) return;
  const ctx = canvas.context;

  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(40, 40);
    ctx.rotate((Math.PI / 4) * i - Math.PI / 8);
    ctx.globalAlpha = 0.9 - i * 0.15;
    ctx.strokeStyle = 'rgba(255,255,160,0.9)';
    ctx.lineWidth = 4 - i;
    ctx.beginPath();
    ctx.moveTo(-30, -5 + i * 3);
    ctx.quadraticCurveTo(0, -22 + i * 4, 30, -5 + i * 3);
    ctx.stroke();
    ctx.restore();
  }

  canvas.refresh();
}
