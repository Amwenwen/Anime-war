/**
 * Anime War — Battle Spells (equipped before match, like Mobile Legends)
 * Each player picks 1 spell with a separate cooldown.
 */

const spells = {
  flash: {
    id: 'flash',
    name: 'Flash',
    description: 'Instantly blink to target location. Max range: 400.',
    icon: '⚡',
    cooldown: 120,
    execute(caster, target) {
      const dx = target.x - caster.x;
      const dy = target.y - caster.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxRange = 400;
      const t = Math.min(1, maxRange / (dist || 1));
      caster.x += dx * t;
      caster.y += dy * t;
      return { fx: 'flash', x: caster.x, y: caster.y };
    }
  },

  heal: {
    id: 'heal',
    name: 'Heal',
    description: 'Restores 600 HP to self and 400 HP to nearest ally.',
    icon: '💚',
    cooldown: 90,
    execute(caster, target, gs) {
      caster.heal(600);
      const ally = gs._findNearestAllyPlayer(caster, 500, caster.team);
      if (ally && ally.id !== caster.id) ally.heal(400);
      return { fx: 'heal_spell', x: caster.x, y: caster.y, amount: 600 };
    }
  },

  ignite: {
    id: 'ignite',
    name: 'Ignite',
    description: 'Burns target enemy for 300 true damage over 3 seconds.',
    icon: '🔥',
    cooldown: 80,
    execute(caster, target, gs) {
      const enemy = gs._findNearestEnemyPlayer(caster, 600);
      if (enemy) {
        let ticks = 0;
        const interval = setInterval(() => {
          if (!enemy.alive || ticks >= 6) { clearInterval(interval); return; }
          enemy.takeDamage(50);
          ticks++;
        }, 500);
      }
      return { fx: 'ignite', x: target.x, y: target.y };
    }
  },

  sprint: {
    id: 'sprint',
    name: 'Sprint',
    description: 'Increases movement speed by 80% for 5 seconds.',
    icon: '💨',
    cooldown: 90,
    execute(caster) {
      caster.speed += caster.speed * 0.8;
      setTimeout(() => { caster.speed -= caster.speed * 0.8 / 1.8; }, 5000);
      return { fx: 'sprint', playerId: caster.id, duration: 5 };
    }
  },

  purify: {
    id: 'purify',
    name: 'Purify',
    description: 'Removes all crowd control effects from self.',
    icon: '✨',
    cooldown: 100,
    execute(caster) {
      caster.effects = caster.effects ? caster.effects.filter(e => e.type !== 'cc') : [];
      // Restore speed if frozen
      if (caster.speed === 0) caster.speed = caster.hero ? caster.hero.speed : 300;
      return { fx: 'purify', playerId: caster.id };
    }
  },

  execute: {
    id: 'execute',
    name: 'Execute',
    description: 'Deals 600 true damage to a target below 20% HP (ignores defense).',
    icon: '💀',
    cooldown: 70,
    execute(caster, target, gs) {
      const enemy = gs._findNearestEnemyPlayer(caster, 300);
      if (enemy && enemy.hp / enemy.maxHp < 0.2) {
        enemy.takeDamage(600);
        return { fx: 'execute', targetId: enemy.id, damage: 600 };
      }
      return { fx: 'execute_miss', x: target.x, y: target.y };
    }
  },

  vengeance: {
    id: 'vengeance',
    name: 'Vengeance',
    description: 'For 3 seconds, reflects 50% of damage received back to attacker.',
    icon: '🛡️',
    cooldown: 100,
    execute(caster) {
      caster._vengeance = true;
      setTimeout(() => { caster._vengeance = false; }, 3000);
      return { fx: 'vengeance', playerId: caster.id, duration: 3 };
    }
  },

  flicker: {
    id: 'flicker',
    name: 'Flicker',
    description: 'Dash to target location and knock back nearby enemies.',
    icon: '🌀',
    cooldown: 115,
    execute(caster, target, gs) {
      const dx = target.x - caster.x;
      const dy = target.y - caster.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const range = 500;
      const t = Math.min(1, range / dist);
      caster.x += dx * t;
      caster.y += dy * t;
      // Knockback nearby enemies
      for (const [, p] of gs.players) {
        if (!p.alive || p.team === caster.team) continue;
        const ex = p.x - caster.x, ey = p.y - caster.y;
        const ed = Math.sqrt(ex * ex + ey * ey);
        if (ed < 150) {
          p.x += (ex / ed) * 120;
          p.y += (ey / ed) * 120;
        }
      }
      return { fx: 'flicker', x: caster.x, y: caster.y };
    }
  }
};

module.exports = spells;
