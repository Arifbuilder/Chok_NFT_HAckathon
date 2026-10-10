import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Phaser from 'phaser';
import { IslandScene } from './scenes/IslandScene';

export interface PhaserGameHandle {
  triggerEmote: (type: string, text: string) => void;
  updateCharacter: (characterId: string) => void;
  getScene: () => IslandScene | null;
}

interface PhaserGameProps {
  nickname: string;
  characterId: string;
  onDiscovery?: (locationId: string, locationName: string) => void;
}

export const PhaserGame = forwardRef<PhaserGameHandle, PhaserGameProps>(
  ({ nickname, characterId, onDiscovery }, ref) => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<IslandScene | null>(null);

    useImperativeHandle(ref, () => ({
      triggerEmote: (type: string, text: string) => {
        if (sceneRef.current) {
          sceneRef.current.triggerLocalEmote(type, text);
        }
      },
      updateCharacter: (newCharId: string) => {
        if (sceneRef.current) {
          sceneRef.current.updateCharacter(newCharId);
        }
      },
      getScene: () => sceneRef.current,
    }));

    useEffect(() => {
      if (!gameContainerRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameContainerRef.current,
        width: 1000,
        height: 650,
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
      <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden rounded-2xl border border-purple-900/40 shadow-2xl shadow-purple-950/50">
        <div ref={gameContainerRef} className="rounded-xl overflow-hidden shadow-inner" />
      </div>
    );
  }
);

PhaserGame.displayName = 'PhaserGame';
