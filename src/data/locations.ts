import { IslandLocation } from '../types/game';

export const ISLAND_LOCATIONS: IslandLocation[] = [
  {
    id: 'shrine-monad',
    name: 'Shrine of Monad',
    description: 'An ancient glowing altar pulsing with 10,000 TPS of parallel execution energy.',
    x: 750,
    y: 220,
    radius: 110,
    icon: '⚡',
    chogLore: 'Legends say this shrine resonates with Genesis Chog aura, amplifying trait powers.',
  },
  {
    id: 'pond-tranquility',
    name: 'Pond of Tranquility',
    description: 'A serene sparkling lagoon surrounded by glowing water lilies and crystal rocks.',
    x: 250,
    y: 220,
    radius: 110,
    icon: '💧',
    chogLore: 'Verdant Froggo Chog first discovered this pond while seeking ultimate relaxation.',
  },
  {
    id: 'speed-plaza',
    name: 'Monad Speed Plaza',
    description: 'The high-speed central social plaza where Chogs meet to chat, wave, and vibe.',
    x: 750,
    y: 650,
    radius: 110,
    icon: '🏛️',
    chogLore: 'The premier social gathering grounds on Chog Island, featuring glowing neon floor tiles.',
  },
];
