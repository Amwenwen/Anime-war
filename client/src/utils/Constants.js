/**
 * Anime War — Shared constants (client-side)
 */
const GAME_W = 1280;
const GAME_H = 720;

const TILE_SIZE = 64;
const MAP_W = 2400;
const MAP_H = 2400;

// Camera follow speed
const CAM_LERP = 0.1;

// Hero colors (mirrored from server)
const HERO_COLORS = {
  naruto:   0xff8c00,
  goku:     0xffd700,
  ichigo:   0x6600cc,
  luffy:    0xff2200,
  rem:      0x4499ff,
  sasuke:   0x330066,
  vegeta:   0x4444ff,
  zoro:     0x006600,
  erza:     0xcc0000,
  nezuko:   0xff69b4,
  meliodas: 0xff4400
};

// Hero role colors
const ROLE_COLORS = {
  assassin:  '#ff4400',
  fighter:   '#ff8800',
  mage:      '#8800ff',
  tank:      '#0088ff',
  support:   '#00cc88',
  marksman:  '#ffdd00'
};

// Team colors
const TEAM_COLORS = {
  1: 0x4488ff,
  2: 0xff4444
};

// Roles list
const ROLES = ['assassin', 'fighter', 'mage', 'tank', 'support', 'marksman'];

// All heroes (client data — no server logic)
const HEROES_CLIENT = [
  { id: 'naruto',   name: 'Naruto Uzumaki',  anime: 'Naruto',             role: 'assassin', color: 0xff8c00 },
  { id: 'goku',     name: 'Son Goku',         anime: 'Dragon Ball Z',      role: 'fighter',  color: 0xffd700 },
  { id: 'ichigo',   name: 'Ichigo Kurosaki',  anime: 'Bleach',             role: 'mage',     color: 0x6600cc },
  { id: 'luffy',    name: 'Monkey D. Luffy',  anime: 'One Piece',          role: 'tank',     color: 0xff2200 },
  { id: 'rem',      name: 'Rem',              anime: 'Re:Zero',            role: 'support',  color: 0x4499ff },
  { id: 'sasuke',   name: 'Sasuke Uchiha',    anime: 'Naruto',             role: 'marksman', color: 0x330066 },
  { id: 'vegeta',   name: 'Vegeta',           anime: 'Dragon Ball Z',      role: 'fighter',  color: 0x4444ff },
  { id: 'zoro',     name: 'Roronoa Zoro',     anime: 'One Piece',          role: 'fighter',  color: 0x006600 },
  { id: 'erza',     name: 'Erza Scarlet',     anime: 'Fairy Tail',         role: 'fighter',  color: 0xcc0000 },
  { id: 'nezuko',   name: 'Nezuko Kamado',    anime: 'Demon Slayer',       role: 'assassin', color: 0xff69b4 },
  { id: 'meliodas', name: 'Meliodas',         anime: 'Seven Deadly Sins',  role: 'assassin', color: 0xff4400 }
];

const SPELLS_CLIENT = [
  { id: 'flash',    name: 'Flash',    icon: '⚡', desc: 'Blink to target location (range 400).',      cooldown: 120 },
  { id: 'heal',     name: 'Heal',     icon: '💚', desc: 'Restore 600 HP. Heal nearby ally 400 HP.',   cooldown: 90  },
  { id: 'ignite',   name: 'Ignite',   icon: '🔥', desc: 'Burn target for 300 true damage over 3s.',   cooldown: 80  },
  { id: 'sprint',   name: 'Sprint',   icon: '💨', desc: '+80% movement speed for 5 seconds.',         cooldown: 90  },
  { id: 'purify',   name: 'Purify',   icon: '✨', desc: 'Remove all crowd control effects.',          cooldown: 100 },
  { id: 'execute',  name: 'Execute',  icon: '💀', desc: '600 true dmg to target below 20% HP.',      cooldown: 70  },
  { id: 'vengeance',name: 'Vengeance',icon: '🛡️', desc: 'Reflect 50% damage for 3 seconds.',         cooldown: 100 },
  { id: 'flicker',  name: 'Flicker',  icon: '🌀', desc: 'Dash to target and knock back enemies.',     cooldown: 115 }
];
