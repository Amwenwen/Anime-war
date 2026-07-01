/**
 * BattleScene — Main game scene with RPG-style map, entities, effects
 */
class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
    this._initData = null;
    this._myId = null;
    this._room = null;
    this._playerSprites = {};
    this._minionSprites = {};
    this._towerSprites = {};
    this._projSprites = {};
    this._effectPool = [];
    this._lastState = null;
  }

  init(data) {
    this._initData = data.initData;
    this._myId = window._mySocketId;
    this._myTeam = this._getMyTeam();
  }

  _getMyTeam() {
    if (!this._initData) return 1;
    const me = this._initData.players.find(p => p.id === this._myId);
    return me ? me.team : 1;
  }

  create() {
    const map = this._initData.mapData;
    this._mapW = map.width;
    this._mapH = map.height;

    // Camera
    this.cameras.main.setBounds(0, 0, this._mapW, this._mapH);
    this.cameras.main.setZoom(1);

    // Input
    this._setupInput();

    // Draw map
    this._drawMap();

    // Init entity layers
    this._entityLayer = this.add.container(0, 0);
    this._fxLayer = this.add.container(0, 0);
    this._uiLayer = this.add.container(0, 0);

    // Draw towers & bases from init data
    this._drawTowerMarkers();

    // Spawn player sprites from init data
    this._initData.players.forEach(p => {
      this._createPlayerSprite(p);
    });

    // Camera follows our hero
    const mySprite = this._playerSprites[this._myId];
    if (mySprite) {
      this.cameras.main.startFollow(mySprite.container, true, CAM_LERP, CAM_LERP);
    }

    // Network
    this._setupNetwork();

    // Click-to-move
    this._setupClickMove();
  }

  _drawMap() {
    const g = this.add.graphics();
    const W = this._mapW, H = this._mapH;
    const cx = W / 2, cy = H / 2;

    // ── Base ground ─────────────────────────────────────────────────────────
    g.fillGradientStyle(0x1a3a1a, 0x1a3a1a, 0x0d2a0d, 0x0d2a0d, 1);
    g.fillRect(0, 0, W, H);

    // Grass tile checker
    for (let tx = 0; tx < W; tx += TILE_SIZE) {
      for (let ty = 0; ty < H; ty += TILE_SIZE) {
        const shade = ((tx / TILE_SIZE + ty / TILE_SIZE) % 2 === 0) ? 0x1e3e18 : 0x1a3a15;
        g.fillStyle(shade, 1);
        g.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
      }
    }

    // ── Stadium outer ring glow ──────────────────────────────────────────────
    g.fillStyle(0x0a1e0a, 0.5);
    g.fillRect(0, 0, W, H);

    // ── LANES — glowing purple/teal paths ───────────────────────────────────
    // Mid lane (diagonal top-left to bottom-right)
    g.fillStyle(0x7755aa, 0.18);
    const midPts = [
      { x: 0, y: 0 }, { x: 260, y: 0 }, { x: W - 220, y: H }, { x: 0, y: H }
    ];
    g.fillPoints(midPts, true);

    // Top lane (along top edge)
    g.fillStyle(0x44aacc, 0.14);
    const topPts = [
      { x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: 280 }, { x: 0, y: 280 }
    ];
    g.fillPoints(topPts, true);

    // Bot lane (along bottom edge)
    g.fillStyle(0x44aacc, 0.14);
    const botPts = [
      { x: 0, y: H - 280 }, { x: W, y: H - 280 }, { x: W, y: H }, { x: 0, y: H }
    ];
    g.fillPoints(botPts, true);

    // Lane floor — actual road tiles
    // Mid lane road strip
    g.fillStyle(0x3a2e5a, 0.55);
    for (let i = 0; i < 28; i++) {
      g.fillRect(i * TILE_SIZE * 3, i * TILE_SIZE * 3 / (W / H) - 20, TILE_SIZE * 3 - 4, TILE_SIZE * 3 - 4);
    }

    // ── CENTRAL ARENA ZONE ──────────────────────────────────────────────────
    // Outer glow ring
    for (let r = 380; r >= 280; r -= 20) {
      const alpha = (380 - r) / 100 * 0.12;
      g.fillStyle(0xcc88ff, alpha);
      g.fillCircle(cx, cy, r);
    }
    // Main arena floor
    g.fillStyle(0x2a1a44, 0.85);
    g.fillCircle(cx, cy, 280);
    // Inner lighter circle
    g.fillStyle(0x3a2255, 0.6);
    g.fillCircle(cx, cy, 200);
    // Center symbol rings
    g.lineStyle(4, 0xcc66ff, 0.5);
    g.strokeCircle(cx, cy, 280);
    g.lineStyle(2, 0xaa44dd, 0.3);
    g.strokeCircle(cx, cy, 200);
    g.lineStyle(3, 0xff88ff, 0.35);
    g.strokeCircle(cx, cy, 100);
    // Center glowing dot
    g.fillStyle(0xff88ff, 0.6);
    g.fillCircle(cx, cy, 18);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(cx, cy, 8);

    // ── TEAM 1 BASE ZONE (top-left) ─────────────────────────────────────────
    // Outer glow
    for (let r = 320; r >= 200; r -= 25) {
      const alpha = (320 - r) / 120 * 0.18;
      g.fillStyle(0x4488ff, alpha);
      g.fillCircle(200, 200, r);
    }
    g.fillStyle(0x001a44, 0.9);
    g.fillCircle(200, 200, 200);
    g.fillStyle(0x0033aa, 0.4);
    g.fillCircle(200, 200, 150);
    g.lineStyle(5, 0x4499ff, 0.8);
    g.strokeCircle(200, 200, 200);
    g.lineStyle(3, 0x88ccff, 0.5);
    g.strokeCircle(200, 200, 140);
    // Team 1 logo (star shape)
    g.fillStyle(0x4499ff, 0.5);
    for (let a = 0; a < 5; a++) {
      const ang = (a * 72 - 90) * Math.PI / 180;
      const ang2 = ((a + 0.5) * 72 - 90) * Math.PI / 180;
      g.fillTriangle(
        200 + Math.cos(ang) * 80, 200 + Math.sin(ang) * 80,
        200 + Math.cos(ang2) * 38, 200 + Math.sin(ang2) * 38,
        200, 200
      );
    }

    // ── TEAM 2 BASE ZONE (bottom-right) ─────────────────────────────────────
    for (let r = 320; r >= 200; r -= 25) {
      const alpha = (320 - r) / 120 * 0.18;
      g.fillStyle(0xff4444, alpha);
      g.fillCircle(W - 200, H - 200, r);
    }
    g.fillStyle(0x440000, 0.9);
    g.fillCircle(W - 200, H - 200, 200);
    g.fillStyle(0xaa0000, 0.4);
    g.fillCircle(W - 200, H - 200, 150);
    g.lineStyle(5, 0xff4444, 0.8);
    g.strokeCircle(W - 200, H - 200, 200);
    g.lineStyle(3, 0xff8888, 0.5);
    g.strokeCircle(W - 200, H - 200, 140);
    // Team 2 logo
    g.fillStyle(0xff4444, 0.5);
    for (let a = 0; a < 5; a++) {
      const ang = (a * 72 - 90) * Math.PI / 180;
      const ang2 = ((a + 0.5) * 72 - 90) * Math.PI / 180;
      g.fillTriangle(
        (W - 200) + Math.cos(ang) * 80, (H - 200) + Math.sin(ang) * 80,
        (W - 200) + Math.cos(ang2) * 38, (H - 200) + Math.sin(ang2) * 38,
        W - 200, H - 200
      );
    }

    // ── GOAL ZONES (Unite-style scoring circles) ─────────────────────────────
    const goalZones = [
      // Team 1 defends (Team 2 scores here)
      { x: 400,     y: 600,     team: 2 },
      { x: 600,     y: 400,     team: 2 },
      // Team 2 defends (Team 1 scores here)
      { x: W - 400, y: H - 600, team: 1 },
      { x: W - 600, y: H - 400, team: 1 },
    ];
    goalZones.forEach(({ x, y, team }) => {
      const col = team === 1 ? 0x4488ff : 0xff4444;
      g.fillStyle(col, 0.12);
      g.fillCircle(x, y, 90);
      g.lineStyle(3, col, 0.6);
      g.strokeCircle(x, y, 90);
      g.lineStyle(2, col, 0.3);
      g.strokeCircle(x, y, 60);
      g.fillStyle(col, 0.35);
      g.fillCircle(x, y, 14);
    });

    // ── BUSH / JUNGLE PATCHES ────────────────────────────────────────────────
    const bushes = [
      [720,  480,  55], [900,  300,  48], [500,  900,  52],
      [1680, 1920, 55], [1500, 2100, 48], [1900, 1500, 52],
      [1100, 850,  45], [850,  1100, 45], [1350, 1150, 50],
      [1050, 1250, 50],
    ];
    bushes.forEach(([bx, by, br]) => {
      g.fillStyle(0x0a1a08, 0.75);
      g.fillCircle(bx, by, br);
      // Bush highlight
      g.fillStyle(0x163010, 0.4);
      g.fillCircle(bx - br * 0.25, by - br * 0.25, br * 0.55);
      // Bush border
      g.lineStyle(2, 0x224418, 0.5);
      g.strokeCircle(bx, by, br);
    });

    // ── CONNECTING PATHS between zones ─────────────────────────────────────
    // Top lane path
    g.fillStyle(0x2e2240, 0.45);
    g.fillRect(80, 80, 120, 600);
    g.fillRect(80, 80, 600, 120);
    // Bottom lane path
    g.fillRect(W - 200, H - 680, 120, 600);
    g.fillRect(W - 680, H - 200, 600, 120);
    // Mid lane path (diagonal strip)
    g.fillStyle(0x2e2240, 0.35);
    for (let i = 0; i < 34; i++) {
      g.fillRect(i * 72 - 10, i * 72 - 10, 68, 68);
    }

    // ── LANE EDGE HIGHLIGHTS ─────────────────────────────────────────────────
    g.lineStyle(2, 0x5544aa, 0.3);
    g.strokeRect(80, 80, W - 160, H - 160);

    // ── AMBIENT PARTICLES (static sparkle dots) ──────────────────────────────
    const rng = (seed) => { let x = Math.sin(seed) * 10000; return x - Math.floor(x); };
    for (let i = 0; i < 120; i++) {
      const px = rng(i * 7.3) * W;
      const py = rng(i * 11.9) * H;
      const pr = rng(i * 3.7) * 2 + 0.5;
      const pa = rng(i * 5.1) * 0.4 + 0.1;
      g.fillStyle(0xaaaaff, pa);
      g.fillCircle(px, py, pr);
    }

    // ── STADIUM OUTER BORDER ─────────────────────────────────────────────────
    g.lineStyle(8, 0x221133, 1);
    g.strokeRect(0, 0, W, H);
    g.lineStyle(3, 0x5533aa, 0.5);
    g.strokeRect(40, 40, W - 80, H - 80);
  }

  _drawTowerMarkers() {
    const towers = [
      // Team 1
      { id: 't1_top_t1', team: 1, x: 400, y: 280, base: false },
      { id: 't1_mid_t1', team: 1, x: 400, y: 1200, base: false },
      { id: 't1_bot_t1', team: 1, x: 280, y: 400, base: false },
      { id: 't1_top_t2', team: 1, x: 700, y: 280, base: false },
      { id: 't1_mid_t2', team: 1, x: 700, y: 1200, base: false },
      { id: 't1_base',   team: 1, x: 200, y: 200, base: true  },
      // Team 2
      { id: 't2_top_t1', team: 2, x: 2000, y: 2120, base: false },
      { id: 't2_mid_t1', team: 2, x: 2000, y: 1200, base: false },
      { id: 't2_bot_t1', team: 2, x: 2120, y: 2000, base: false },
      { id: 't2_top_t2', team: 2, x: 1700, y: 2120, base: false },
      { id: 't2_mid_t2', team: 2, x: 1700, y: 1200, base: false },
      { id: 't2_base',   team: 2, x: 2200, y: 2200, base: true },
    ];

    towers.forEach(t => {
      const color = TEAM_COLORS[t.team];
      const hexColor = t.team === 1 ? '#4499ff' : '#ff4444';
      const size = t.base ? 52 : 32;
      const g = this.add.graphics();

      if (t.base) {
        // Glowing base nexus — concentric rings
        for (let r = size + 28; r >= size; r -= 7) {
          const alpha = (size + 28 - r) / 28 * 0.3;
          g.fillStyle(color, alpha);
          g.fillCircle(t.x, t.y, r);
        }
        g.fillStyle(t.team === 1 ? 0x001a44 : 0x330000, 0.9);
        g.fillCircle(t.x, t.y, size);
        g.lineStyle(4, color, 0.95);
        g.strokeCircle(t.x, t.y, size);
        g.lineStyle(2, 0xffffff, 0.4);
        g.strokeCircle(t.x, t.y, size - 10);
        // Inner glow
        g.fillStyle(color, 0.4);
        g.fillCircle(t.x, t.y, size - 16);
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(t.x, t.y, 8);

        this.add.text(t.x, t.y - size - 16, t.team === 1 ? '🔵 NEXUS' : '🔴 NEXUS', {
          fontSize: '13px', fontStyle: 'bold', fill: '#ffffff',
          stroke: '#000000', strokeThickness: 4,
          shadow: { offsetX: 0, offsetY: 2, color: hexColor, blur: 8, fill: true }
        }).setOrigin(0.5);

      } else {
        // Turret — octagonal tower design
        const s = size;
        // Outer glow
        g.fillStyle(color, 0.2);
        g.fillCircle(t.x, t.y, s + 10);
        // Octagon body
        g.fillStyle(t.team === 1 ? 0x112244 : 0x330011, 1);
        const pts = [];
        for (let a = 0; a < 8; a++) {
          const angle = (a * 45 - 22.5) * Math.PI / 180;
          pts.push({ x: t.x + Math.cos(angle) * s, y: t.y + Math.sin(angle) * s });
        }
        g.fillPoints(pts, true);
        g.lineStyle(3, color, 0.9);
        g.strokePoints(pts, true);
        // Inner detail
        g.fillStyle(color, 0.4);
        g.fillCircle(t.x, t.y, s * 0.55);
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(t.x, t.y, s * 0.22);
        // Cannon barrel
        g.lineStyle(4, color, 0.8);
        g.strokeLineShape(new Phaser.Geom.Line(t.x, t.y, t.x + (t.team === 1 ? s + 8 : -(s + 8)), t.y));
      }

      // HP bar (wider, cleaner)
      const hpBarW = t.base ? 80 : 52;
      const hpBarY = t.y + size + 8;

      const hpBg = this.add.graphics();
      hpBg.fillStyle(0x1a1a1a, 0.9);
      hpBg.fillRoundedRect(t.x - hpBarW / 2, hpBarY, hpBarW, 7, 3);

      const hpFill = this.add.graphics();
      hpFill.fillStyle(t.team === 1 ? 0x44aaff : 0xff5555, 1);
      hpFill.fillRoundedRect(t.x - hpBarW / 2, hpBarY, hpBarW, 7, 3);

      this._towerSprites[t.id] = { g, hpBg, hpFill, hpBarW, x: t.x, y: t.y, size, team: t.team };
    });
  }

  _createPlayerSprite(playerData) {
    const isMe = playerData.id === this._myId;
    const color = HERO_COLORS[playerData.heroId] || 0x888888;
    const teamColor = TEAM_COLORS[playerData.team];
    const hexTeam = playerData.team === 1 ? '#4499ff' : '#ff5555';
    const SIZE = 32; // slightly bigger

    const cont = this.add.container(playerData.x || 300, playerData.y || 400);

    // Shadow ellipse under character
    const shadow = this.add.ellipse(0, SIZE * 0.75, SIZE * 1.8, SIZE * 0.55, 0x000000, 0.4);

    // Selection / team glow ring (always visible)
    const teamRing = this.add.circle(0, 0, SIZE + 6, teamColor, 0);
    teamRing.setStrokeStyle(isMe ? 3 : 2, teamColor, isMe ? 1 : 0.65);

    // "Me" pulse ring
    let pulseRing = null;
    if (isMe) {
      pulseRing = this.add.circle(0, 0, SIZE + 14, 0xffd700, 0);
      pulseRing.setStrokeStyle(2, 0xffd700, 0.9);
      this.tweens.add({ targets: pulseRing, scaleX: 1.35, scaleY: 1.35, alpha: 0, duration: 1100, yoyo: true, repeat: -1 });
    }

    // Hero portrait
    const heroGraphic = this.add.graphics();
    const drawer = HeroDraw.heroes[playerData.heroId] || HeroDraw.heroes.default;
    drawer.draw(heroGraphic, 0, 0, SIZE, teamColor);

    // Level badge
    const levelBadge = this.add.graphics();
    levelBadge.fillStyle(0x000000, 0.85);
    levelBadge.fillRoundedRect(SIZE * 0.55, SIZE * 0.55, 20, 16, 4);
    levelBadge.lineStyle(1.5, 0xffd700, 0.8);
    levelBadge.strokeRoundedRect(SIZE * 0.55, SIZE * 0.55, 20, 16, 4);
    const levelText = this.add.text(SIZE * 0.55 + 10, SIZE * 0.55 + 8, '1', {
      fontSize: '10px', fontStyle: 'bold', fill: '#ffd700'
    }).setOrigin(0.5);

    // ── HP bar (above head, Unite style) ──────────────────────────────────
    const hpBarW = SIZE * 2.2;
    const hpBarH = 7;
    const hpBarY = -(SIZE + 30);

    const hpBg = this.add.graphics();
    hpBg.fillStyle(0x111111, 0.9);
    hpBg.fillRoundedRect(-hpBarW / 2, hpBarY, hpBarW, hpBarH, 3);

    const hpFill = this.add.graphics();
    hpFill.fillStyle(playerData.team === 1 ? 0x44ddaa : 0xff5566, 1);
    hpFill.fillRoundedRect(-hpBarW / 2, hpBarY, hpBarW, hpBarH, 3);

    // HP bar outline
    const hpBorder = this.add.graphics();
    hpBorder.lineStyle(1.5, 0x000000, 0.7);
    hpBorder.strokeRoundedRect(-hpBarW / 2, hpBarY, hpBarW, hpBarH, 3);

    // ── Name tag (Unite style: team-colored pill) ──────────────────────────
    const nameTagY = -(SIZE + 44);
    const nameStr = playerData.name + (playerData.isBot ? ' 🤖' : '');
    const nameBg = this.add.graphics();
    const nameTextObj = this.add.text(0, nameTagY, nameStr, {
      fontSize: isMe ? '13px' : '12px',
      fontStyle: isMe ? 'bold' : 'normal',
      fill: isMe ? '#ffd700' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Pill background behind name
    const nw = nameTextObj.width + 14, nh = 18;
    nameBg.fillStyle(isMe ? 0x332200 : (playerData.team === 1 ? 0x001133 : 0x220011), 0.85);
    nameBg.fillRoundedRect(-nw / 2, nameTagY - 9, nw, nh, 5);
    nameBg.lineStyle(1.5, isMe ? 0xffd700 : teamColor, 0.7);
    nameBg.strokeRoundedRect(-nw / 2, nameTagY - 9, nw, nh, 5);

    const children = [shadow, teamRing];
    if (pulseRing) children.push(pulseRing);
    children.push(heroGraphic, levelBadge, levelText, hpBg, hpFill, hpBorder, nameBg, nameTextObj);
    cont.add(children);

    this._entityLayer.add(cont);

    this._playerSprites[playerData.id] = {
      container: cont,
      heroGraphic,
      nameTag: nameTextObj,
      nameBg,
      hpFill,
      hpBg,
      hpBorder,
      levelText,
      levelBadge,
      color,
      teamColor,
      size: SIZE,
      hpBarW,
      hpBarY
    };
  }

  _setupInput() {
    // ── Skills: 1 2 3 4 aimed at cursor ─────────────────────────────────────
    this.input.keyboard.on('keydown-ONE',   () => this._useSkill(0));
    this.input.keyboard.on('keydown-TWO',   () => this._useSkill(1));
    this.input.keyboard.on('keydown-THREE', () => this._useSkill(2));
    this.input.keyboard.on('keydown-FOUR',  () => this._useSkill(3));
    // Battle spell: F (or D as fallback)
    this.input.keyboard.on('keydown-F', () => this._useSpell());
    this.input.keyboard.on('keydown-D', () => this._useSpell());
    // Pause
    this.input.keyboard.on('keydown-ESC', () => this._openMenu());

    // ── WASD movement keys ───────────────────────────────────────────────────
    this._keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Send movement to server at ~20Hz when a key is held
    this._moveTimer = 0;
    this._moveSendInterval = 50; // ms between network sends
  }

  // Called every frame by Phaser (add update() to scene lifecycle)
  update(time, delta) {
    this._handleWASD(delta);
    this._updateCrosshair();
  }

  _handleWASD(delta) {
    const keys = this._keys;
    if (!keys) return;

    const up    = keys.up.isDown;
    const down  = keys.down.isDown;
    const left  = keys.left.isDown;
    const right = keys.right.isDown;

    if (!up && !down && !left && !right) return;

    // Accumulate time; only send every _moveSendInterval ms
    this._moveTimer = (this._moveTimer || 0) + delta;
    if (this._moveTimer < this._moveSendInterval) return;
    this._moveTimer = 0;

    // Get my current world position from last state
    const mySprite = this._playerSprites[this._myId];
    if (!mySprite || !mySprite.container) return;

    const STEP = 160; // pixels per send — server moves hero toward this point
    let dx = 0, dy = 0;
    if (up)    dy -= 1;
    if (down)  dy += 1;
    if (left)  dx -= 1;
    if (right) dx += 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.sqrt(2);
      dx *= inv; dy *= inv;
    }

    const cx = mySprite.container.x + dx * STEP;
    const cy = mySprite.container.y + dy * STEP;

    network.emit('game:move', {
      roomId: this._initData.roomId,
      x: Math.max(0, Math.min(this._mapW, cx)),
      y: Math.max(0, Math.min(this._mapH, cy))
    });
  }

  _setupClickMove() {
    // Right-click still works as fallback move
    this.input.on('pointerdown', (pointer) => {
      if (pointer.button !== 2) return;
      const wx = pointer.worldX;
      const wy = pointer.worldY;
      network.emit('game:move', { roomId: this._initData.roomId, x: wx, y: wy });
      this._showMoveIndicator(wx, wy);
    });

    // ── Crosshair cursor ────────────────────────────────────────────────────
    this._crosshair = this.add.container(0, 0);
    this._crosshair.setDepth(100);

    const cg = this.add.graphics();
    // Outer ring
    cg.lineStyle(2, 0xffffff, 0.85);
    cg.strokeCircle(0, 0, 12);
    // Inner dot
    cg.fillStyle(0xffffff, 0.9);
    cg.fillCircle(0, 0, 2.5);
    // Cross lines
    cg.lineStyle(1.5, 0xffffff, 0.75);
    cg.strokeLineShape(new Phaser.Geom.Line(-18, 0, -14, 0));
    cg.strokeLineShape(new Phaser.Geom.Line( 14, 0,  18, 0));
    cg.strokeLineShape(new Phaser.Geom.Line(0, -18, 0, -14));
    cg.strokeLineShape(new Phaser.Geom.Line(0,  14, 0,  18));
    this._crosshair.add(cg);
    this._crosshairGraphic = cg;

    // Hide default cursor while in game
    this.input.setDefaultCursor('none');
  }

  _updateCrosshair() {
    if (!this._crosshair) return;
    const ptr = this.input.activePointer;
    const wx = ptr.worldX;
    const wy = ptr.worldY;
    this._crosshair.setPosition(wx, wy);

    // Pulse crosshair color based on nearest enemy (red = enemy nearby)
    if (this._lastState) {
      let nearEnemy = false;
      for (const p of Object.values(this._lastState.players)) {
        if (!p.alive || p.team === this._myTeam) continue;
        const dx = p.x - wx, dy = p.y - wy;
        if (Math.sqrt(dx*dx + dy*dy) < 80) { nearEnemy = true; break; }
      }
      if (nearEnemy !== this._crosshairOnEnemy) {
        this._crosshairOnEnemy = nearEnemy;
        this._crosshairGraphic.clear();
        const col = nearEnemy ? 0xff4444 : 0xffffff;
        const alpha = nearEnemy ? 1.0 : 0.85;
        this._crosshairGraphic.lineStyle(2, col, alpha);
        this._crosshairGraphic.strokeCircle(0, 0, nearEnemy ? 14 : 12);
        this._crosshairGraphic.fillStyle(col, alpha);
        this._crosshairGraphic.fillCircle(0, 0, 2.5);
        this._crosshairGraphic.lineStyle(1.5, col, 0.75);
        this._crosshairGraphic.strokeLineShape(new Phaser.Geom.Line(-18, 0, -14, 0));
        this._crosshairGraphic.strokeLineShape(new Phaser.Geom.Line( 14, 0,  18, 0));
        this._crosshairGraphic.strokeLineShape(new Phaser.Geom.Line(0, -18, 0, -14));
        this._crosshairGraphic.strokeLineShape(new Phaser.Geom.Line(0,  14, 0,  18));
      }
    }
  }

  _showMoveIndicator(x, y) {
    const circ = this.add.circle(x, y, 14, 0xffffff, 0.8);
    this.tweens.add({ targets: circ, scaleX: 2, scaleY: 2, alpha: 0, duration: 500,
      onComplete: () => circ.destroy() });
  }

  _useSkill(index) {
    const ptr = this.input.activePointer;
    network.emit('game:skill', {
      roomId: this._initData.roomId,
      skillIndex: index,
      targetX: ptr.worldX,
      targetY: ptr.worldY
    });
    // Visual flash on crosshair
    if (this._crosshairGraphic) {
      this.tweens.add({ targets: this._crosshair, scaleX: 1.4, scaleY: 1.4, duration: 80, yoyo: true });
    }
  }

  _useSpell() {
    const ptr = this.input.activePointer;
    network.emit('game:spell', {
      roomId: this._initData.roomId,
      targetX: ptr.worldX,
      targetY: ptr.worldY
    });
    if (this._crosshairGraphic) {
      this.tweens.add({ targets: this._crosshair, scaleX: 1.6, scaleY: 1.6, duration: 100, yoyo: true });
    }
  }

  _openMenu() {
    // Pause/settings (simple)
    const W = this.scale.width, H = this.scale.height;
    if (this._menuOpen) return;
    this._menuOpen = true;
    const cam = this.cameras.main;
    const cx = cam.scrollX + W / 2;
    const cy = cam.scrollY + H / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(cam.scrollX, cam.scrollY, W, H);

    const title = this.add.text(cx, cy - 80, 'PAUSED', {
      fontSize: '32px', fontStyle: 'bold', fill: '#ffd700'
    }).setOrigin(0.5);

    const resumeBtn = this.add.text(cx, cy, '▶ Resume', {
      fontSize: '22px', fill: '#fff', backgroundColor: '#226622',
      padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerdown', () => {
      overlay.destroy(); title.destroy(); resumeBtn.destroy(); this._menuOpen = false;
    });
  }

  _setupNetwork() {
    network.on('game:state', (state) => {
      this._applyState(state);
    });

    network.on('game:skillEffect', (data) => {
      this._playEffect(data.fx, data);
    });

    network.on('game:spellEffect', (data) => {
      this._playEffect(data.fx, data);
    });

    network.on('game:attackResult', (data) => {
      this._showDamageNumber(data.targetId, data.damage);
    });

    network.on('game:state', (state) => {
      if (state.events) {
        state.events.forEach(ev => {
          if (ev.type === 'kill') this._showKillFeed(ev);
          if (ev.type === 'damage') this._showDamageNumber(ev.target, ev.amount);
          if (ev.type === 'respawn') this._showRespawn(ev.playerId);
          if (ev.type === 'gameOver') this._handleGameOver(state.winner);
        });
      }
    });
  }

  _applyState(state) {
    this._lastState = state;

    // Update players
    for (const [id, pData] of Object.entries(state.players)) {
      if (!this._playerSprites[id]) {
        this._createPlayerSprite({ ...pData, id });
      }
      const sp = this._playerSprites[id];
      if (!sp) continue;

      const cont = sp.container;
      cont.setVisible(pData.alive);

      if (pData.alive) {
        cont.x = pData.x;
        cont.y = pData.y;

        // HP bar update (graphics-based, above head)
        const pct = pData.hp / pData.maxHp;
        const bw = sp.hpBarW || (sp.size * 2.2);
        const by = sp.hpBarY || -(sp.size + 30);
        sp.hpFill.clear();
        const hpColor = pct > 0.5 ? (pData.team === 1 ? 0x44ddaa : 0xff5566) :
                        pct > 0.25 ? 0xffaa00 : 0xff2200;
        sp.hpFill.fillStyle(hpColor, 1);
        sp.hpFill.fillRoundedRect(-bw / 2, by, bw * pct, 7, 3);

        // Level badge
        if (sp.levelText) sp.levelText.setText(pData.level || 1);
      }
    }

    // Update minions
    for (const [id, mData] of Object.entries(state.minions)) {
      if (!this._minionSprites[id]) {
        const g = this.add.circle(mData.x, mData.y, 8,
          mData.team === 1 ? 0x8888ff : 0xff8888, 0.9);
        const hpBar = this.add.rectangle(mData.x, mData.y + 12, 16, 4,
          mData.team === 1 ? 0x4488ff : 0xff4444).setOrigin(0.5);
        this._minionSprites[id] = { g, hpBar };
        this._entityLayer.add([g, hpBar]);
      }
      const ms = this._minionSprites[id];
      if (mData.alive) {
        ms.g.setPosition(mData.x, mData.y);
        ms.hpBar.setPosition(mData.x, mData.y + 12);
        ms.hpBar.width = 16 * (mData.hp / mData.maxHp);
      } else {
        ms.g.destroy(); ms.hpBar.destroy();
        delete this._minionSprites[id];
      }
    }

    // Remove dead minion sprites
    for (const id of Object.keys(this._minionSprites)) {
      if (!state.minions[id]) {
        this._minionSprites[id].g.destroy();
        this._minionSprites[id].hpBar.destroy();
        delete this._minionSprites[id];
      }
    }

    // Update towers
    for (const [id, tData] of Object.entries(state.towers)) {
      const ts = this._towerSprites[id];
      if (!ts) continue;
      if (!tData.alive) {
        ts.g.clear();
        ts.hpFill.clear();
        ts.hpBg.clear();
      } else {
        const pct = tData.hp / tData.maxHp;
        const hpBarY = ts.y + ts.size + 8;
        ts.hpFill.clear();
        ts.hpFill.fillStyle(tData.team === 1 ? 0x44aaff : 0xff5555, 1);
        ts.hpFill.fillRoundedRect(ts.x - ts.hpBarW / 2, hpBarY, ts.hpBarW * pct, 7, 3);
      }
    }

    // Projectiles
    for (const id of Object.keys(this._projSprites)) {
      if (!state.projectiles[id]) {
        this._projSprites[id].destroy();
        delete this._projSprites[id];
      }
    }
    for (const [id, pr] of Object.entries(state.projectiles)) {
      if (!this._projSprites[id]) {
        const dot = this.add.circle(pr.x, pr.y, 6, pr.team === 1 ? 0xaaffff : 0xffaaaa, 1);
        this._projSprites[id] = dot;
        this._fxLayer.add(dot);
      }
      this._projSprites[id].setPosition(pr.x, pr.y);
    }

    // Emit HUD update
    this.events.emit('hud:update', state);
  }

  _playEffect(fx, data) {
    if (!fx) return;
    const x = data.x || (data.ox || 0);
    const y = data.y || (data.oy || 0);

    // Generic burst effect
    const circle = this.add.circle(x, y, 20, 0xffffff, 0.8);
    this._fxLayer.add(circle);
    this.tweens.add({
      targets: circle,
      scaleX: 3, scaleY: 3, alpha: 0, duration: 400,
      onComplete: () => circle.destroy()
    });

    // AoE radius indicator
    if (data.radius) {
      const ring = this.add.circle(x, y, data.radius, 0xffffff, 0);
      ring.setStrokeStyle(2, 0xffd700, 0.6);
      this._fxLayer.add(ring);
      this.tweens.add({
        targets: ring, scaleX: 1.2, scaleY: 1.2, alpha: 0, duration: 600,
        onComplete: () => ring.destroy()
      });
    }

    // Projectile trail for linear skills
    if (data.ox !== undefined && data.tx !== undefined) {
      const line = this.add.graphics();
      line.lineStyle(3, 0xffffff, 0.5);
      line.strokeLineShape(new Phaser.Geom.Line(data.ox, data.oy, data.tx, data.ty));
      this._fxLayer.add(line);
      this.tweens.add({ targets: line, alpha: 0, duration: 300, onComplete: () => line.destroy() });
    }
  }

  _showDamageNumber(targetId, amount) {
    const sp = this._playerSprites[targetId] || this._minionSprites[targetId];
    if (!sp) return;
    const cont = sp.container || sp.g;
    const x = cont ? cont.x : 0;
    const y = cont ? cont.y - 30 : 0;

    const dmgText = this.add.text(x, y, `-${Math.round(amount)}`, {
      fontSize: '16px', fontStyle: 'bold', fill: '#ff4444',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    this._fxLayer.add(dmgText);
    this.tweens.add({
      targets: dmgText, y: y - 50, alpha: 0, duration: 900,
      onComplete: () => dmgText.destroy()
    });
  }

  _showKillFeed(ev) {
    this.events.emit('hud:kill', ev);
  }

  _showRespawn(playerId) {
    const sp = this._playerSprites[playerId];
    if (!sp) return;
    const text = this.add.text(sp.container.x, sp.container.y - 50, 'RESPAWN!', {
      fontSize: '14px', fill: '#00ff88', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    this._fxLayer.add(text);
    this.tweens.add({ targets: text, y: text.y - 40, alpha: 0, duration: 1200,
      onComplete: () => text.destroy() });
  }

  _handleGameOver(winner) {
    const myTeam = this._myTeam;
    const won = myTeam === winner;
    this.scene.start('ResultScene', { winner, won });
    this.scene.stop('HUDScene');
  }

  shutdown() {
    network.offAll('game:state');
    network.offAll('game:skillEffect');
    network.offAll('game:spellEffect');
    network.offAll('game:attackResult');
  }
}
