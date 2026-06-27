/**
 * HeroSelectScene — Pick your hero, spell, manage room, start game
 */
class HeroSelectScene extends Phaser.Scene {
  constructor() {
    super('HeroSelectScene');
    this._room = null;
    this._selectedHero = null;
    this._selectedSpell = 'flash';
    this._roleFilter = null;
  }

  init(data) {
    this._room = data.room;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this._W = W; this._H = H;

    this._drawBg();
    this._drawHeader();
    this._drawHeroGrid();
    this._drawSpellBar();
    this._drawRoomPanel();
    this._drawActionBar();
    this._setupNetwork();
  }

  _drawBg() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x080018, 0x080018, 0x140028, 0x140028, 1);
    g.fillRect(0, 0, this._W, this._H);

    // Anime-style diagonal stripes
    g.lineStyle(1, 0xff4400, 0.05);
    for (let i = -this._H; i < this._W + this._H; i += 60) {
      g.strokeLineShape(new Phaser.Geom.Line(i, 0, i + this._H, this._H));
    }
  }

  _drawHeader() {
    const W = this._W;
    this.add.text(W / 2, 22, 'SELECT YOUR HERO', {
      fontSize: '26px', fontStyle: 'bold', fill: '#ffd700',
      stroke: '#ff4400', strokeThickness: 3
    }).setOrigin(0.5);

    // Role filters
    const filters = ['All', 'Assassin', 'Fighter', 'Mage', 'Tank', 'Support', 'Marksman'];
    const startX = W / 2 - (filters.length * 76) / 2;
    filters.forEach((f, i) => {
      const btn = this.add.text(startX + i * 76, 54, f, {
        fontSize: '12px', fill: '#aaaaaa', backgroundColor: '#1a0033',
        padding: { x: 10, y: 5 }
      }).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this._roleFilter = f === 'All' ? null : f.toLowerCase();
        this._renderHeroGrid();
      });

      btn.on('pointerover', () => btn.setStyle({ fill: '#ffffff' }));
      btn.on('pointerout', () => btn.setStyle({ fill: '#aaaaaa' }));
    });
  }

  _drawHeroGrid() {
    this._heroGridContainer = this.add.container(0, 0);
    this._renderHeroGrid();
  }

  _renderHeroGrid() {
    this._heroGridContainer.removeAll(true);

    const heroes = HEROES_CLIENT.filter(h => !this._roleFilter || h.role === this._roleFilter);
    const cols = 6;
    const cardW = 100, cardH = 120;
    const startX = 24, startY = 86;
    const gap = 8;

    heroes.forEach((hero, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap);

      const isSelected = this._selectedHero === hero.id;

      const card = this.add.graphics();
      card.fillStyle(isSelected ? 0x221100 : 0x0d0022, 1);
      card.fillRoundedRect(x, y, cardW, cardH, 8);
      card.fillStyle(isSelected ? 0x442200 : 0x1a0033, 0.6);
      card.fillRoundedRect(x + 2, y + 2, cardW - 4, cardH * 0.55, 6);
      card.lineStyle(isSelected ? 3 : 1.5, isSelected ? 0xffd700 : hero.color, isSelected ? 1 : 0.7);
      card.strokeRoundedRect(x, y, cardW, cardH, 8);

      // Detailed hero portrait using HeroDraw
      const portraitG = this.add.graphics();
      const drawer = HeroDraw.heroes[hero.id] || HeroDraw.heroes.default;
      drawer.draw(portraitG, x + cardW / 2, y + 40, 26, isSelected ? 0xffd700 : hero.color);

      // Role badge
      const roleColor = ROLE_COLORS[hero.role] || '#888888';
      const roleBadge = this.add.text(x + cardW / 2, y + 76, hero.role.toUpperCase(), {
        fontSize: '8px', fontStyle: 'bold', fill: roleColor,
        backgroundColor: '#000000', padding: { x: 4, y: 2 }
      }).setOrigin(0.5);

      const nameText = this.add.text(x + cardW / 2, y + 94, hero.name.split(' ')[0], {
        fontSize: '11px', fill: '#dddddd'
      }).setOrigin(0.5);

      const animeText = this.add.text(x + cardW / 2, y + 108, hero.anime, {
        fontSize: '8px', fill: '#777777'
      }).setOrigin(0.5);

      // Hitbox
      const hitbox = this.add.rectangle(x, y, cardW, cardH, 0x000000, 0)
        .setOrigin(0, 0).setInteractive({ useHandCursor: true });

      hitbox.on('pointerover', () => {
        card.clear();
        card.fillStyle(0x1a0044, 1);
        card.fillRoundedRect(x, y, cardW, cardH, 8);
        card.fillStyle(hero.color, 0.1);
        card.fillRoundedRect(x + 2, y + 2, cardW - 4, cardH * 0.55, 6);
        card.lineStyle(2, hero.color, 1);
        card.strokeRoundedRect(x, y, cardW, cardH, 8);
        this._showHeroInfo(hero);
      });

      hitbox.on('pointerout', () => {
        card.clear();
        card.fillStyle(isSelected ? 0x221100 : 0x0d0022, 1);
        card.fillRoundedRect(x, y, cardW, cardH, 8);
        card.fillStyle(isSelected ? 0x442200 : 0x1a0033, 0.6);
        card.fillRoundedRect(x + 2, y + 2, cardW - 4, cardH * 0.55, 6);
        card.lineStyle(isSelected ? 3 : 1.5, isSelected ? 0xffd700 : hero.color, isSelected ? 1 : 0.7);
        card.strokeRoundedRect(x, y, cardW, cardH, 8);
      });

      hitbox.on('pointerdown', () => {
        this._selectedHero = hero.id;
        network.emit('hero:select', { roomId: this._room.id, heroId: hero.id });
        this._renderHeroGrid();
        this._showHeroInfo(hero);
      });

      this._heroGridContainer.add([card, portraitG, roleBadge, nameText, animeText, hitbox]);
    });
  }

  _showHeroInfo(hero) {
    if (this._infoBox) this._infoBox.destroy();
    const x = 24, y = 436, w = 680, h = 248;
    const cont = this.add.container(0, 0);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x080018, 0.97);
    bg.fillRoundedRect(x, y, w, h, 10);
    bg.lineStyle(2, hero.color, 0.9);
    bg.strokeRoundedRect(x, y, w, h, 10);
    // Colored top bar
    bg.fillStyle(hero.color, 0.15);
    bg.fillRoundedRect(x + 2, y + 2, w - 4, 52, { tl: 9, tr: 9, bl: 0, br: 0 });

    // Large portrait on left
    const portraitBg = this.add.graphics();
    portraitBg.fillStyle(0x000000, 0.5);
    portraitBg.fillCircle(x + 44, y + 44, 38);
    const portraitG = this.add.graphics();
    const drawer = HeroDraw.heroes[hero.id] || HeroDraw.heroes.default;
    drawer.draw(portraitG, x + 44, y + 44, 34, hero.color);

    // Name & anime
    const nameT = this.add.text(x + 92, y + 10, hero.name, {
      fontSize: '18px', fontStyle: 'bold', fill: '#ffd700'
    });
    const animeT = this.add.text(x + 92, y + 32, `[${hero.anime}]`, {
      fontSize: '11px', fill: '#888888'
    });
    const roleT = this.add.text(x + 92, y + 50, hero.role.toUpperCase(), {
      fontSize: '11px', fontStyle: 'bold',
      fill: ROLE_COLORS[hero.role] || '#aaa',
      backgroundColor: '#00000088', padding: { x: 6, y: 3 }
    });

    // Skills preview
    const skillsToShow = (hero.skills || []).slice(0, 4);
    skillsToShow.forEach((sk, i) => {
      const sx = x + 16 + i * 163, sy = y + 72;
      const isUlt = i === 3;
      const skillBg = this.add.graphics();
      skillBg.fillStyle(isUlt ? 0x221100 : 0x0d0020, 1);
      skillBg.fillRoundedRect(sx, sy, 156, 84, 6);
      skillBg.lineStyle(isUlt ? 2 : 1, isUlt ? 0xffd700 : hero.color, isUlt ? 0.9 : 0.5);
      skillBg.strokeRoundedRect(sx, sy, 156, 84, 6);

      // Key hint
      const keyLabels = ['Q', 'W', 'E', 'R'];
      const keyHint = this.add.text(sx + 6, sy + 6, keyLabels[i], {
        fontSize: '10px', fontStyle: 'bold',
        fill: isUlt ? '#ffd700' : '#aaaaaa',
        backgroundColor: '#00000088', padding: { x: 4, y: 2 }
      });

      const label = isUlt ? '⭐ ULTIMATE' : `Skill ${i + 1}`;
      const skLabel = this.add.text(sx + 28, sy + 6, `${label}: ${sk.name}`, {
        fontSize: '10px', fontStyle: 'bold',
        fill: isUlt ? '#ffd700' : '#dddddd',
        wordWrap: { width: 122 }
      });
      const skDesc = this.add.text(sx + 6, sy + 32, sk.description, {
        fontSize: '9px', fill: '#aaaaaa', wordWrap: { width: 144 }
      });
      const skCd = this.add.text(sx + 6, sy + 70, `⏱ CD: ${sk.cooldown}s`, {
        fontSize: '9px', fill: '#ff8c00'
      });

      cont.add([skillBg, keyHint, skLabel, skDesc, skCd]);
    });

    cont.add([bg, portraitBg, portraitG, nameT, animeT, roleT]);
    this._infoBox = cont;
  }

  _drawSpellBar() {
    const startX = 24, y = this._H - 88;

    this.add.text(startX, y - 22, 'BATTLE SPELL:', {
      fontSize: '13px', fontStyle: 'bold', fill: '#ff8c00'
    });

    this._spellContainer = this.add.container(0, 0);
    this._renderSpells(startX, y);
  }

  _renderSpells(sx, sy) {
    this._spellContainer.removeAll(true);

    SPELLS_CLIENT.forEach((spell, i) => {
      const x = sx + i * 78;
      const isSelected = this._selectedSpell === spell.id;

      const bg = this.add.graphics();
      bg.fillStyle(isSelected ? 0x332200 : 0x1a0033, 1);
      bg.fillRoundedRect(x, sy, 72, 72, 8);
      bg.lineStyle(2, isSelected ? 0xffd700 : 0x444444, 1);
      bg.strokeRoundedRect(x, sy, 72, 72, 8);

      const icon = this.add.text(x + 36, sy + 26, spell.icon, {
        fontSize: '22px'
      }).setOrigin(0.5);

      const name = this.add.text(x + 36, sy + 54, spell.name, {
        fontSize: '10px', fill: '#cccccc'
      }).setOrigin(0.5);

      const hitbox = this.add.rectangle(x, sy, 72, 72, 0, 0)
        .setOrigin(0, 0).setInteractive({ useHandCursor: true });

      hitbox.on('pointerdown', () => {
        this._selectedSpell = spell.id;
        network.emit('spell:select', { roomId: this._room.id, spellId: spell.id });
        this._renderSpells(sx, sy);
      });

      hitbox.on('pointerover', () => {
        this._spellTooltip && this._spellTooltip.destroy();
        this._spellTooltip = this.add.text(x, sy - 60, `${spell.name}\n${spell.desc}\nCD: ${spell.cooldown}s`, {
          fontSize: '11px', fill: '#fff', backgroundColor: '#000000dd',
          padding: { x: 8, y: 6 }, wordWrap: { width: 200 }
        });
      });

      hitbox.on('pointerout', () => {
        this._spellTooltip && this._spellTooltip.destroy();
      });

      this._spellContainer.add([bg, icon, name, hitbox]);
    });
  }

  _drawRoomPanel() {
    const x = 724, y = 86, w = 540, h = 550;

    const g = this.add.graphics();
    g.fillStyle(0x110022, 0.9);
    g.fillRoundedRect(x, y, w, h, 10);
    g.lineStyle(1, 0x4488ff, 0.5);
    g.strokeRoundedRect(x, y, w, h, 10);

    this.add.text(x + 16, y + 14, `🏟  ROOM — ${this._room.mode}`, {
      fontSize: '16px', fontStyle: 'bold', fill: '#4499ff'
    });

    this.add.text(x + 16, y + 36, `ID: ${this._room.id.slice(0, 20)}...`, {
      fontSize: '10px', fill: '#555555'
    });

    this._roomPanelX = x;
    this._roomPanelY = y + 60;
    this._roomContainer = this.add.container(0, 0);
    this._renderRoomPlayers();
  }

  _renderRoomPlayers() {
    this._roomContainer.removeAll(true);

    const room = this._room;
    const x = this._roomPanelX + 14;
    let y = this._roomPanelY;

    // Team 1
    const t1 = this.add.text(x, y, '🔵 TEAM 1', { fontSize: '14px', fill: '#4488ff' });
    this._roomContainer.add(t1);
    y += 26;

    room.players.filter(p => p.team === 1).forEach(p => {
      this._renderPlayerRow(x, y, p);
      y += 44;
    });

    y += 10;
    const t2 = this.add.text(x, y, '🔴 TEAM 2', { fontSize: '14px', fill: '#ff4444' });
    this._roomContainer.add(t2);
    y += 26;

    room.players.filter(p => p.team === 2).forEach(p => {
      this._renderPlayerRow(x, y, p);
      y += 44;
    });
  }

  _renderPlayerRow(x, y, p) {
    const isMe = p.id === window._mySocketId;
    const heroColor = p.heroId ? HERO_COLORS[p.heroId] : 0x666666;
    const heroName = p.heroId ? (HEROES_CLIENT.find(h => h.id === p.heroId) || {}).name || 'Unknown' : '—';

    const bg = this.add.graphics();
    bg.fillStyle(isMe ? 0x221133 : 0x150028, 0.9);
    bg.fillRoundedRect(x - 4, y - 4, 510, 38, 6);
    if (isMe) { bg.lineStyle(1, 0xffd700, 0.5); bg.strokeRoundedRect(x - 4, y - 4, 510, 38, 6); }

    const dot = this.add.circle(x + 8, y + 14, 6, heroColor);
    const nameT = this.add.text(x + 22, y + 5, `${p.name}${p.isBot ? ' 🤖' : ''}${isMe ? ' ★' : ''}`, {
      fontSize: '13px', fill: isMe ? '#ffd700' : '#dddddd'
    });
    const heroT = this.add.text(x + 22, y + 22, `Hero: ${heroName}`, {
      fontSize: '10px', fill: '#aaaaaa'
    });

    // Switch team button (for self, not bot)
    if (isMe && !p.isBot) {
      const switchBtn = this.add.text(x + 390, y + 8, 'Switch Team', {
        fontSize: '11px', fill: '#fff', backgroundColor: '#336633',
        padding: { x: 6, y: 4 }
      }).setInteractive({ useHandCursor: true });
      switchBtn.on('pointerdown', () => {
        network.emit('room:switchTeam', { roomId: this._room.id });
      });
      this._roomContainer.add(switchBtn);
    }

    this._roomContainer.add([bg, dot, nameT, heroT]);
  }

  _drawActionBar() {
    const W = this._W, H = this._H;
    const roomId = this._room.id;

    // Add Bot button (host only)
    if (this._room.host === window._mySocketId) {
      const botBtn = this._makeBtn(W - 350, H - 52, '🤖 Add Bot', '#446644', () => {
        const difficulty = prompt('Bot difficulty? (easy / medium / hard)', 'medium') || 'medium';
        network.emit('room:addBot', { roomId, difficulty });
      });
    }

    // Start game (host only)
    if (this._room.host === window._mySocketId) {
      this._startBtn = this._makeBtn(W - 150, H - 52, '▶ START GAME', '#ff4400', () => {
        if (!this._selectedHero) {
          alert('Please select a hero first!');
          return;
        }
        network.emit('game:start', { roomId });
      });
    } else {
      this.add.text(W - 150, H - 52, 'Waiting for host...', {
        fontSize: '14px', fill: '#888888'
      }).setOrigin(0.5);
    }

    // Back button
    this._makeBtn(80, H - 52, '← Back', '#444444', () => {
      this.scene.start('LobbyScene');
    });
  }

  _makeBtn(x, y, label, color, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '15px', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: color, padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', cb);
    return btn;
  }

  _setupNetwork() {
    network.on('room:updated', (room) => {
      this._room = room;
      this._roomContainer && this._renderRoomPlayers();
    });

    network.on('game:starting', (initData) => {
      this.scene.stop('HeroSelectScene');
      this.scene.start('BattleScene', { initData });
      this.scene.launch('HUDScene', { initData });
    });
  }

  shutdown() {
    network.offAll('room:updated');
    network.offAll('game:starting');
  }
}
