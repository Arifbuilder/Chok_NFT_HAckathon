import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Phaser from 'phaser';
import { IslandScene } from './scenes/IslandScene';

export interface PhaserGameHandle {
  triggerEmote: (type: string, text: string) => void;
  updateCharacter: (characterId: string) => void;
  getScene: () => IslandScene | null;
  triggerAttack: () => void;
}

interface PhaserGameProps {
  nickname: string;
  characterId: string;
  isRealNFT?: boolean;
  nftImageUrl?: string;
  nftTokenId?: string;
  walletAddress?: string;
  onDiscovery?: (locationId: string, locationName: string) => void;
}

export const PhaserGame = forwardRef<PhaserGameHandle, PhaserGameProps>(
  ({ nickname, characterId, isRealNFT, nftImageUrl, nftTokenId, walletAddress, onDiscovery }, ref) => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<IslandScene | null>(null);

    useImperativeHandle(ref, () => ({
      triggerEmote: (type: string, text: string) => {
        sceneRef.current?.triggerLocalEmote(type, text);
      },
      updateCharacter: (newCharId: string) => {
        sceneRef.current?.updateCharacter(newCharId);
      },
      getScene: () => sceneRef.current,
      triggerAttack: () => {
        sceneRef.current?.performAttack();
      },
    }));

    useEffect(() => {
      if (!gameContainerRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameContainerRef.current,
        backgroundColor: '#0a0a1a',
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: '100%',
          height: '100%',
        },
        pixelArt: true,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [IslandScene],
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;

      game.events.once('ready', () => {
        const scene = game.scene.getScene('IslandScene') as IslandScene;
        sceneRef.current = scene;
        scene.scene.restart({
          nickname,
          characterId,
          isRealNFT,
          nftImageUrl,
          nftTokenId,
          walletAddress,
          onDiscovery,
        });
      });

      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }, []);

    return (
      <div
        ref={gameContainerRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
    );
  }
);

PhaserGame.displayName = 'PhaserGame';
