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

    // Ground fill
    g.fillStyle(0x1a2a10, 1);
    g.fillRect(0, 0, W, H);

    // Grass tile pattern
    for (let tx = 0; tx < W; tx += TILE_SIZE) {
      for (let ty = 0; ty < H; ty += TILE_SIZE) {
        const shade = ((tx + ty) / TILE_SIZE) % 2 === 0 ? 0x1d2e12 : 0x1a2a10;
        g.fillStyle(shade, 1);
        g.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
      }
    }

    // Mid lane road
    g.fillStyle(0x3a3020, 0.7);
    g.fillRect(0, H * 0.48, W, 80);

    // Diagonal river
    g.lineStyle(40, 0x0033aa, 0.5);
    g.strokeLineShape(new Phaser.Geom.Line(0, H * 0.52, W, H * 0.48));

    // Team 1 base area (top-left)
    g.fillStyle(0x002244, 0.5);
    g.fillCircle(200, 200, 200);
    // Team 2 base area (bottom-right)
    g.fillStyle(0x440000, 0.5);
    g.fillCircle(W - 200, H - 200, 200);

    // Forest patches
    const forests = [
      [600, 400, 80], [1000, 800, 70], [1400, 600, 90],
      [800, 1400, 80], [1600, 1200, 70], [1200, 1600, 90]
    ];
    forests.forEach(([fx, fy, fr]) => {
      g.fillStyle(0x0d1a08, 0.8);
      g.fillCircle(fx, fy, fr);
      g.fillStyle(0x142208, 0.5);
      g.fillCircle(fx - 20, fy - 20, fr * 0.6);
    });

    // Grid lines
    g.lineStyle(1, 0x000000, 0.1);
    for (let x = 0; x <= W; x += TILE_SIZE) g.strokeLineShape(new Phaser.Geom.Line(x, 0, x, H));
    for (let y = 0; y <= H; y += TILE_SIZE) g.strokeLineShape(new Phaser.Geom.Line(0, y, W, y));

    // Map border
    g.lineStyle(6, 0x333333, 1);
    g.strokeRect(0, 0, W, H);
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
      const size = t.base ? 44 : 28;

      const g = this.add.graphics();
      g.fillStyle(color, 0.7);
      g.fillRect(t.x - size / 2, t.y - size / 2, size, size);
      g.lineStyle(3, 0xffffff, 0.4);
      g.strokeRect(t.x - size / 2, t.y - size / 2, size, size);

      if (t.base) {
        this.add.text(t.x, t.y - size / 2 - 12, t.team === 1 ? '🔵 NEXUS' : '🔴 NEXUS', {
          fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
      }

      // HP bar graphics (updated per state)
      const hpBg = this.add.graphics();
      hpBg.fillStyle(0x330000, 1);
      hpBg.fillRect(t.x - 20, t.y + size / 2 + 4, 40, 5);

      const hpFill = this.add.graphics();
      hpFill.fillStyle(t.team === 1 ? 0x4488ff : 0xff4444, 1);
      hpFill.fillRect(t.x - 20, t.y + size / 2 + 4, 40, 5);

      this._towerSprites[t.id] = { g, hpBg, hpFill, hpBarW: 40, x: t.x, y: t.y, size, team: t.team };
    });
  }

  _createPlayerSprite(playerData) {
    const isMe = playerData.id === this._myId;
    const color = HERO_COLORS[playerData.heroId] || 0x888888;
    const teamColor = TEAM_COLORS[playerData.team];
    const SIZE = 28; // hero draw radius

    const cont = this.add.container(playerData.x || 300, playerData.y || 400);

    // Shadow
    const shadow = this.add.ellipse(0, SIZE * 0.6, SIZE * 1.5, SIZE * 0.5, 0x000000, 0.35);

    // "Me" selection ring (animated)
    let glowRing = null;
    if (isMe) {
      glowRing = this.add.circle(0, 0, SIZE + 8, color, 0);
      glowRing.setStrokeStyle(2, 0xffd700, 0.8);
      this.tweens.add({ targets: glowRing, scaleX: 1.25, scaleY: 1.25, alpha: 0, duration: 900, yoyo: true, repeat: -1 });
    }

    // Detailed hero portrait via HeroDraw
    const heroGraphic = this.add.graphics();
    const drawer = HeroDraw.heroes[playerData.heroId] || HeroDraw.heroes.default;
    drawer.draw(heroGraphic, 0, 0, SIZE, teamColor);

    // Level badge (bottom-right of sprite)
    const levelBadge = this.add.circle(SIZE * 0.7, SIZE * 0.7, 9, 0x000000, 0.85);
    const levelText = this.add.text(SIZE * 0.7, SIZE * 0.7, '1', {
      fontSize: '10px', fontStyle: 'bold', fill: '#ffd700'
    }).setOrigin(0.5);

    // Name tag
    const nameTag = this.add.text(0, -(SIZE + 16), playerData.name + (playerData.isBot ? ' 🤖' : ''), {
      fontSize: '11px', fill: isMe ? '#ffd700' : '#ffffff',
      stroke: '#000000', strokeThickness: 3,
      backgroundColor: isMe ? '#00000088' : null,
      padding: isMe ? { x: 4, y: 2 } : null
    }).setOrigin(0.5);

    // HP bar background + fill
    const hpBg = this.add.rectangle(0, SIZE + 10, SIZE * 1.8, 6, 0x220000, 0.9).setOrigin(0.5);
    const hpFill = this.add.rectangle(-(SIZE * 0.9), SIZE + 10, SIZE * 1.8, 6,
      playerData.team === 1 ? 0x44aaff : 0xff4444).setOrigin(0, 0.5);

    const children = [shadow];
    if (glowRing) children.push(glowRing);
    children.push(heroGraphic, levelBadge, levelText, nameTag, hpBg, hpFill);
    cont.add(children);

    this._entityLayer.add(cont);

    this._playerSprites[playerData.id] = {
      container: cont,
      heroGraphic,
      nameTag,
      hpFill,
      hpBg,
      levelText,
      color,
      teamColor,
      size: SIZE
    };
  }

  _setupInput() {
    this.input.keyboard.on('keydown-Q', () => this._useSkill(0));
    this.input.keyboard.on('keydown-W', () => this._useSkill(1));
    this.input.keyboard.on('keydown-E', () => this._useSkill(2));
    this.input.keyboard.on('keydown-R', () => this._useSkill(3));
    this.input.keyboard.on('keydown-D', () => this._useSpell());
    this.input.keyboard.on('keydown-ESC', () => this._openMenu());

    // WASD camera pan (when not following a character)
    this._wasd = this.input.keyboard.addKeys('W,A,S,D');
  }

  _setupClickMove() {
    this.input.on('pointerdown', (pointer) => {
      if (pointer.button !== 2) return; // Right click
      const wx = pointer.worldX;
      const wy = pointer.worldY;
      network.emit('game:move', { roomId: this._initData.roomId, x: wx, y: wy });
      this._showMoveIndicator(wx, wy);
    });
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
  }

  _useSpell() {
    const ptr = this.input.activePointer;
    network.emit('game:spell', {
      roomId: this._initData.roomId,
      targetX: ptr.worldX,
      targetY: ptr.worldY
    });
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

        // HP bar update
        const pct = pData.hp / pData.maxHp;
        sp.hpFill.width = sp.size * 1.8 * pct;
        sp.hpFill.x = -(sp.size * 0.9);

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
      } else {
        const pct = tData.hp / tData.maxHp;
        ts.hpFill.clear();
        ts.hpFill.fillStyle(tData.team === 1 ? 0x4488ff : 0xff4444, 1);
        ts.hpFill.fillRect(ts.x - 20, ts.y + ts.size / 2 + 4, ts.hpBarW * pct, 5);
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
