/**
 * HUDScene — Overlay HUD: HP bar, skill bar, minimap, kill feed, timer
 * Runs in parallel with BattleScene
 */
class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene', active: false });
    this._initData = null;
    this._state = null;
    this._killFeed = [];
  }

  init(data) {
    this._initData = data.initData;
    this._myId = window._mySocketId;
    this._myHero = this._initData.players.find(p => p.id === this._myId) || this._initData.players[0];
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this._W = W; this._H = H;

    this._drawSkillBar();
    this._drawMinimap();
    this._drawKillFeedArea();
    this._drawGameTimer();
    this._drawScoreboard();
    this._drawRespawnOverlay();

    // Listen to BattleScene events
    const battleScene = this.scene.get('BattleScene');
    battleScene.events.on('hud:update', this._onStateUpdate, this);
    battleScene.events.on('hud:kill', this._onKill, this);

    // Update every 100ms
    this.time.addEvent({ delay: 100, loop: true, callback: this._updateHUD, callbackScope: this });
  }

  _drawSkillBar() {
    const W = this._W, H = this._H;
    const barX = W / 2 - 200;
    const barY = H - 100;

    // Background panel
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.7);
    g.fillRoundedRect(barX - 10, barY - 10, 420, 90, 12);
    g.lineStyle(1, 0xff8c00, 0.4);
    g.strokeRoundedRect(barX - 10, barY - 10, 420, 90, 12);

    // HP bar
    this._hpBg = this.add.rectangle(barX, barY - 22, 400, 10, 0x440000).setOrigin(0, 0.5);
    this._hpFill = this.add.rectangle(barX, barY - 22, 400, 10, 0x44dd44).setOrigin(0, 0.5);
    this._hpText = this.add.text(barX + 200, barY - 22, 'HP', {
      fontSize: '10px', fill: '#ffffff'
    }).setOrigin(0.5);

    // Skill slots: Q W E R D (spell)
    const keys = ['Q', 'W', 'E', 'R', 'D'];
    const colors = [0x2244aa, 0x2244aa, 0x2244aa, 0xaa4400, 0x224422];
    const labels = ['Skill 1', 'Skill 2', 'Skill 3', 'Ultimate', 'Spell'];

    this._skillSlots = [];
    keys.forEach((k, i) => {
      const sx = barX + i * 82;
      const sy = barY;

      const slotBg = this.add.graphics();
      slotBg.fillStyle(colors[i], 0.9);
      slotBg.fillRoundedRect(sx, sy, 76, 62, 8);
      slotBg.lineStyle(2, 0x888888, 0.7);
      slotBg.strokeRoundedRect(sx, sy, 76, 62, 8);

      const keyLabel = this.add.text(sx + 5, sy + 5, k, {
        fontSize: '11px', fontStyle: 'bold', fill: '#ffdd88'
      });

      const skillName = this.add.text(sx + 38, sy + 38, labels[i], {
        fontSize: '8px', fill: '#aaaaaa'
      }).setOrigin(0.5);

      // Cooldown overlay
      const cdOverlay = this.add.graphics();
      const cdText = this.add.text(sx + 38, sy + 20, '', {
        fontSize: '18px', fontStyle: 'bold', fill: '#ffffff',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5);

      this._skillSlots.push({ slotBg, cdOverlay, cdText, sx, sy, w: 76, h: 62 });
    });

    // Gold display
    this._goldText = this.add.text(barX + 410, barY + 10, '💰 0', {
      fontSize: '14px', fontStyle: 'bold', fill: '#ffd700'
    });

    // Level display
    this._levelText = this.add.text(barX + 410, barY + 34, 'Lv.1', {
      fontSize: '13px', fill: '#aaaaaa'
    });
  }

  _drawMinimap() {
    const W = this._W, H = this._H;
    const mmW = 160, mmH = 160;
    const mmX = W - mmW - 10, mmY = H - mmH - 10;

    // BG
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.8);
    g.fillRect(mmX, mmY, mmW, mmH);
    g.lineStyle(2, 0xff8c00, 0.6);
    g.strokeRect(mmX, mmY, mmW, mmH);

    // Label
    this.add.text(mmX + mmW / 2, mmY - 14, 'MINIMAP', {
      fontSize: '10px', fill: '#888888'
    }).setOrigin(0.5);

    // Minimap static terrain
    const mg = this.add.graphics();
    // River
    mg.lineStyle(4, 0x0033aa, 0.4);
    mg.strokeLineShape(new Phaser.Geom.Line(mmX, mmY + mmH * 0.52, mmX + mmW, mmY + mmH * 0.48));
    // Bases
    mg.fillStyle(0x4488ff, 0.5); mg.fillCircle(mmX + 8, mmY + 8, 8);
    mg.fillStyle(0xff4444, 0.5); mg.fillCircle(mmX + mmW - 8, mmY + mmH - 8, 8);

    this._mmX = mmX; this._mmY = mmY; this._mmW = mmW; this._mmH = mmH;
    this._mmDots = {};
    this._mmContainer = this.add.container(0, 0);
  }

  _drawKillFeedArea() {
    this._killFeedTexts = [];
    this._killFeedX = 10;
    this._killFeedY = 10;
  }

  _drawGameTimer() {
    this._timerText = this.add.text(this._W / 2, 14, '00:00', {
      fontSize: '22px', fontStyle: 'bold', fill: '#ffd700',
      stroke: '#000000', strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5);
  }

  _drawScoreboard() {
    // Compact score display top-right
    this._scoreText = this.add.text(this._W - 10, 14, 'KDA', {
      fontSize: '12px', fill: '#aaaaaa'
    }).setOrigin(1, 0);
  }

  _drawRespawnOverlay() {
    this._respawnOverlay = this.add.text(this._W / 2, this._H / 2, '', {
      fontSize: '28px', fontStyle: 'bold', fill: '#ff4444',
      stroke: '#000000', strokeThickness: 5,
      backgroundColor: '#00000088', padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setDepth(10);
  }

  _onStateUpdate(state) {
    this._state = state;
  }

  _onKill(ev) {
    const msg = `${ev.killer} eliminated ${ev.victim}`;
    this._addKillFeed(msg, '#ff8888');
  }

  _addKillFeed(msg, color) {
    const t = this.add.text(this._killFeedX, this._killFeedY + this._killFeedTexts.length * 22, msg, {
      fontSize: '12px', fill: color, stroke: '#000', strokeThickness: 3,
      backgroundColor: '#00000066', padding: { x: 6, y: 3 }
    });
    this._killFeedTexts.push(t);
    if (this._killFeedTexts.length > 6) {
      const old = this._killFeedTexts.shift();
      old.destroy();
      this._killFeedTexts.forEach((tx, i) => tx.setY(this._killFeedY + i * 22));
    }
    this.time.addEvent({ delay: 5000, callback: () => {
      const idx = this._killFeedTexts.indexOf(t);
      if (idx >= 0) {
        this._killFeedTexts.splice(idx, 1);
        t.destroy();
        this._killFeedTexts.forEach((tx, i) => tx.setY(this._killFeedY + i * 22));
      }
    }});
  }

  _updateHUD() {
    const state = this._state;
    if (!state) return;

    // Timer
    const mins = Math.floor(state.gameTime / 60);
    const secs = Math.floor(state.gameTime % 60);
    this._timerText.setText(`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);

    const me = state.players[this._myId];
    if (!me) return;

    // HP bar
    const pct = me.hp / me.maxHp;
    this._hpFill.width = 400 * pct;
    this._hpFill.setFillColor(pct > 0.5 ? 0x44dd44 : pct > 0.25 ? 0xffaa00 : 0xff2200);
    this._hpText.setText(`${Math.round(me.hp)} / ${me.maxHp}`);

    // Skill cooldowns
    const cds = me.skillCooldowns || [0, 0, 0, 0];
    const spellCd = me.spellCooldown || 0;
    const allCds = [...cds, spellCd];

    allCds.forEach((cd, i) => {
      if (!this._skillSlots[i]) return;
      const slot = this._skillSlots[i];
      slot.cdOverlay.clear();
      if (cd > 0) {
        slot.cdOverlay.fillStyle(0x000000, 0.65);
        slot.cdOverlay.fillRoundedRect(slot.sx, slot.sy, slot.w, slot.h, 8);
        slot.cdText.setText(cd.toFixed(1));
      } else {
        slot.cdText.setText('');
      }
    });

    // Gold & Level
    this._goldText.setText(`💰 ${me.gold}`);
    this._levelText.setText(`Lv.${me.level}`);

    // KDA
    this._scoreText.setText(`${me.kills} / ${me.deaths} / ${me.assists}`);

    // Respawn overlay
    if (!me.alive && me.respawnTimer > 0) {
      this._respawnOverlay.setText(`Respawning in ${me.respawnTimer.toFixed(1)}s`);
    } else {
      this._respawnOverlay.setText('');
    }

    // Minimap dots
    this._mmContainer.removeAll(true);
    for (const [id, p] of Object.entries(state.players)) {
      if (!p.alive) continue;
      const mx = this._mmX + (p.x / MAP_W) * this._mmW;
      const my = this._mmY + (p.y / MAP_H) * this._mmH;
      const dot = this.add.circle(mx, my, id === this._myId ? 5 : 3,
        TEAM_COLORS[p.team], id === this._myId ? 1 : 0.85);
      if (id === this._myId) {
        dot.setStrokeStyle(1.5, 0xffffff, 1);
      }
      this._mmContainer.add(dot);
    }
  }

  shutdown() {
    const battleScene = this.scene.get('BattleScene');
    if (battleScene) {
      battleScene.events.off('hud:update', this._onStateUpdate, this);
      battleScene.events.off('hud:kill', this._onKill, this);
    }
  }
}
