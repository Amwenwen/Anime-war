/**
 * GameState — Server-side authoritative game simulation
 * Handles: player positions, combat, minions, towers, base HP, bot AI
 */
const { v4: uuidv4 } = require('uuid');
const HeroData = require('../../shared/heroes');
const SpellData = require('../../shared/spells');

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 2400;
const TOWER_RANGE = 220;
const MINION_SPEED = 80;
const TICK_RATE = 50; // ms
const DELTA = TICK_RATE / 1000;

// Lane waypoints for minions [team1 side, team2 side]
const LANES = {
  top: {
    1: [{ x: 200, y: 200 }, { x: 600, y: 200 }, { x: 1200, y: 600 }, { x: 2200, y: 2200 }],
    2: [{ x: 2200, y: 2200 }, { x: 1200, y: 600 }, { x: 600, y: 200 }, { x: 200, y: 200 }]
  },
  mid: {
    1: [{ x: 200, y: 200 }, { x: 600, y: 600 }, { x: 1200, y: 1200 }, { x: 2200, y: 2200 }],
    2: [{ x: 2200, y: 2200 }, { x: 1200, y: 1200 }, { x: 600, y: 600 }, { x: 200, y: 200 }]
  },
  bot: {
    1: [{ x: 200, y: 200 }, { x: 200, y: 600 }, { x: 600, y: 1200 }, { x: 2200, y: 2200 }],
    2: [{ x: 2200, y: 2200 }, { x: 600, y: 1200 }, { x: 200, y: 600 }, { x: 200, y: 200 }]
  }
};

class Entity {
  constructor(id, type, x, y, team, maxHp) {
    this.id = id;
    this.type = type; // player | minion | tower | base | projectile
    this.x = x;
    this.y = y;
    this.team = team;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.alive = true;
    this.effects = []; // { type, duration, value }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.alive = false;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

class PlayerEntity extends Entity {
  constructor(playerData, x, y) {
    const hero = HeroData[playerData.heroId] || HeroData.naruto;
    super(playerData.id, 'player', x, y, playerData.team, hero.baseHp);
    this.name = playerData.name;
    this.heroId = playerData.heroId;
    this.hero = hero;
    this.isBot = playerData.isBot;
    this.difficulty = playerData.difficulty || 'medium';
    this.spellId = playerData.spellId || 'flash';

    // Stats
    this.speed = hero.speed || 320;
    this.atk = hero.baseAtk;
    this.def = hero.baseDef;
    this.level = 1;
    this.exp = 0;
    this.gold = 500;
    this.kills = 0;
    this.deaths = 0;
    this.assists = 0;

    // Skill cooldowns [s1, s2, s3, ult]
    this.skillCooldowns = [0, 0, 0, 0];
    this.spellCooldown = 0;
    this.attackCooldown = 0;
    this.attackRange = hero.attackRange || 60;

    // Movement target
    this.targetX = x;
    this.targetY = y;
    this.respawnTimer = 0;

    // Bot AI state
    this.botTarget = null;
    this.botState = 'lane'; // lane | fight | retreat | gank
    this.botLane = 'mid';
    this.botWaypointIndex = 0;
  }

  gainExp(amount) {
    this.exp += amount;
    const needed = this.level * 100;
    if (this.exp >= needed) {
      this.exp -= needed;
      this.levelUp();
    }
  }

  levelUp() {
    if (this.level >= 15) return;
    this.level++;
    this.maxHp += 100;
    this.hp = Math.min(this.hp + 100, this.maxHp);
    this.atk += 8;
    this.def += 3;
  }

  tickCooldowns(delta) {
    this.skillCooldowns = this.skillCooldowns.map(cd => Math.max(0, cd - delta));
    this.spellCooldown = Math.max(0, this.spellCooldown - delta);
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
  }

  moveToward(tx, ty, delta) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;
    const spd = this.speed * delta;
    this.x += (dx / dist) * Math.min(spd, dist);
    this.y += (dy / dist) * Math.min(spd, dist);
  }
}

class Minion extends Entity {
  constructor(id, team, lane, waypointIndex) {
    super(id, 'minion', 0, 0, team, 450);
    const start = LANES[lane][team][0];
    this.x = start.x + (Math.random() * 40 - 20);
    this.y = start.y + (Math.random() * 40 - 20);
    this.lane = lane;
    this.waypointIndex = waypointIndex || 1;
    this.speed = MINION_SPEED;
    this.atk = 60;
    this.attackRange = 60;
    this.attackCooldown = 0;
    this.exp = 35;
    this.gold = 30;
    this.targetEntity = null;
  }
}

class Tower extends Entity {
  constructor(id, team, x, y, isBase) {
    super(id, 'tower', x, y, team, isBase ? 5000 : 2000);
    this.atk = isBase ? 200 : 150;
    this.range = TOWER_RANGE;
    this.attackCooldown = 0;
    this.isBase = isBase;
  }
}

class GameState {
  constructor(roomId, players, mode) {
    this.roomId = roomId;
    this.mode = mode;
    this.tick_count = 0;
    this.gameTime = 0; // seconds
    this.status = 'playing'; // playing | ended
    this.winner = null;

    this.players = new Map();
    this.minions = new Map();
    this.towers = new Map();
    this.projectiles = new Map();
    this.events = []; // events to send this tick

    this._minionSpawnTimer = 0;

    this._initMap();
    this._initPlayers(players);
  }

  _initMap() {
    // Team 1 base (top-left), Team 2 base (bottom-right)
    const towers = [
      // Team 1 towers
      { id: 't1_top_t1', team: 1, x: 400, y: 280, base: false },
      { id: 't1_mid_t1', team: 1, x: 400, y: 1200, base: false },
      { id: 't1_bot_t1', team: 1, x: 280, y: 400, base: false },
      { id: 't1_top_t2', team: 1, x: 700, y: 280, base: false },
      { id: 't1_mid_t2', team: 1, x: 700, y: 1200, base: false },
      { id: 't1_base',   team: 1, x: 200, y: 200, base: true  },
      // Team 2 towers
      { id: 't2_top_t1', team: 2, x: 2000, y: 2120, base: false },
      { id: 't2_mid_t1', team: 2, x: 2000, y: 1200, base: false },
      { id: 't2_bot_t1', team: 2, x: 2120, y: 2000, base: false },
      { id: 't2_top_t2', team: 2, x: 1700, y: 2120, base: false },
      { id: 't2_mid_t2', team: 2, x: 1700, y: 1200, base: false },
      { id: 't2_base',   team: 2, x: 2200, y: 2200, base: true  },
    ];

    for (const t of towers) {
      this.towers.set(t.id, new Tower(t.id, t.team, t.x, t.y, t.base));
    }
  }

  _initPlayers(playersArray) {
    const team1Spawn = { x: 300, y: 400 };
    const team2Spawn = { x: 2100, y: 2000 };
    const spread = 80;
    let t1i = 0, t2i = 0;

    for (const p of playersArray) {
      let x, y;
      if (p.team === 1) {
        x = team1Spawn.x + (t1i % 3) * spread;
        y = team1Spawn.y + Math.floor(t1i / 3) * spread;
        t1i++;
      } else {
        x = team2Spawn.x - (t2i % 3) * spread;
        y = team2Spawn.y - Math.floor(t2i / 3) * spread;
        t2i++;
      }
      const entity = new PlayerEntity(p, x, y);
      this.players.set(p.id, entity);
    }
  }

  // ── Tick ─────────────────────────────────────────────────────────────────────
  tick() {
    if (this.status !== 'playing') return;
    this.events = [];
    this.gameTime += DELTA;
    this.tick_count++;

    this._tickCooldowns();
    this._tickRespawns();
    this._tickMinions();
    this._tickTowers();
    this._tickBots();
    this._tickProjectiles();
    this._spawnMinions();
    this._checkWinCondition();
  }

  _tickCooldowns() {
    for (const [, p] of this.players) {
      if (p.alive) p.tickCooldowns(DELTA);
    }
  }

  _tickRespawns() {
    for (const [, p] of this.players) {
      if (!p.alive) {
        p.respawnTimer -= DELTA;
        if (p.respawnTimer <= 0) {
          p.alive = true;
          p.hp = p.maxHp;
          if (p.team === 1) { p.x = 300; p.y = 400; }
          else { p.x = 2100; p.y = 2000; }
          this.events.push({ type: 'respawn', playerId: p.id });
        }
      }
    }
  }

  _spawnMinions() {
    this._minionSpawnTimer += DELTA;
    if (this._minionSpawnTimer < 30) return; // every 30s
    this._minionSpawnTimer = 0;

    const lanes = ['top', 'mid', 'bot'];
    for (const lane of lanes) {
      for (const team of [1, 2]) {
        for (let i = 0; i < 3; i++) {
          const id = 'minion_' + uuidv4().slice(0, 8);
          this.minions.set(id, new Minion(id, team, lane, 1));
        }
      }
    }
  }

  _tickMinions() {
    for (const [id, minion] of this.minions) {
      if (!minion.alive) { this.minions.delete(id); continue; }

      minion.attackCooldown = Math.max(0, minion.attackCooldown - DELTA);

      // Find nearest enemy to engage
      const enemy = this._findNearestEnemy(minion, 120);
      if (enemy && minion.attackCooldown <= 0) {
        minion.attackCooldown = 1.5;
        const dmg = Math.max(1, minion.atk - (enemy.def || 0));
        enemy.takeDamage(dmg);
        this.events.push({ type: 'damage', source: id, target: enemy.id, amount: dmg });

        if (!enemy.alive) {
          this._handleKill(enemy, minion);
        }
        continue;
      }

      // Follow waypoints
      const waypoints = LANES[minion.lane][minion.team];
      if (minion.waypointIndex >= waypoints.length) continue;

      const wp = waypoints[minion.waypointIndex];
      const dx = wp.x - minion.x;
      const dy = wp.y - minion.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20) {
        minion.waypointIndex++;
      } else {
        const spd = minion.speed * DELTA;
        minion.x += (dx / dist) * Math.min(spd, dist);
        minion.y += (dy / dist) * Math.min(spd, dist);
      }
    }
  }

  _tickTowers() {
    for (const [, tower] of this.towers) {
      if (!tower.alive) continue;
      tower.attackCooldown = Math.max(0, tower.attackCooldown - DELTA);
      if (tower.attackCooldown > 0) continue;

      // Find nearest enemy in range (minion first, then player)
      const target = this._findNearestEnemyInRange(tower, tower.range);
      if (!target) continue;

      tower.attackCooldown = 1.0;
      const dmg = tower.atk;
      target.takeDamage(dmg);
      this.events.push({ type: 'towerShot', towerId: tower.id, target: target.id, amount: dmg });

      if (!target.alive) {
        this._handleKill(target, tower);
      }
    }
  }

  _tickBots() {
    for (const [, p] of this.players) {
      if (!p.isBot || !p.alive) continue;
      this._runBotAI(p);
    }
  }

  _runBotAI(bot) {
    const aggressionRadius = bot.difficulty === 'hard' ? 400 : bot.difficulty === 'medium' ? 280 : 180;

    // Retreat if low HP
    if (bot.hp / bot.maxHp < 0.25) {
      bot.botState = 'retreat';
    } else if (bot.botState === 'retreat' && bot.hp / bot.maxHp > 0.6) {
      bot.botState = 'lane';
    }

    if (bot.botState === 'retreat') {
      const base = bot.team === 1 ? { x: 300, y: 400 } : { x: 2100, y: 2000 };
      bot.moveToward(base.x, base.y, DELTA);
      return;
    }

    // Look for nearby enemy
    const enemy = this._findNearestEnemyPlayer(bot, aggressionRadius);
    if (enemy) {
      bot.botState = 'fight';
      bot.targetX = enemy.x;
      bot.targetY = enemy.y;

      const dist = bot.distanceTo(enemy);
      if (dist <= bot.attackRange + 10 && bot.attackCooldown <= 0) {
        bot.attackCooldown = bot.hero.attackSpeed || 1.0;
        const dmg = Math.max(1, bot.atk - (enemy.def || 0));
        enemy.takeDamage(dmg);
        this.events.push({ type: 'damage', source: bot.id, target: enemy.id, amount: dmg });

        if (!enemy.alive) {
          this._handleKill(enemy, bot);
        }
      } else if (dist > bot.attackRange + 10) {
        bot.moveToward(enemy.x, enemy.y, DELTA);
      }

      // Use skills randomly
      if (bot.difficulty !== 'easy') {
        const skillIdx = Math.floor(Math.random() * 3);
        if (bot.skillCooldowns[skillIdx] <= 0 && Math.random() < 0.01) {
          this.useSkill(bot.id, skillIdx, enemy.x, enemy.y);
        }
      }
      return;
    }

    bot.botState = 'lane';

    // Follow mid lane waypoints
    const waypoints = LANES[bot.botLane][bot.team];
    if (bot.botWaypointIndex >= waypoints.length) {
      bot.botWaypointIndex = waypoints.length - 1;
    }
    const wp = waypoints[bot.botWaypointIndex];
    const dist = bot.distanceTo({ x: wp.x, y: wp.y });
    if (dist < 40) {
      bot.botWaypointIndex = Math.min(bot.botWaypointIndex + 1, waypoints.length - 1);
    }
    bot.moveToward(wp.x, wp.y, DELTA);
  }

  _tickProjectiles() {
    for (const [id, proj] of this.projectiles) {
      proj.x += proj.vx * DELTA;
      proj.y += proj.vy * DELTA;
      proj.life -= DELTA;

      if (proj.life <= 0) { this.projectiles.delete(id); continue; }

      // Check hits
      const allEntities = [...this.players.values(), ...this.minions.values(), ...this.towers.values()];
      for (const ent of allEntities) {
        if (!ent.alive || ent.team === proj.team) continue;
        const dx = ent.x - proj.x;
        const dy = ent.y - proj.y;
        if (Math.sqrt(dx * dx + dy * dy) < proj.radius) {
          ent.takeDamage(proj.damage);
          this.events.push({ type: 'damage', source: proj.ownerId, target: ent.id, amount: proj.damage });
          if (!ent.alive) this._handleKill(ent, this.players.get(proj.ownerId));
          this.projectiles.delete(id);
          break;
        }
      }
    }
  }

  // ── Combat Actions ────────────────────────────────────────────────────────────
  movePlayer(socketId, x, y) {
    const p = this.players.get(socketId);
    if (!p || !p.alive) return;
    p.targetX = Math.max(0, Math.min(MAP_WIDTH, x));
    p.targetY = Math.max(0, Math.min(MAP_HEIGHT, y));
    p.moveToward(p.targetX, p.targetY, DELTA * 3); // apply immediately once
  }

  attack(socketId, targetId) {
    const attacker = this.players.get(socketId);
    if (!attacker || !attacker.alive || attacker.attackCooldown > 0) return null;

    const target = this._getEntity(targetId);
    if (!target || !target.alive || target.team === attacker.team) return null;

    const dist = attacker.distanceTo(target);
    if (dist > attacker.attackRange + 30) return null;

    attacker.attackCooldown = attacker.hero.attackSpeed || 1.0;
    const dmg = Math.max(1, attacker.atk - (target.def || 0));
    target.takeDamage(dmg);
    this.events.push({ type: 'damage', source: socketId, target: targetId, amount: dmg });

    if (!target.alive) {
      this._handleKill(target, attacker);
    }

    return { sourceId: socketId, targetId, damage: dmg };
  }

  useSkill(socketId, skillIndex, targetX, targetY) {
    const p = this.players.get(socketId);
    if (!p || !p.alive) return null;
    if (p.skillCooldowns[skillIndex] > 0) return null;

    const skill = p.hero.skills[skillIndex];
    if (!skill) return null;

    p.skillCooldowns[skillIndex] = skill.cooldown;

    const result = skill.execute(p, { x: targetX, y: targetY }, this);
    if (result) {
      this.events.push({ type: 'skill', playerId: socketId, skillIndex, ...result });
    }
    return result;
  }

  useSpell(socketId, targetX, targetY) {
    const p = this.players.get(socketId);
    if (!p || !p.alive || p.spellCooldown > 0) return null;

    const spell = SpellData[p.spellId];
    if (!spell) return null;

    p.spellCooldown = spell.cooldown;
    const result = spell.execute(p, { x: targetX, y: targetY }, this);
    this.events.push({ type: 'spell', playerId: socketId, spellId: p.spellId, ...result });
    return result;
  }

  spawnProjectile(ownerId, team, x, y, vx, vy, damage, radius, life) {
    const id = 'proj_' + uuidv4().slice(0, 8);
    this.projectiles.set(id, { id, ownerId, team, x, y, vx, vy, damage, radius, life });
    return id;
  }

  dealAoeDamage(ownerId, team, cx, cy, radius, damage) {
    const allEntities = [...this.players.values(), ...this.minions.values(), ...this.towers.values()];
    const hit = [];
    for (const ent of allEntities) {
      if (!ent.alive || ent.team === team) continue;
      const dx = ent.x - cx;
      const dy = ent.y - cy;
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        ent.takeDamage(damage);
        hit.push(ent.id);
        this.events.push({ type: 'damage', source: ownerId, target: ent.id, amount: damage });
        if (!ent.alive) this._handleKill(ent, this.players.get(ownerId));
      }
    }
    return hit;
  }

  _handleKill(victim, killer) {
    // Respawn timer = 5 + 2*level seconds
    if (victim.type === 'player') {
      victim.respawnTimer = 5 + victim.level * 2;
      victim.deaths++;
      if (killer && killer.type === 'player') {
        killer.kills++;
        killer.gainExp(80);
        killer.gold += 150;
        this.events.push({ type: 'kill', killer: killer.id, victim: victim.id });
      }
    } else if (victim.type === 'minion') {
      // Credit nearest player
      const nearPlayer = this._findNearestAllyPlayer(victim, 300, killer ? killer.team : null);
      if (nearPlayer) {
        nearPlayer.gainExp(victim.exp || 35);
        nearPlayer.gold += victim.gold || 30;
      }
    } else if (victim.type === 'tower') {
      this.events.push({ type: 'towerDestroyed', towerId: victim.id, team: victim.team });
    }
  }

  _checkWinCondition() {
    const t1Base = this.towers.get('t1_base');
    const t2Base = this.towers.get('t2_base');
    if (t1Base && !t1Base.alive) {
      this.status = 'ended';
      this.winner = 2;
      this.events.push({ type: 'gameOver', winner: 2 });
    } else if (t2Base && !t2Base.alive) {
      this.status = 'ended';
      this.winner = 1;
      this.events.push({ type: 'gameOver', winner: 1 });
    }
  }

  _getEntity(id) {
    return this.players.get(id) || this.minions.get(id) || this.towers.get(id);
  }

  _findNearestEnemy(entity, maxRange) {
    let closest = null;
    let closestDist = maxRange;
    const all = [...this.players.values(), ...this.minions.values()];
    for (const e of all) {
      if (!e.alive || e.team === entity.team) continue;
      const d = entity.distanceTo(e);
      if (d < closestDist) { closestDist = d; closest = e; }
    }
    return closest;
  }

  _findNearestEnemyPlayer(entity, maxRange) {
    let closest = null;
    let closestDist = maxRange;
    for (const [, p] of this.players) {
      if (!p.alive || p.team === entity.team) continue;
      const d = entity.distanceTo(p);
      if (d < closestDist) { closestDist = d; closest = p; }
    }
    return closest;
  }

  _findNearestEnemyInRange(entity, range) {
    // Towers prefer minions, then players
    let closest = null;
    let closestDist = range;
    const all = [...this.minions.values(), ...this.players.values()];
    for (const e of all) {
      if (!e.alive || e.team === entity.team) continue;
      const d = entity.distanceTo(e);
      if (d < closestDist) { closestDist = d; closest = e; }
    }
    return closest;
  }

  _findNearestAllyPlayer(entity, range, team) {
    if (!team) return null;
    let closest = null;
    let closestDist = range;
    for (const [, p] of this.players) {
      if (!p.alive || p.team !== team) continue;
      const d = entity.distanceTo(p);
      if (d < closestDist) { closestDist = d; closest = p; }
    }
    return closest;
  }

  // ── State Serialization ───────────────────────────────────────────────────────
  getState() {
    const players = {};
    for (const [id, p] of this.players) {
      players[id] = {
        id, x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
        alive: p.alive, team: p.team, level: p.level,
        heroId: p.heroId, isBot: p.isBot, name: p.name,
        kills: p.kills, deaths: p.deaths, assists: p.assists,
        gold: p.gold, skillCooldowns: p.skillCooldowns,
        spellCooldown: p.spellCooldown,
        respawnTimer: p.respawnTimer
      };
    }

    const minions = {};
    for (const [id, m] of this.minions) {
      minions[id] = { id, x: m.x, y: m.y, hp: m.hp, maxHp: m.maxHp, team: m.team, alive: m.alive };
    }

    const towers = {};
    for (const [id, t] of this.towers) {
      towers[id] = { id, x: t.x, y: t.y, hp: t.hp, maxHp: t.maxHp, team: t.team, alive: t.alive, isBase: t.isBase };
    }

    const projectiles = {};
    for (const [id, pr] of this.projectiles) {
      projectiles[id] = { id, x: pr.x, y: pr.y, team: pr.team };
    }

    return {
      gameTime: this.gameTime,
      status: this.status,
      winner: this.winner,
      players,
      minions,
      towers,
      projectiles,
      events: this.events
    };
  }

  static getMapData(mode) {
    return {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      tileSize: 64,
      lanes: ['top', 'mid', 'bot']
    };
  }
}

module.exports = GameState;
