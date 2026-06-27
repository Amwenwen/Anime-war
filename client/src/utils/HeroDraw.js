/**
 * HeroDraw — Draws detailed hero portraits using Phaser Graphics
 * Each hero has a unique silhouette, colors, and accessories
 */
const HeroDraw = {

  // Draw a full hero portrait onto a Graphics object
  // g = Phaser.GameObjects.Graphics, hero = hero data, cx/cy = center, size = radius
  drawHero(scene, heroId, cx, cy, size, teamColor) {
    const g = scene.add.graphics();
    const d = HeroDraw.heroes[heroId] || HeroDraw.heroes.default;
    d.draw(g, cx, cy, size, teamColor);
    return g;
  },

  // Draw hero icon for minimap / HUD (small)
  drawIcon(scene, heroId, cx, cy, size) {
    const g = scene.add.graphics();
    const hero = HeroDraw.heroes[heroId] || HeroDraw.heroes.default;
    // Simple colored circle with symbol
    g.fillStyle(hero.bodyColor, 1);
    g.fillCircle(cx, cy, size);
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeCircle(cx, cy, size);
    return g;
  },

  heroes: {}
};

// ── NARUTO ────────────────────────────────────────────────────────────────────
HeroDraw.heroes.naruto = {
  bodyColor: 0xff8c00,
  draw(g, cx, cy, s, tc) {
    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s * 1.1, s * 1.6, s * 0.5);
    // Cloak (orange)
    g.fillStyle(0xff6600, 1);
    g.fillTriangle(cx - s * 0.7, cy + s * 1.0, cx + s * 0.7, cy + s * 1.0, cx, cy + s * 0.2);
    // Body
    g.fillStyle(0xff8c00, 1);
    g.fillCircle(cx, cy, s * 0.72);
    // Black collar
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - s * 0.18, cy + s * 0.1, s * 0.36, s * 0.4);
    // Face
    g.fillStyle(0xffcc99, 1);
    g.fillCircle(cx, cy - s * 0.1, s * 0.44);
    // Whisker marks
    g.lineStyle(1.5, 0xcc6644, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.38, cy - s*0.08, cx - s*0.12, cy - s*0.04));
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.36, cy + s*0.04, cx - s*0.12, cy + s*0.05));
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.12, cy - s*0.04, cx + s*0.38, cy - s*0.08));
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.12, cy + s*0.05, cx + s*0.36, cy + s*0.04));
    // Eyes
    g.fillStyle(0x2244ff, 1);
    g.fillCircle(cx - s*0.14, cy - s*0.16, s*0.08);
    g.fillCircle(cx + s*0.14, cy - s*0.16, s*0.08);
    // Headband
    g.fillStyle(0x888888, 1);
    g.fillRect(cx - s*0.44, cy - s*0.54, s*0.88, s*0.16);
    g.lineStyle(1, 0xffffff, 0.6);
    g.strokeRect(cx - s*0.44, cy - s*0.54, s*0.88, s*0.16);
    // Hair (spiky yellow)
    g.fillStyle(0xffdd00, 1);
    for (let i = -2; i <= 2; i++) {
      g.fillTriangle(cx + i*s*0.18, cy - s*0.48, cx + i*s*0.18 - s*0.1, cy - s*0.36, cx + i*s*0.18 + s*0.1, cy - s*0.36);
    }
    // Team color ring
    g.lineStyle(3, tc || 0x4488ff, 1);
    g.strokeCircle(cx, cy, s * 0.98);
  }
};

// ── GOKU ──────────────────────────────────────────────────────────────────────
HeroDraw.heroes.goku = {
  bodyColor: 0xffd700,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.6, s*0.5);
    // Orange gi body
    g.fillStyle(0xff6600, 1);
    g.fillTriangle(cx - s*0.7, cy + s, cx + s*0.7, cy + s, cx, cy + s*0.1);
    g.fillStyle(0xff8800, 1);
    g.fillCircle(cx, cy, s*0.72);
    // Blue undershirt
    g.fillStyle(0x2244cc, 1);
    g.fillRect(cx - s*0.2, cy + s*0.1, s*0.4, s*0.38);
    // Face
    g.fillStyle(0xffcc99, 1);
    g.fillCircle(cx, cy - s*0.1, s*0.44);
    // Eyes
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - s*0.14, cy - s*0.14, s*0.08);
    g.fillCircle(cx + s*0.14, cy - s*0.14, s*0.08);
    // SSJ Hair (spiky gold)
    g.fillStyle(0xffee00, 1);
    g.fillTriangle(cx, cy - s*0.9, cx - s*0.25, cy - s*0.55, cx + s*0.25, cy - s*0.55);
    g.fillTriangle(cx - s*0.2, cy - s*0.8, cx - s*0.42, cy - s*0.52, cx + s*0.05, cy - s*0.52);
    g.fillTriangle(cx + s*0.2, cy - s*0.8, cx - s*0.05, cy - s*0.52, cx + s*0.42, cy - s*0.52);
    g.fillStyle(0x332200, 1);
    g.fillRect(cx - s*0.3, cy - s*0.56, s*0.6, s*0.14);
    // Aura glow
    g.lineStyle(2, 0xffff88, 0.5);
    g.strokeCircle(cx, cy, s*1.05);
    g.lineStyle(3, tc || 0xffd700, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};

// ── ICHIGO ────────────────────────────────────────────────────────────────────
HeroDraw.heroes.ichigo = {
  bodyColor: 0x330066,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.6, s*0.5);
    // Black shinigami robe
    g.fillStyle(0x111111, 1);
    g.fillTriangle(cx - s*0.75, cy + s, cx + s*0.75, cy + s, cx, cy + s*0.05);
    g.fillCircle(cx, cy, s*0.75);
    // White sash
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - s*0.08, cy, s*0.16, s*0.65);
    // Face
    g.fillStyle(0xffddbb, 1);
    g.fillCircle(cx, cy - s*0.1, s*0.44);
    // Angry eyes (furrowed brow)
    g.fillStyle(0x331100, 1);
    g.fillRect(cx - s*0.28, cy - s*0.26, s*0.2, s*0.07);
    g.fillRect(cx + s*0.08, cy - s*0.26, s*0.2, s*0.07);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - s*0.16, cy - s*0.16, s*0.09);
    g.fillCircle(cx + s*0.16, cy - s*0.16, s*0.09);
    // Orange spiky hair
    g.fillStyle(0xff6600, 1);
    g.fillTriangle(cx - s*0.1, cy - s*0.88, cx - s*0.35, cy - s*0.55, cx + s*0.15, cy - s*0.55);
    g.fillTriangle(cx + s*0.1, cy - s*0.82, cx - s*0.15, cy - s*0.52, cx + s*0.38, cy - s*0.52);
    g.fillRect(cx - s*0.3, cy - s*0.56, s*0.62, s*0.14);
    // Zangetsu sword hint
    g.lineStyle(3, 0x444444, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.6, cy - s*0.9, cx + s*0.85, cy + s*0.6));
    g.lineStyle(3, tc || 0x6600cc, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};

// ── LUFFY ─────────────────────────────────────────────────────────────────────
HeroDraw.heroes.luffy = {
  bodyColor: 0xff2200,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.8, s*0.55);
    // Red vest body
    g.fillStyle(0xff2200, 1);
    g.fillTriangle(cx - s*0.8, cy + s, cx + s*0.8, cy + s, cx, cy);
    g.fillCircle(cx, cy, s*0.78);
    // Open chest
    g.fillStyle(0xffcc99, 1);
    g.fillTriangle(cx - s*0.18, cy + s*0.1, cx + s*0.18, cy + s*0.1, cx, cy + s*0.55);
    // X scar
    g.lineStyle(2, 0xaa4444, 0.8);
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.1, cy + s*0.18, cx + s*0.1, cy + s*0.42));
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.1, cy + s*0.18, cx - s*0.1, cy + s*0.42));
    // Face (big grin)
    g.fillStyle(0xffcc99, 1);
    g.fillCircle(cx, cy - s*0.08, s*0.46);
    // Big smile
    g.lineStyle(2.5, 0x441100, 1);
    g.beginPath(); g.arc(cx, cy - s*0.02, s*0.28, 0.1, Math.PI - 0.1); g.strokePath();
    // Eyes
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - s*0.15, cy - s*0.18, s*0.09);
    g.fillCircle(cx + s*0.15, cy - s*0.18, s*0.09);
    // Straw hat
    g.fillStyle(0xeecc44, 1);
    g.fillEllipse(cx, cy - s*0.52, s*1.1, s*0.22);
    g.fillStyle(0xddbb33, 1);
    g.fillEllipse(cx, cy - s*0.6, s*0.62, s*0.28);
    // Hat band red
    g.fillStyle(0xff2200, 1);
    g.fillRect(cx - s*0.55, cy - s*0.55, s*1.1, s*0.08);
    g.lineStyle(3, tc || 0xff2200, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};

// ── REM ───────────────────────────────────────────────────────────────────────
HeroDraw.heroes.rem = {
  bodyColor: 0x4499ff,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.5, s*0.5);
    // Maid dress (blue/white)
    g.fillStyle(0x2266cc, 1);
    g.fillTriangle(cx - s*0.65, cy + s, cx + s*0.65, cy + s, cx, cy + s*0.1);
    g.fillStyle(0x4499ff, 1);
    g.fillCircle(cx, cy, s*0.72);
    // White apron
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(cx - s*0.18, cy + s*0.1, s*0.36, s*0.5);
    g.fillTriangle(cx - s*0.22, cy + s*0.6, cx + s*0.22, cy + s*0.6, cx, cy + s);
    // Face
    g.fillStyle(0xffeedd, 1);
    g.fillCircle(cx, cy - s*0.1, s*0.44);
    // Big eyes (blue)
    g.fillStyle(0x2266ff, 1);
    g.fillCircle(cx - s*0.15, cy - s*0.14, s*0.12);
    g.fillCircle(cx + s*0.15, cy - s*0.14, s*0.12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - s*0.11, cy - s*0.18, s*0.04);
    g.fillCircle(cx + s*0.19, cy - s*0.18, s*0.04);
    // Blue hair
    g.fillStyle(0x3388ff, 1);
    g.fillCircle(cx, cy - s*0.48, s*0.38);
    g.fillRect(cx - s*0.36, cy - s*0.52, s*0.72, s*0.18);
    // Hair ornament
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + s*0.3, cy - s*0.44, s*0.1);
    // Morning star weapon hint
    g.lineStyle(2, 0x888888, 0.8);
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.55, cy - s*0.2, cx + s*0.85, cy + s*0.3));
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx + s*0.88, cy + s*0.34, s*0.1);
    g.lineStyle(3, tc || 0x4499ff, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};

// ── SASUKE ────────────────────────────────────────────────────────────────────
HeroDraw.heroes.sasuke = {
  bodyColor: 0x330066,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.5, s*0.5);
    // Dark blue/purple outfit
    g.fillStyle(0x220044, 1);
    g.fillTriangle(cx - s*0.7, cy + s, cx + s*0.7, cy + s, cx, cy + s*0.08);
    g.fillStyle(0x330066, 1);
    g.fillCircle(cx, cy, s*0.72);
    // High collar
    g.fillStyle(0x220044, 1);
    g.fillRect(cx - s*0.22, cy + s*0.05, s*0.44, s*0.5);
    g.fillTriangle(cx - s*0.22, cy + s*0.05, cx + s*0.22, cy + s*0.05, cx, cy - s*0.15);
    // Face
    g.fillStyle(0xffddbb, 1);
    g.fillCircle(cx, cy - s*0.1, s*0.44);
    // Sharingan eyes (red with tomoe)
    g.fillStyle(0xcc0000, 1);
    g.fillCircle(cx - s*0.15, cy - s*0.15, s*0.11);
    g.fillCircle(cx + s*0.15, cy - s*0.15, s*0.11);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - s*0.15, cy - s*0.15, s*0.06);
    g.fillCircle(cx + s*0.15, cy - s*0.15, s*0.06);
    // Dark spiky hair
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx, cy - s*0.5, s*0.4);
    g.fillTriangle(cx + s*0.05, cy - s*0.55, cx - s*0.3, cy - s*0.42, cx + s*0.35, cy - s*0.42);
    // Chidori lightning effect
    g.lineStyle(1.5, 0xaaddff, 0.7);
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.6, cy - s*0.4, cx - s*0.45, cy - s*0.2));
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.45, cy - s*0.2, cx - s*0.62, cy));
    g.lineStyle(3, tc || 0x330066, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};

// ── VEGETA ────────────────────────────────────────────────────────────────────
HeroDraw.heroes.vegeta = {
  bodyColor: 0x4444ff,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.6, s*0.5);
    // White armor body
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(cx - s*0.72, cy + s, cx + s*0.72, cy + s, cx, cy + s*0.05);
    g.fillStyle(0xdddddd, 1);
    g.fillCircle(cx, cy, s*0.75);
    // Blue suit underneath
    g.fillStyle(0x3333cc, 1);
    g.fillRect(cx - s*0.2, cy + s*0.15, s*0.4, s*0.45);
    // Chest plate
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - s*0.35, cy - s*0.1, s*0.7, s*0.35);
    // Face
    g.fillStyle(0xffcc99, 1);
    g.fillCircle(cx, cy - s*0.1, s*0.43);
    // Stern eyes
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - s*0.14, cy - s*0.15, s*0.08);
    g.fillCircle(cx + s*0.14, cy - s*0.15, s*0.08);
    // Furrowed brow
    g.lineStyle(2, 0x443322, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.26, cy - s*0.28, cx - s*0.06, cy - s*0.22));
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.06, cy - s*0.22, cx + s*0.26, cy - s*0.28));
    // Pointy black hair (flame up)
    g.fillStyle(0x111111, 1);
    g.fillTriangle(cx, cy - s*0.95, cx - s*0.32, cy - s*0.5, cx + s*0.32, cy - s*0.5);
    g.fillTriangle(cx - s*0.15, cy - s*0.85, cx - s*0.42, cy - s*0.5, cx + s*0.1, cy - s*0.5);
    g.fillTriangle(cx + s*0.15, cy - s*0.85, cx - s*0.1, cy - s*0.5, cx + s*0.42, cy - s*0.5);
    g.lineStyle(3, tc || 0x4444ff, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};

// ── ZORO ──────────────────────────────────────────────────────────────────────
HeroDraw.heroes.zoro = {
  bodyColor: 0x006600,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.6, s*0.5);
    // Green haramaki body
    g.fillStyle(0x004400, 1);
    g.fillTriangle(cx - s*0.72, cy + s, cx + s*0.72, cy + s, cx, cy + s*0.05);
    g.fillStyle(0x006600, 1);
    g.fillCircle(cx, cy, s*0.75);
    // Open chest (bare)
    g.fillStyle(0xffcc99, 1);
    g.fillTriangle(cx - s*0.2, cy, cx + s*0.2, cy, cx, cy + s*0.55);
    // Green haramaki band
    g.fillStyle(0x228822, 1);
    g.fillRect(cx - s*0.4, cy + s*0.1, s*0.8, s*0.2);
    // Face
    g.fillStyle(0xffcc99, 1);
    g.fillCircle(cx, cy - s*0.1, s*0.44);
    // Scar over eye
    g.lineStyle(2, 0xaa6644, 0.9);
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.22, cy - s*0.28, cx - s*0.08, cy - s*0.02));
    // Eyes (one closed/scarred)
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + s*0.14, cy - s*0.15, s*0.09);
    g.lineStyle(2, 0x111111, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.22, cy - s*0.14, cx - s*0.06, cy - s*0.14));
    // Green hair
    g.fillStyle(0x00aa00, 1);
    g.fillCircle(cx, cy - s*0.5, s*0.36);
    g.fillRect(cx - s*0.32, cy - s*0.56, s*0.64, s*0.16);
    // Three swords
    g.lineStyle(3, 0x888888, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.55, cy - s*0.7, cx + s*0.65, cy + s*0.7));
    g.lineStyle(2, 0x666666, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.7, cy - s*0.6, cx + s*0.8, cy + s*0.75));
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.82, cy - s*0.5, cx + s*0.92, cy + s*0.75));
    g.lineStyle(3, tc || 0x006600, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};

// ── ERZA ──────────────────────────────────────────────────────────────────────
HeroDraw.heroes.erza = {
  bodyColor: 0xcc0000,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.6, s*0.5);
    // Armor body (red/silver)
    g.fillStyle(0x888888, 1);
    g.fillTriangle(cx - s*0.72, cy + s, cx + s*0.72, cy + s, cx, cy + s*0.05);
    g.fillStyle(0xcc0000, 1);
    g.fillCircle(cx, cy, s*0.75);
    // Silver chest plate
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(cx - s*0.38, cy - s*0.12, s*0.76, s*0.42);
    // Gold trim
    g.lineStyle(2, 0xffd700, 1);
    g.strokeRect(cx - s*0.38, cy - s*0.12, s*0.76, s*0.42);
    // Face
    g.fillStyle(0xffddcc, 1);
    g.fillCircle(cx, cy - s*0.1, s*0.44);
    // Confident eyes
    g.fillStyle(0x662200, 1);
    g.fillCircle(cx - s*0.14, cy - s*0.15, s*0.1);
    g.fillCircle(cx + s*0.14, cy - s*0.15, s*0.1);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - s*0.1, cy - s*0.18, s*0.04);
    g.fillCircle(cx + s*0.18, cy - s*0.18, s*0.04);
    // Long scarlet hair
    g.fillStyle(0xcc2222, 1);
    g.fillCircle(cx, cy - s*0.5, s*0.42);
    g.fillRect(cx - s*0.36, cy - s*0.52, s*0.72, s*0.18);
    g.fillRect(cx - s*0.38, cy - s*0.42, s*0.14, s*0.8);
    g.fillRect(cx + s*0.24, cy - s*0.42, s*0.14, s*0.8);
    // Sword
    g.lineStyle(3, 0xddddff, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.6, cy - s*0.8, cx + s*0.75, cy + s*0.65));
    g.fillStyle(0xffd700, 1);
    g.fillRect(cx + s*0.52, cy - s*0.12, s*0.2, s*0.06);
    g.lineStyle(3, tc || 0xcc0000, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};

// ── NEZUKO ────────────────────────────────────────────────────────────────────
HeroDraw.heroes.nezuko = {
  bodyColor: 0xff69b4,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.5, s*0.5);
    // Pink kimono
    g.fillStyle(0xff69b4, 1);
    g.fillTriangle(cx - s*0.7, cy + s, cx + s*0.7, cy + s, cx, cy + s*0.05);
    g.fillCircle(cx, cy, s*0.72);
    // Kimono pattern (dark pink stripes)
    g.lineStyle(2, 0xcc3377, 0.6);
    for (let i = -2; i <= 2; i++) {
      g.strokeLineShape(new Phaser.Geom.Line(cx + i*s*0.18, cy - s*0.1, cx + i*s*0.18 + s*0.05, cy + s*0.6));
    }
    // White collar
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(cx - s*0.18, cy + s*0.05, cx + s*0.18, cy + s*0.05, cx, cy + s*0.45);
    // Face
    g.fillStyle(0xffeedd, 1);
    g.fillCircle(cx, cy - s*0.1, s*0.44);
    // Bamboo muzzle (light wood color)
    g.fillStyle(0xddbb88, 1);
    g.fillRect(cx - s*0.24, cy + s*0.02, s*0.48, s*0.18);
    g.lineStyle(2, 0xaa8855, 1);
    g.strokeRect(cx - s*0.24, cy + s*0.02, s*0.48, s*0.18);
    // Bindings on muzzle
    g.lineStyle(2, 0x884422, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.1, cy + s*0.02, cx - s*0.1, cy + s*0.2));
    g.strokeLineShape(new Phaser.Geom.Line(cx + s*0.1, cy + s*0.02, cx + s*0.1, cy + s*0.2));
    // Big pink eyes
    g.fillStyle(0xff88cc, 1);
    g.fillCircle(cx - s*0.15, cy - s*0.18, s*0.11);
    g.fillCircle(cx + s*0.15, cy - s*0.18, s*0.11);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - s*0.11, cy - s*0.22, s*0.04);
    g.fillCircle(cx + s*0.19, cy - s*0.22, s*0.04);
    // Black hair with pink bow
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx, cy - s*0.5, s*0.4);
    g.fillRect(cx - s*0.36, cy - s*0.54, s*0.72, s*0.16);
    g.fillRect(cx - s*0.36, cy - s*0.44, s*0.14, s*0.55);
    g.fillRect(cx + s*0.22, cy - s*0.44, s*0.14, s*0.55);
    // Pink bow
    g.fillStyle(0xff69b4, 1);
    g.fillTriangle(cx - s*0.28, cy - s*0.62, cx, cy - s*0.5, cx - s*0.28, cy - s*0.38);
    g.fillTriangle(cx + s*0.28, cy - s*0.62, cx, cy - s*0.5, cx + s*0.28, cy - s*0.38);
    g.fillCircle(cx, cy - s*0.5, s*0.08);
    // Blood burst flames hint
    g.lineStyle(2, 0xff2244, 0.5);
    g.strokeCircle(cx, cy, s*1.06);
    g.lineStyle(3, tc || 0xff69b4, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};

// ── MELIODAS ──────────────────────────────────────────────────────────────────
HeroDraw.heroes.meliodas = {
  bodyColor: 0xff4400,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.5, s*0.5);
    // Black tavern outfit
    g.fillStyle(0x111111, 1);
    g.fillTriangle(cx - s*0.7, cy + s, cx + s*0.7, cy + s, cx, cy + s*0.05);
    g.fillCircle(cx, cy, s*0.72);
    // Dragon mark on chest
    g.fillStyle(0xff4400, 1);
    g.fillRect(cx - s*0.22, cy - s*0.05, s*0.44, s*0.32);
    // Dragon symbol (simplified)
    g.lineStyle(2, 0xff6600, 1);
    g.strokeCircle(cx, cy + s*0.12, s*0.12);
    g.strokeLineShape(new Phaser.Geom.Line(cx, cy + s*0.0, cx + s*0.15, cy - s*0.08));
    g.strokeLineShape(new Phaser.Geom.Line(cx, cy + s*0.0, cx - s*0.15, cy - s*0.08));
    // Face (young/small but fierce)
    g.fillStyle(0xffddbb, 1);
    g.fillCircle(cx, cy - s*0.1, s*0.42);
    // Green eyes (intense)
    g.fillStyle(0x00cc44, 1);
    g.fillCircle(cx - s*0.13, cy - s*0.16, s*0.1);
    g.fillCircle(cx + s*0.13, cy - s*0.16, s*0.1);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - s*0.13, cy - s*0.16, s*0.06);
    g.fillCircle(cx + s*0.13, cy - s*0.16, s*0.06);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - s*0.1, cy - s*0.19, s*0.03);
    g.fillCircle(cx + s*0.16, cy - s*0.19, s*0.03);
    // Smirk
    g.lineStyle(2, 0x441100, 1);
    g.beginPath(); g.arc(cx + s*0.04, cy + s*0.04, s*0.15, -0.2, Math.PI * 0.6); g.strokePath();
    // Blonde spiky hair
    g.fillStyle(0xffdd44, 1);
    g.fillCircle(cx, cy - s*0.5, s*0.38);
    g.fillRect(cx - s*0.34, cy - s*0.55, s*0.68, s*0.16);
    for (let i = -2; i <= 2; i++) {
      g.fillTriangle(cx + i*s*0.15, cy - s*0.7, cx + i*s*0.15 - s*0.09, cy - s*0.54, cx + i*s*0.15 + s*0.09, cy - s*0.54);
    }
    // Broken sword lostvayne
    g.lineStyle(3, 0x888888, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.55, cy - s*0.6, cx - s*0.45, cy + s*0.5));
    g.lineStyle(2, 0x666666, 1);
    g.strokeLineShape(new Phaser.Geom.Line(cx - s*0.38, cy - s*0.3, cx - s*0.62, cy - s*0.1));
    // Demon mark (dark aura)
    g.lineStyle(2, 0x330000, 0.6);
    g.strokeCircle(cx, cy, s*1.06);
    g.lineStyle(3, tc || 0xff4400, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};

// ── DEFAULT fallback ──────────────────────────────────────────────────────────
HeroDraw.heroes.default = {
  bodyColor: 0x888888,
  draw(g, cx, cy, s, tc) {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s*1.1, s*1.5, s*0.5);
    g.fillStyle(0x666688, 1);
    g.fillCircle(cx, cy, s*0.75);
    g.fillStyle(0xffddbb, 1);
    g.fillCircle(cx, cy - s*0.1, s*0.44);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - s*0.14, cy - s*0.15, s*0.09);
    g.fillCircle(cx + s*0.14, cy - s*0.15, s*0.09);
    g.lineStyle(3, tc || 0x888888, 1);
    g.strokeCircle(cx, cy, s*0.98);
  }
};
