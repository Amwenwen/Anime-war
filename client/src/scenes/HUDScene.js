/**
 * HUDScene — Unite-style HUD: timer + scores top-center, ability bar bottom-center,
 * minimap bottom-left, kill feed top-left
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

    this._drawTopBar();
    this._drawSkillBar();
    this._drawMinimap();
    this._drawKillFeedArea();
    this._drawRespawnOverlay();

    const battleScene = this.scene.get('BattleScene');
    battleScene.events.on('hud:update', this._onStateUpdate, this);
    battleScene.events.on('hud:kill', this._onKill, this);

    this.time.addEvent({ delay: 100, loop: true, callback: this._updateHUD, callbackScope: this });
  }

  _drawTopBar() {
    const W = this._W;
    const panelW = 340, panelH = 52, panelX = W / 2 - panelW / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.72);
    bg.fillRoundedRect(panelX, 4, panelW, panelH, 14);
    bg.lineStyle(1.5, 0x555555, 0.6);
    bg.strokeRoundedRect(panelX, 4, panelW, panelH, 14);

    const t1Bg = this.add.graphics();
    t1Bg.fillStyle(0x1133aa, 0.9);
    t1Bg.fillRoundedRect(panelX + 6, 8, 88, 42, 10);

    const t2Bg = this.add.graphics();
    t2Bg.fillStyle(0xaa1111, 0.9);
    t2Bg.fillRoundedRect(panelX + panelW - 94, 8, 88, 42, 10);

    this.add.text(panelX + 19, 29, '🔵', { fontSize: '14px' }).setOrigin(0.5);
    this.add.text(panelX + panelW - 19, 29, '🔴', { fontSize: '14px' }).setOrigin(0.5);

    this._team1Score = this.add.text(panelX + 58, 29, '0', {
      fontSize: '24px', fontStyle: 'bold', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    this._team2Score = this.add.text(panelX + panelW - 58, 29, '0', {
      fontSize: '24px', fontStyle: 'bold', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    this._timerText = this.add.text(W / 2, 30, '10:00', {
      fontSize: '24px', fontStyle: 'bold', fill: '#ffd700',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    this._drawPlayerRow();
  }

  _drawPlayerRow() {
    const W = this._W;
    const players = this._initData.players;
    const team1 = players.filter(p => p.team === 1);
    const team2 = players.filter(p => p.team === 2);
    const rowY = 64;
    const iconR = 14;
    const gap = 6;

    team1.forEach((p, i) => {
      const x = W / 2 - 95 - i * (iconR * 2 + gap);
      const color = HERO_COLORS[p.heroId] || TEAM_COLORS[1];
      const bg = this.add.graphics();
      bg.fillStyle(0x001133, 0.85);
      bg.fillCircle(x, rowY + iconR, iconR);
      bg.lineStyle(2, color, 0.9);
      bg.strokeCircle(x, rowY + iconR, iconR);
      this.add.text(x, rowY + iconR * 2 + 6, p.name.slice(0, 7), {
        fontSize: '8px', fill: '#aaddff', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5);
    });

    team2.forEach((p, i) => {
      const x = W / 2 + 95 + i * (iconR * 2 + gap);
      const color = HERO_COLORS[p.heroId] || TEAM_COLORS[2];
      const bg = this.add.graphics();
      bg.fillStyle(0x330011, 0.85);
      bg.fillCircle(x, rowY + iconR, iconR);
      bg.lineStyle(2, color, 0.9);
      bg.strokeCircle(x, rowY + iconR, iconR);
      this.add.text(x, rowY + iconR * 2 + 6, p.name.slice(0, 7), {
        fontSize: '8px', fill: '#ffaaaa', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5);
    });
  }

  _drawSkillBar() {
    const W = this._W, H = this._H;
    const slotSize = 64, ultSize = 80, gap = 6;
    const totalW = slotSize + 16 + 3 * (slotSize + gap) + (ultSize + gap) + (slotSize + gap) + 96;
    const startX = W / 2 - totalW / 2;
    const barY = H - slotSize - 16;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.78);
    panelBg.fillRoundedRect(startX - 14, barY - 16, totalW + 28, slotSize + 32, 16);
    panelBg.lineStyle(1.5, 0x443322, 0.7);
    panelBg.strokeRoundedRect(startX - 14, barY - 16, totalW + 28, slotSize + 32, 16);

    const heroId = this._myHero ? this._myHero.heroId : 'naruto';
    const heroData = HEROES_CLIENT.find(h => h.id === heroId) || HEROES_CLIENT[0];
    const teamColor = TEAM_COLORS[this._myHero ? this._myHero.team : 1];

    // Portrait circle
    const portX = startX;
    const portBg = this.add.graphics();
    portBg.fillStyle(0x111111, 0.9);
    portBg.fillCircle(portX + slotSize / 2, barY + slotSize / 2, slotSize / 2 + 3);
    portBg.lineStyle(3, teamColor, 0.9);
    portBg.strokeCircle(portX + slotSize / 2, barY + slotSize / 2, slotSize / 2 + 3);
    const portGraphic = this.add.graphics();
    if (HeroDraw && HeroDraw.heroes[heroId]) {
      HeroDraw.heroes[heroId].draw(portGraphic, portX + slotSize / 2, barY + slotSize / 2, slotSize * 0.38, teamColor);
    }
    this.add.text(portX + slotSize / 2, barY - 8, heroData ? heroData.name.split(' ')[0] : 'Hero', {
      fontSize: '10px', fontStyle: 'bold', fill: '#ffd700', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    // Vertical HP bar
    const hpX = portX + slotSize + 8;
    this._hpBarX = hpX; this._hpBarY = barY; this._hpBarH = slotSize;
    this._hpBg = this.add.graphics();
    this._hpBg.fillStyle(0x1a1a1a, 0.9);
    this._hpBg.fillRoundedRect(hpX, barY, 12, slotSize, 4);
    this._hpFill = this.add.graphics();
    this._hpFill.fillStyle(0x44dd88, 1);
    this._hpFill.fillRoundedRect(hpX, barY, 12, slotSize, 4);
    this._hpText = this.add.text(hpX + 6, barY - 8, 'HP', {
      fontSize: '8px', fill: '#aaaaaa'
    }).setOrigin(0.5);

    // Skill slots 1 2 3
    const skillsX = hpX + 20;
    this._skillSlots = [];
    const keyLabels = ['1', '2', '3'];
    keyLabels.forEach((k, i) => {
      const sx = skillsX + i * (slotSize + gap);
      this._makeSkillSlot(sx, barY, slotSize, slotSize, k, `Skill ${i + 1}`, 0x1a3366, i, false);
    });

    // Ultimate 4
    const ultX = skillsX + 3 * (slotSize + gap);
    this._makeSkillSlot(ultX, barY - (ultSize - slotSize) / 2, ultSize, ultSize, '4', 'Ultimate', 0x332200, 3, true);

    // Spell F
    const spellX = ultX + ultSize + gap;
    this._makeSkillSlot(spellX, barY, slotSize, slotSize, 'F', 'Spell', 0x1a3322, 4, false);

    // Stats panel
    const statsX = spellX + slotSize + 12;
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x111111, 0.82);
    statsBg.fillRoundedRect(statsX, barY, 90, slotSize, 8);
    this._goldText = this.add.text(statsX + 45, barY + 14, '💰 500', {
      fontSize: '13px', fontStyle: 'bold', fill: '#ffd700'
    }).setOrigin(0.5);
    this._levelText = this.add.text(statsX + 45, barY + 35, 'Lv. 1', {
      fontSize: '12px', fill: '#aaaaaa'
    }).setOrigin(0.5);
    this._kdaText = this.add.text(statsX + 45, barY + 54, '0/0/0', {
      fontSize: '10px', fill: '#888888'
    }).setOrigin(0.5);
  }

  _makeSkillSlot(sx, sy, w, h, key, label, bgColor, slotIndex, isUlt) {
    const slotBg = this.add.graphics();
    slotBg.fillStyle(bgColor, 0.92);
    slotBg.fillRoundedRect(sx, sy, w, h, isUlt ? 12 : 8);
    slotBg.lineStyle(isUlt ? 3 : 2, isUlt ? 0xffd700 : 0x336688, isUlt ? 0.95 : 0.6);
    slotBg.strokeRoundedRect(sx, sy, w, h, isUlt ? 12 : 8);

    if (isUlt) {
      const ig = this.add.graphics();
      ig.lineStyle(2, 0xffaa00, 0.35);
      ig.strokeRoundedRect(sx + 4, sy + 4, w - 8, h - 8, 8);
    }
    const keyBg = this.add.graphics();
    keyBg.fillStyle(0x000000, 0.7);
    keyBg.fillRoundedRect(sx + 4, sy + 4, 16, 14, 3);
    this.add.text(sx + 12, sy + 11, key, {
      fontSize: '10px', fontStyle: 'bold', fill: isUlt ? '#ffd700' : '#ccddff'
    }).setOrigin(0.5);
    this.add.text(sx + w / 2, sy + h - 8, label, {
      fontSize: isUlt ? '9px' : '8px', fill: isUlt ? '#ffdd88' : '#888899'
    }).setOrigin(0.5);

    const cdOverlay = this.add.graphics();
    const cdText = this.add.text(sx + w / 2, sy + h / 2 - 4, '', {
      fontSize: isUlt ? '22px' : '18px', fontStyle: 'bold', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    this._skillSlots[slotIndex] = { slotBg, cdOverlay, cdText, sx, sy, w, h };
  }

  _drawMinimap() {
    const H = this._H;
    const mmW = 170, mmH = 170, mmX = 12, mmY = H - mmH - 12;
    const g = this.add.graphics();
    g.fillStyle(0x050b10, 0.88);
    g.fillRoundedRect(mmX, mmY, mmW, mmH, 10);
    g.lineStyle(2, 0x334455, 0.8);
    g.strokeRoundedRect(mmX, mmY, mmW, mmH, 10);
    this.add.text(mmX + mmW / 2, mmY - 12, 'MAP', {
      fontSize: '10px', fontStyle: 'bold', fill: '#667788'
    }).setOrigin(0.5);
    const mg = this.add.graphics();
    mg.fillStyle(0x4488ff, 0.5); mg.fillCircle(mmX + 14, mmY + 14, 11);
    mg.fillStyle(0xff4444, 0.5); mg.fillCircle(mmX + mmW - 14, mmY + mmH - 14, 11);
    mg.fillStyle(0x9955cc, 0.3); mg.fillCircle(mmX + mmW / 2, mmY + mmH / 2, 18);
    mg.lineStyle(2, 0xaa66ee, 0.5); mg.strokeCircle(mmX + mmW / 2, mmY + mmH / 2, 18);
    mg.lineStyle(2, 0x445566, 0.3);
    mg.strokeLineShape(new Phaser.Geom.Line(mmX + 6, mmY + 6, mmX + mmW - 6, mmY + mmH - 6));
    mg.strokeLineShape(new Phaser.Geom.Line(mmX + 6, mmY + 6, mmX + mmW - 6, mmY + 22));
    mg.strokeLineShape(new Phaser.Geom.Line(mmX + 6, mmY + 6, mmX + 22, mmY + mmH - 6));
    this._mmX = mmX; this._mmY = mmY; this._mmW = mmW; this._mmH = mmH;
    this._mmContainer = this.add.container(0, 0);
  }

  _drawKillFeedArea() {
    this._killFeedTexts = [];
    this._killFeedX = 12;
    this._killFeedY = 120;
  }

  _drawRespawnOverlay() {
    this._respawnBg = this.add.graphics();
    this._respawnText = this.add.text(this._W / 2, this._H / 2 - 30, '', {
      fontSize: '30px', fontStyle: 'bold', fill: '#ff4444', stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(10);
  }

  _onStateUpdate(state) { this._state = state; }

  _onKill(ev) {
    this._addKillFeed(`${ev.killer} ⚔ ${ev.victim}`, '#ffaaaa');
  }

  _addKillFeed(msg, color) {
    const y = this._killFeedY + this._killFeedTexts.length * 24;
    const t = this.add.text(this._killFeedX, y, msg, {
      fontSize: '12px', fill: color, stroke: '#000', strokeThickness: 3,
      backgroundColor: '#00000077', padding: { x: 8, y: 4 }
    });
    this._killFeedTexts.push(t);
    if (this._killFeedTexts.length > 5) {
      const old = this._killFeedTexts.shift();
      old.destroy();
      this._killFeedTexts.forEach((tx, i) => tx.setY(this._killFeedY + i * 24));
    }
    this.time.addEvent({ delay: 5000, callback: () => {
      const idx = this._killFeedTexts.indexOf(t);
      if (idx >= 0) {
        this._killFeedTexts.splice(idx, 1);
        t.destroy();
        this._killFeedTexts.forEach((tx, i) => tx.setY(this._killFeedY + i * 24));
      }
    }});
  }

  _updateHUD() {
    const state = this._state;
    if (!state) return;

    // Timer counts down from 10:00
    const remaining = Math.max(0, 600 - state.gameTime);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    this._timerText.setText(`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
    this._timerText.setStyle({ fill: remaining < 60 ? '#ff4444' : remaining < 120 ? '#ffaa00' : '#ffd700' });

    let t1Kills = 0, t2Kills = 0;
    for (const p of Object.values(state.players)) {
      if (p.team === 1) t1Kills += p.kills || 0;
      else t2Kills += p.kills || 0;
    }
    this._team1Score.setText(String(t1Kills));
    this._team2Score.setText(String(t2Kills));

    const me = state.players[this._myId];
    if (!me) return;

    // Vertical HP bar
    const pct = me.hp / me.maxHp;
    this._hpFill.clear();
    this._hpFill.fillStyle(pct > 0.5 ? 0x44dd88 : pct > 0.25 ? 0xffaa00 : 0xff2200, 1);
    const filledH = this._hpBarH * pct;
    this._hpFill.fillRoundedRect(this._hpBarX, this._hpBarY + this._hpBarH - filledH, 12, filledH, 4);
    this._hpText.setText(`${Math.round(me.hp)}`);

    // Cooldowns
    const allCds = [...(me.skillCooldowns || [0,0,0,0]), me.spellCooldown || 0];
    allCds.forEach((cd, i) => {
      if (!this._skillSlots[i]) return;
      const slot = this._skillSlots[i];
      slot.cdOverlay.clear();
      if (cd > 0) {
        slot.cdOverlay.fillStyle(0x000000, 0.68);
        slot.cdOverlay.fillRoundedRect(slot.sx, slot.sy, slot.w, slot.h, i === 3 ? 12 : 8);
        slot.cdText.setText(cd.toFixed(1));
      } else {
        slot.cdText.setText('');
      }
    });

    this._goldText.setText(`💰 ${me.gold || 0}`);
    this._levelText.setText(`Lv. ${me.level || 1}`);
    this._kdaText.setText(`${me.kills || 0}/${me.deaths || 0}/${me.assists || 0}`);

    this._respawnBg.clear();
    if (!me.alive && me.respawnTimer > 0) {
      this._respawnBg.fillStyle(0x000000, 0.55);
      this._respawnBg.fillRect(0, 0, this._W, this._H);
      this._respawnText.setText(`💀 Respawning in ${me.respawnTimer.toFixed(1)}s`);
    } else {
      this._respawnText.setText('');
    }

    this._mmContainer.removeAll(true);
    if (state.towers) {
      for (const t of Object.values(state.towers)) {
        if (!t.alive) continue;
        const mx = this._mmX + (t.x / MAP_W) * this._mmW;
        const my = this._mmY + (t.y / MAP_H) * this._mmH;
        const dot = this.add.rectangle(mx, my, t.isBase ? 8 : 5, t.isBase ? 8 : 5, TEAM_COLORS[t.team], 0.7);
        this._mmContainer.add(dot);
      }
    }
    for (const [id, p] of Object.entries(state.players)) {
      if (!p.alive) continue;
      const mx = this._mmX + (p.x / MAP_W) * this._mmW;
      const my = this._mmY + (p.y / MAP_H) * this._mmH;
      const isMe = id === this._myId;
      const dot = this.add.circle(mx, my, isMe ? 6 : 4, TEAM_COLORS[p.team], isMe ? 1 : 0.85);
      if (isMe) dot.setStrokeStyle(1.5, 0xffffff, 1);
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
