/**
 * Anime War — Hero Definitions
 * Each hero has: role, stats, 3 skills + 1 ultimate
 */

const heroes = {
  // ── ASSASSIN ──────────────────────────────────────────────────────────────
  naruto: {
    id: 'naruto',
    name: 'Naruto Uzumaki',
    anime: 'Naruto',
    role: 'assassin',
    description: 'Shadow Clone Jutsu master. High burst damage and mobility.',
    color: 0xff8c00,
    baseHp: 2800,
    baseAtk: 160,
    baseDef: 20,
    speed: 360,
    attackRange: 65,
    attackSpeed: 0.9,
    skills: [
      {
        id: 's1', name: 'Shadow Clone Strike', cooldown: 6,
        description: 'Dashes to target and strikes with clone, dealing 300 physical damage.',
        execute(caster, target, gs) {
          caster.x = target.x - 50 * Math.sign(target.x - caster.x);
          caster.y = target.y - 50 * Math.sign(target.y - caster.y);
          const dmg = 300 + caster.atk * 0.8;
          gs.dealAoeDamage(caster.id, caster.team, target.x, target.y, 80, dmg);
          return { fx: 'dash', x: target.x, y: target.y, damage: dmg };
        }
      },
      {
        id: 's2', name: 'Rasengan', cooldown: 8,
        description: 'Fires a spiraling orb dealing 400 magic damage in a cone.',
        execute(caster, target, gs) {
          const dx = target.x - caster.x, dy = target.y - caster.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const speed = 500;
          gs.spawnProjectile(caster.id, caster.team, caster.x, caster.y,
            dx / len * speed, dy / len * speed, 400 + caster.atk, 40, 1.5);
          return { fx: 'rasengan', ox: caster.x, oy: caster.y, tx: target.x, ty: target.y };
        }
      },
      {
        id: 's3', name: 'Chakra Dash', cooldown: 4,
        description: 'Boosts speed by 60% for 2 seconds.',
        execute(caster) {
          caster.speed *= 1.6;
          setTimeout(() => { caster.speed /= 1.6; }, 2000);
          return { fx: 'speedBoost', playerId: caster.id, duration: 2 };
        }
      },
      {
        id: 'ult', name: 'Sage Mode: Tailed Beast Bomb', cooldown: 45,
        description: 'Enters Sage Mode. Launches a massive explosion dealing 1200 AoE damage.',
        execute(caster, target, gs) {
          const dmg = 1200 + caster.atk * 1.5;
          gs.dealAoeDamage(caster.id, caster.team, target.x, target.y, 250, dmg);
          return { fx: 'tailed_beast', x: target.x, y: target.y, damage: dmg, radius: 250 };
        }
      }
    ]
  },

  // ── FIGHTER ───────────────────────────────────────────────────────────────
  goku: {
    id: 'goku',
    name: 'Son Goku',
    anime: 'Dragon Ball Z',
    role: 'fighter',
    description: 'Saiyan warrior with earth-shattering power and Ki blasts.',
    color: 0xffd700,
    baseHp: 3600,
    baseAtk: 180,
    baseDef: 35,
    speed: 320,
    attackRange: 70,
    attackSpeed: 1.0,
    skills: [
      {
        id: 's1', name: 'Kamehameha', cooldown: 7,
        description: 'Fires a concentrated Ki beam dealing 500 damage in a line.',
        execute(caster, target, gs) {
          const dx = target.x - caster.x, dy = target.y - caster.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          gs.spawnProjectile(caster.id, caster.team, caster.x, caster.y,
            dx / len * 700, dy / len * 700, 500 + caster.atk * 1.2, 35, 1.2);
          return { fx: 'kamehameha', ox: caster.x, oy: caster.y, tx: target.x, ty: target.y };
        }
      },
      {
        id: 's2', name: 'Instant Transmission', cooldown: 10,
        description: 'Teleports to target location instantly.',
        execute(caster, target) {
          caster.x = target.x; caster.y = target.y;
          return { fx: 'teleport', x: target.x, y: target.y };
        }
      },
      {
        id: 's3', name: 'Ki Shield', cooldown: 12,
        description: 'Surrounds self with Ki, gaining +80 defense for 4 seconds.',
        execute(caster) {
          caster.def += 80;
          setTimeout(() => { caster.def -= 80; }, 4000);
          return { fx: 'shield', playerId: caster.id, duration: 4 };
        }
      },
      {
        id: 'ult', name: 'Super Saiyan Blue: Spirit Bomb', cooldown: 50,
        description: 'Transforms and drops a massive Spirit Bomb dealing 1500 AoE damage.',
        execute(caster, target, gs) {
          const dmg = 1500 + caster.atk * 2;
          gs.dealAoeDamage(caster.id, caster.team, target.x, target.y, 300, dmg);
          return { fx: 'spirit_bomb', x: target.x, y: target.y, damage: dmg, radius: 300 };
        }
      }
    ]
  },

  // ── MAGE ──────────────────────────────────────────────────────────────────
  ichigo: {
    id: 'ichigo',
    name: 'Ichigo Kurosaki',
    anime: 'Bleach',
    role: 'mage',
    description: 'Soul Reaper with devastating Getsuga Tensho attacks.',
    color: 0x1a0066,
    baseHp: 2600,
    baseAtk: 200,
    baseDef: 15,
    speed: 340,
    attackRange: 90,
    attackSpeed: 1.1,
    skills: [
      {
        id: 's1', name: 'Getsuga Tensho', cooldown: 5,
        description: 'Swings Zangetsu releasing a dark energy wave for 350 damage.',
        execute(caster, target, gs) {
          const dx = target.x - caster.x, dy = target.y - caster.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          gs.spawnProjectile(caster.id, caster.team, caster.x, caster.y,
            dx / len * 600, dy / len * 600, 350 + caster.atk, 50, 1.0);
          return { fx: 'getsuga', ox: caster.x, oy: caster.y, tx: target.x, ty: target.y };
        }
      },
      {
        id: 's2', name: 'Flash Step', cooldown: 6,
        description: 'Blinks behind target and deals 200 damage.',
        execute(caster, target, gs) {
          caster.x = target.x + 40; caster.y = target.y;
          gs.dealAoeDamage(caster.id, caster.team, target.x, target.y, 60, 200 + caster.atk * 0.5);
          return { fx: 'flash_step', x: target.x, y: target.y };
        }
      },
      {
        id: 's3', name: 'Hollow Mask', cooldown: 15,
        description: 'Dons the Hollow Mask boosting ATK by 100 for 5 seconds.',
        execute(caster) {
          caster.atk += 100;
          setTimeout(() => { caster.atk -= 100; }, 5000);
          return { fx: 'hollow_mask', playerId: caster.id, duration: 5 };
        }
      },
      {
        id: 'ult', name: 'Mugetsu: Final Getsuga', cooldown: 55,
        description: 'Ultimate form. Sweeps entire lane dealing 2000 damage.',
        execute(caster, target, gs) {
          const dmg = 2000 + caster.atk * 2.5;
          gs.dealAoeDamage(caster.id, caster.team, target.x, target.y, 350, dmg);
          return { fx: 'mugetsu', x: target.x, y: target.y, damage: dmg, radius: 350 };
        }
      }
    ]
  },

  // ── TANK ──────────────────────────────────────────────────────────────────
  luffy: {
    id: 'luffy',
    name: 'Monkey D. Luffy',
    anime: 'One Piece',
    role: 'tank',
    description: 'Rubber man who absorbs hits and pulls enemies in.',
    color: 0xff2200,
    baseHp: 4200,
    baseAtk: 130,
    baseDef: 60,
    speed: 300,
    attackRange: 180,
    attackSpeed: 1.2,
    skills: [
      {
        id: 's1', name: 'Gum Gum Pistol', cooldown: 4,
        description: 'Stretches arm to punch a distant enemy for 250 damage.',
        execute(caster, target, gs) {
          gs.dealAoeDamage(caster.id, caster.team, target.x, target.y, 50, 250 + caster.atk * 0.7);
          return { fx: 'pistol', ox: caster.x, oy: caster.y, tx: target.x, ty: target.y };
        }
      },
      {
        id: 's2', name: 'Gum Gum Hook', cooldown: 9,
        description: 'Grabs nearest enemy, pulling them to Luffy for 150 damage and stun 1s.',
        execute(caster, target, gs) {
          const enemy = gs._findNearestEnemyPlayer(caster, 400);
          if (enemy) { enemy.x = caster.x + 70; enemy.y = caster.y; }
          gs.dealAoeDamage(caster.id, caster.team, caster.x, caster.y, 90, 150 + caster.atk * 0.4);
          return { fx: 'hook', ox: caster.x, oy: caster.y };
        }
      },
      {
        id: 's3', name: 'Armament Haki', cooldown: 14,
        description: 'Coats fists in Haki, gaining +100 DEF and +50 ATK for 6 seconds.',
        execute(caster) {
          caster.def += 100; caster.atk += 50;
          setTimeout(() => { caster.def -= 100; caster.atk -= 50; }, 6000);
          return { fx: 'haki', playerId: caster.id, duration: 6 };
        }
      },
      {
        id: 'ult', name: 'Gear 5: Joyboy Awakening', cooldown: 60,
        description: 'Transforms into Gear 5. Massive AoE 1800 damage + heals self 800 HP.',
        execute(caster, target, gs) {
          const dmg = 1800 + caster.atk * 1.8;
          gs.dealAoeDamage(caster.id, caster.team, target.x, target.y, 320, dmg);
          caster.heal(800);
          return { fx: 'gear5', x: target.x, y: target.y, damage: dmg, radius: 320 };
        }
      }
    ]
  },

  // ── SUPPORT ───────────────────────────────────────────────────────────────
  rem: {
    id: 'rem',
    name: 'Rem',
    anime: 'Re:Zero',
    role: 'support',
    description: 'Demon maid who heals allies and slows enemies.',
    color: 0x4499ff,
    baseHp: 2400,
    baseAtk: 110,
    baseDef: 25,
    speed: 300,
    attackRange: 100,
    attackSpeed: 1.3,
    skills: [
      {
        id: 's1', name: 'Morning Star Barrage', cooldown: 5,
        description: 'Throws flail chains dealing 200 damage to enemies in a line.',
        execute(caster, target, gs) {
          const dx = target.x - caster.x, dy = target.y - caster.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          gs.spawnProjectile(caster.id, caster.team, caster.x, caster.y,
            dx / len * 500, dy / len * 500, 200 + caster.atk * 0.6, 40, 1.0);
          return { fx: 'morningstar', ox: caster.x, oy: caster.y, tx: target.x, ty: target.y };
        }
      },
      {
        id: 's2', name: 'Demon\'s Blessing', cooldown: 10,
        description: 'Heals nearest ally for 400 HP.',
        execute(caster, target, gs) {
          const ally = gs._findNearestAllyPlayer(caster, 400, caster.team) || caster;
          ally.heal(400);
          return { fx: 'heal', targetId: ally.id, amount: 400 };
        }
      },
      {
        id: 's3', name: 'Ice Bind', cooldown: 12,
        description: 'Freezes nearest enemy in place for 2 seconds.',
        execute(caster, target, gs) {
          const enemy = gs._findNearestEnemyPlayer(caster, 300);
          if (enemy) {
            const oldSpeed = enemy.speed;
            enemy.speed = 0;
            setTimeout(() => { enemy.speed = oldSpeed; }, 2000);
          }
          return { fx: 'ice_bind', x: target.x, y: target.y };
        }
      },
      {
        id: 'ult', name: 'Oni Soul Awakening', cooldown: 50,
        description: 'Awakens Oni power, healing all allies 600 HP and dealing 800 AoE damage.',
        execute(caster, target, gs) {
          for (const [, p] of gs.players) {
            if (p.team === caster.team && p.alive) p.heal(600);
          }
          const dmg = 800 + caster.atk * 1.4;
          gs.dealAoeDamage(caster.id, caster.team, caster.x, caster.y, 280, dmg);
          return { fx: 'oni_awakening', x: caster.x, y: caster.y, damage: dmg, radius: 280 };
        }
      }
    ]
  },

  // ── MARKSMAN ──────────────────────────────────────────────────────────────
  sasuke: {
    id: 'sasuke',
    name: 'Sasuke Uchiha',
    anime: 'Naruto',
    role: 'marksman',
    description: 'Sharingan user with long-range lighting attacks.',
    color: 0x330033,
    baseHp: 2500,
    baseAtk: 185,
    baseDef: 18,
    speed: 340,
    attackRange: 200,
    attackSpeed: 0.85,
    skills: [
      {
        id: 's1', name: 'Chidori Bolt', cooldown: 5,
        description: 'Fires a bolt of lightning for 320 damage.',
        execute(caster, target, gs) {
          const dx = target.x - caster.x, dy = target.y - caster.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          gs.spawnProjectile(caster.id, caster.team, caster.x, caster.y,
            dx / len * 800, dy / len * 800, 320 + caster.atk, 30, 0.8);
          return { fx: 'chidori_bolt', ox: caster.x, oy: caster.y, tx: target.x, ty: target.y };
        }
      },
      {
        id: 's2', name: 'Sharingan Perception', cooldown: 8,
        description: 'Activates Sharingan, boosting attack speed by 50% for 4 seconds.',
        execute(caster) {
          caster.attackSpeed = (caster.attackSpeed || 0.85) * 0.5;
          setTimeout(() => { caster.attackSpeed = (caster.attackSpeed || 0.85) * 2; }, 4000);
          return { fx: 'sharingan', playerId: caster.id };
        }
      },
      {
        id: 's3', name: 'Phoenix Flower', cooldown: 10,
        description: 'Launches 5 fireballs in a spread pattern, each dealing 150 damage.',
        execute(caster, target, gs) {
          for (let i = -2; i <= 2; i++) {
            const angle = Math.atan2(target.y - caster.y, target.x - caster.x) + i * 0.15;
            gs.spawnProjectile(caster.id, caster.team, caster.x, caster.y,
              Math.cos(angle) * 600, Math.sin(angle) * 600, 150 + caster.atk * 0.4, 25, 1.0);
          }
          return { fx: 'phoenix_flower', ox: caster.x, oy: caster.y, tx: target.x, ty: target.y };
        }
      },
      {
        id: 'ult', name: 'Indra\'s Arrow', cooldown: 55,
        description: 'Calls down a massive lightning arrow dealing 1800 damage in a large area.',
        execute(caster, target, gs) {
          const dmg = 1800 + caster.atk * 2.2;
          gs.dealAoeDamage(caster.id, caster.team, target.x, target.y, 280, dmg);
          return { fx: 'indra_arrow', x: target.x, y: target.y, damage: dmg, radius: 280 };
        }
      }
    ]
  },

  // ── ADDITIONAL HEROES ─────────────────────────────────────────────────────
  vegeta: {
    id: 'vegeta', name: 'Vegeta', anime: 'Dragon Ball Z', role: 'fighter',
    description: 'Prince of all Saiyans. High burst and self-buff.',
    color: 0x4444ff,
    baseHp: 3400, baseAtk: 175, baseDef: 30, speed: 330, attackRange: 75, attackSpeed: 1.0,
    skills: [
      { id: 's1', name: 'Big Bang Attack', cooldown: 6,
        description: 'Launches a devastating energy sphere for 420 damage.',
        execute(c, t, gs) {
          const dx = t.x - c.x, dy = t.y - c.y, l = Math.sqrt(dx*dx+dy*dy)||1;
          gs.spawnProjectile(c.id, c.team, c.x, c.y, dx/l*650, dy/l*650, 420+c.atk, 45, 1.2);
          return { fx: 'big_bang', ox: c.x, oy: c.y, tx: t.x, ty: t.y };
        }
      },
      { id: 's2', name: 'Final Flash', cooldown: 10,
        description: 'Channels and fires an enormous beam for 700 damage.',
        execute(c, t, gs) {
          const dx = t.x - c.x, dy = t.y - c.y, l = Math.sqrt(dx*dx+dy*dy)||1;
          gs.spawnProjectile(c.id, c.team, c.x, c.y, dx/l*750, dy/l*750, 700+c.atk*1.5, 55, 1.0);
          return { fx: 'final_flash', ox: c.x, oy: c.y, tx: t.x, ty: t.y };
        }
      },
      { id: 's3', name: 'Saiyan Pride', cooldown: 15,
        description: 'Gains +120 ATK for 5 seconds.',
        execute(c) {
          c.atk += 120; setTimeout(() => { c.atk -= 120; }, 5000);
          return { fx: 'saiyan_pride', playerId: c.id };
        }
      },
      { id: 'ult', name: 'Final Explosion', cooldown: 60,
        description: 'Sacrifices 20% HP to deal 2200 damage in massive AoE.',
        execute(c, t, gs) {
          c.takeDamage(c.maxHp * 0.2);
          gs.dealAoeDamage(c.id, c.team, t.x, t.y, 350, 2200 + c.atk * 2);
          return { fx: 'final_explosion', x: t.x, y: t.y };
        }
      }
    ]
  },

  zoro: {
    id: 'zoro', name: 'Roronoa Zoro', anime: 'One Piece', role: 'fighter',
    description: 'Three-sword style master. High physical damage.',
    color: 0x006600,
    baseHp: 3200, baseAtk: 190, baseDef: 40, speed: 310, attackRange: 80, attackSpeed: 0.95,
    skills: [
      { id: 's1', name: 'Onigiri', cooldown: 5,
        description: 'Triple slash dealing 380 physical damage in a wide arc.',
        execute(c, t, gs) {
          gs.dealAoeDamage(c.id, c.team, t.x, t.y, 100, 380 + c.atk * 0.9);
          return { fx: 'onigiri', x: t.x, y: t.y };
        }
      },
      { id: 's2', name: '36-Pound Phoenix', cooldown: 8,
        description: 'Fires a flying sword slash for 320 damage.',
        execute(c, t, gs) {
          const dx = t.x - c.x, dy = t.y - c.y, l = Math.sqrt(dx*dx+dy*dy)||1;
          gs.spawnProjectile(c.id, c.team, c.x, c.y, dx/l*600, dy/l*600, 320+c.atk, 40, 1.1);
          return { fx: 'pound_phoenix', ox: c.x, oy: c.y, tx: t.x, ty: t.y };
        }
      },
      { id: 's3', name: 'Demon Aura', cooldown: 12,
        description: 'Releases demonic aura, gaining 80 DEF for 5 seconds.',
        execute(c) {
          c.def += 80; setTimeout(() => { c.def -= 80; }, 5000);
          return { fx: 'demon_aura', playerId: c.id };
        }
      },
      { id: 'ult', name: 'Asura: Three Sword Demon', cooldown: 55,
        description: 'Becomes Asura, creating phantom blades for 2000 damage.',
        execute(c, t, gs) {
          gs.dealAoeDamage(c.id, c.team, t.x, t.y, 200, 2000 + c.atk * 2.5);
          return { fx: 'asura', x: t.x, y: t.y };
        }
      }
    ]
  },

  erza: {
    id: 'erza', name: 'Erza Scarlet', anime: 'Fairy Tail', role: 'fighter',
    description: 'Titania who equips different armors mid-battle.',
    color: 0xcc0000,
    baseHp: 3500, baseAtk: 170, baseDef: 50, speed: 315, attackRange: 75, attackSpeed: 1.0,
    skills: [
      { id: 's1', name: 'Heaven\'s Wheel Blade', cooldown: 5,
        description: 'Sends out spinning blades for 300 AoE damage.',
        execute(c, t, gs) {
          gs.dealAoeDamage(c.id, c.team, t.x, t.y, 130, 300 + c.atk * 0.8);
          return { fx: 'heavens_wheel', x: t.x, y: t.y };
        }
      },
      { id: 's2', name: 'Adamantine Armor', cooldown: 10,
        description: 'Equips strongest armor, gaining 120 DEF for 6 seconds.',
        execute(c) {
          c.def += 120; setTimeout(() => { c.def -= 120; }, 6000);
          return { fx: 'adamantine', playerId: c.id };
        }
      },
      { id: 's3', name: 'Lightning Empress Strike', cooldown: 8,
        description: 'Charges forward and electrifies enemies for 360 damage.',
        execute(c, t, gs) {
          c.x = t.x; c.y = t.y;
          gs.dealAoeDamage(c.id, c.team, t.x, t.y, 110, 360 + c.atk);
          return { fx: 'lightning_empress', x: t.x, y: t.y };
        }
      },
      { id: 'ult', name: 'Fairy Armor: Nakagami Starlight', cooldown: 55,
        description: 'Uses Nakagami Armor, dealing 1900 damage and buffing ATK+DEF.',
        execute(c, t, gs) {
          gs.dealAoeDamage(c.id, c.team, t.x, t.y, 260, 1900 + c.atk * 2);
          c.atk += 60; c.def += 60;
          setTimeout(() => { c.atk -= 60; c.def -= 60; }, 8000);
          return { fx: 'nakagami', x: t.x, y: t.y };
        }
      }
    ]
  },

  nezuko: {
    id: 'nezuko', name: 'Nezuko Kamado', anime: 'Demon Slayer', role: 'assassin',
    description: 'Demon who uses blood burst art for lethal strikes.',
    color: 0xff69b4,
    baseHp: 2700, baseAtk: 165, baseDef: 22, speed: 370, attackRange: 65, attackSpeed: 0.9,
    skills: [
      { id: 's1', name: 'Blood Burst Kick', cooldown: 5,
        description: 'Ignites blood into explosive kick for 280 AoE fire damage.',
        execute(c, t, gs) {
          gs.dealAoeDamage(c.id, c.team, t.x, t.y, 90, 280 + c.atk * 0.75);
          return { fx: 'blood_burst', x: t.x, y: t.y };
        }
      },
      { id: 's2', name: 'Demon Regeneration', cooldown: 14,
        description: 'Rapidly regenerates, restoring 500 HP.',
        execute(c) {
          c.heal(500);
          return { fx: 'regen', playerId: c.id, amount: 500 };
        }
      },
      { id: 's3', name: 'Rapid Claw Flurry', cooldown: 7,
        description: 'Deals 5 rapid strikes, each for 100 damage.',
        execute(c, t, gs) {
          for (let i = 0; i < 5; i++) {
            gs.dealAoeDamage(c.id, c.team, t.x, t.y, 50, 100 + c.atk * 0.2);
          }
          return { fx: 'claw_flurry', x: t.x, y: t.y };
        }
      },
      { id: 'ult', name: 'Awakened Demon Form', cooldown: 50,
        description: 'Fully awakens demon powers, dealing 2000 and gaining insane speed.',
        execute(c, t, gs) {
          gs.dealAoeDamage(c.id, c.team, t.x, t.y, 230, 2000 + c.atk * 2);
          c.speed += 150; setTimeout(() => { c.speed -= 150; }, 6000);
          return { fx: 'demon_awaken', x: t.x, y: t.y };
        }
      }
    ]
  },

  meliodas: {
    id: 'meliodas', name: 'Meliodas', anime: 'Seven Deadly Sins', role: 'assassin',
    description: 'Dragon\'s Sin of Wrath. Full Counter master.',
    color: 0xff4400,
    baseHp: 3000, baseAtk: 195, baseDef: 28, speed: 350, attackRange: 70, attackSpeed: 0.85,
    skills: [
      { id: 's1', name: 'Trillion Dark', cooldown: 5,
        description: 'Unleashes dark energy slashes dealing 350 damage.',
        execute(c, t, gs) {
          const dx = t.x - c.x, dy = t.y - c.y, l = Math.sqrt(dx*dx+dy*dy)||1;
          gs.spawnProjectile(c.id, c.team, c.x, c.y, dx/l*700, dy/l*700, 350+c.atk, 45, 1.0);
          return { fx: 'trillion_dark', ox: c.x, oy: c.y, tx: t.x, ty: t.y };
        }
      },
      { id: 's2', name: 'Full Counter', cooldown: 12,
        description: 'Next hit received is reflected back 1.5x. Active for 2 seconds.',
        execute(c) {
          c._fullCounter = true;
          setTimeout(() => { c._fullCounter = false; }, 2000);
          return { fx: 'full_counter', playerId: c.id };
        }
      },
      { id: 's3', name: 'Hellblaze', cooldown: 8,
        description: 'Channels demonic flames for 400 AoE damage.',
        execute(c, t, gs) {
          gs.dealAoeDamage(c.id, c.team, t.x, t.y, 120, 400 + c.atk * 1.0);
          return { fx: 'hellblaze', x: t.x, y: t.y };
        }
      },
      { id: 'ult', name: 'Assault Mode: Wrath Incarnate', cooldown: 60,
        description: 'Becomes the true demon lord. Massive 2500 damage strike.',
        execute(c, t, gs) {
          gs.dealAoeDamage(c.id, c.team, t.x, t.y, 300, 2500 + c.atk * 2.5);
          return { fx: 'assault_mode', x: t.x, y: t.y };
        }
      }
    ]
  }
};

module.exports = heroes;
