/**
 * LobbyScene — Room browser, quick match, create room, invite players
 */
class LobbyScene extends Phaser.Scene {
  constructor() {
    super('LobbyScene');
    this._rooms = [];
    this._players = [];
    this._currentRoom = null;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this._W = W; this._H = H;

    this._drawBackground();
    this._drawHeader();
    this._drawRoomList();
    this._drawPlayerPanel();
    this._drawButtons();
    this._setupNetwork();

    network.emit('room:getList', {});
  }

  _drawBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050010, 0x050010, 0x110022, 0x110022, 1);
    bg.fillRect(0, 0, this._W, this._H);

    // Decorative lines
    for (let i = 0; i < 5; i++) {
      bg.lineStyle(1, 0xff4400, 0.07);
      bg.strokeRect(i * 30, i * 30, this._W - i * 60, this._H - i * 60);
    }
  }

  _drawHeader() {
    const W = this._W;
    this.add.text(W / 2, 36, '⚔  ANIME WAR — LOBBY  ⚔', {
      fontSize: '28px', fontStyle: 'bold', fill: '#ffd700',
      stroke: '#ff4400', strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(W / 2, 68, `Summoner: ${window._playerName || 'Unknown'}`, {
      fontSize: '15px', fill: '#aaaaaa'
    }).setOrigin(0.5);
  }

  _drawRoomList() {
    const panelX = 24, panelY = 90, panelW = 680, panelH = 480;

    // Panel bg
    const g = this.add.graphics();
    g.fillStyle(0x110022, 0.9);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    g.lineStyle(1, 0xff4400, 0.6);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    this.add.text(panelX + 16, panelY + 14, '🗡  PUBLIC ROOMS', {
      fontSize: '16px', fontStyle: 'bold', fill: '#ff8c00'
    });

    // Column headers
    const headers = ['Room ID', 'Mode', 'Players', 'Status', 'Join'];
    const colX = [panelX + 14, panelX + 180, panelX + 320, panelX + 440, panelX + 560];
    headers.forEach((h, i) => {
      this.add.text(colX[i], panelY + 44, h, { fontSize: '12px', fill: '#666666' });
    });

    this._roomListY = panelY + 66;
    this._roomListX = panelX;
    this._roomListW = panelW;
    this._roomContainer = this.add.container(0, 0);
  }

  _drawPlayerPanel() {
    const panelX = 724, panelY = 90, panelW = 540, panelH = 480;

    const g = this.add.graphics();
    g.fillStyle(0x110022, 0.9);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    g.lineStyle(1, 0x4488ff, 0.5);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    this.add.text(panelX + 16, panelY + 14, '👥  ONLINE PLAYERS', {
      fontSize: '16px', fontStyle: 'bold', fill: '#4499ff'
    });

    this._playerPanelX = panelX;
    this._playerPanelY = panelY + 44;
    this._playerContainer = this.add.container(0, 0);
  }

  _drawButtons() {
    const W = this._W, H = this._H;
    const btnY = H - 52;

    this._makeBtn(W * 0.18, btnY, '⚡  Quick Match 3v3', '#ff4400', () => {
      network.emit('room:quickMatch', { mode: '3v3' });
    });

    this._makeBtn(W * 0.42, btnY, '🏠  Create Room', '#2266cc', () => {
      this._showCreateDialog();
    });

    this._makeBtn(W * 0.66, btnY, '🔄  Refresh', '#336633', () => {
      network.emit('room:getList', {});
    });

    this._makeBtn(W * 0.88, btnY, '🚪  Logout', '#555555', () => {
      this.scene.start('BootScene');
    });
  }

  _makeBtn(x, y, label, color, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '16px', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: color, padding: { x: 18, y: 10 },
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setAlpha(0.85));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', cb);
    return btn;
  }

  _showCreateDialog() {
    const W = this._W, H = this._H;
    // Dim overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, W, H);

    const dW = 400, dH = 280;
    const dX = W / 2 - dW / 2, dY = H / 2 - dH / 2;

    overlay.fillStyle(0x1a0033, 1);
    overlay.fillRoundedRect(dX, dY, dW, dH, 14);
    overlay.lineStyle(2, 0xff8c00, 1);
    overlay.strokeRoundedRect(dX, dY, dW, dH, 14);

    const title = this.add.text(W / 2, dY + 30, 'Create Room', {
      fontSize: '22px', fontStyle: 'bold', fill: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(W / 2, dY + 80, 'Mode: 3v3', { fontSize: '16px', fill: '#cccccc' }).setOrigin(0.5);

    const privBtn = this.add.text(W / 2 - 80, dY + 120, '🔓 Public', {
      fontSize: '15px', fill: '#aaffaa', backgroundColor: '#003300', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    let isPrivate = false;
    privBtn.on('pointerdown', () => {
      isPrivate = !isPrivate;
      privBtn.setText(isPrivate ? '🔒 Private' : '🔓 Public');
      privBtn.setStyle({ fill: isPrivate ? '#ffaaaa' : '#aaffaa' });
    });

    this._makeBtn(W / 2 + 60, dY + 120, '✅ Create', '#ff4400', () => {
      network.emit('room:create', { mode: '3v3', isPrivate });
      overlay.destroy(); title.destroy(); privBtn.destroy();
    });

    this._makeBtn(W / 2, dY + 200, '✖ Cancel', '#444444', () => {
      overlay.destroy(); title.destroy(); privBtn.destroy();
    });
  }

  _renderRooms() {
    this._roomContainer.removeAll(true);
    const rooms = this._rooms;

    if (rooms.length === 0) {
      const t = this.add.text(this._roomListX + 280, this._roomListY + 80, 'No rooms yet. Create one!', {
        fontSize: '15px', fill: '#555555'
      }).setOrigin(0.5);
      this._roomContainer.add(t);
      return;
    }

    rooms.forEach((room, i) => {
      const rowY = this._roomListY + i * 38;
      const colX = [this._roomListX + 14, this._roomListX + 180, this._roomListX + 320, this._roomListX + 440, this._roomListX + 560];

      const rowBg = this.add.graphics();
      rowBg.fillStyle(i % 2 === 0 ? 0x1a0033 : 0x220044, 0.5);
      rowBg.fillRect(this._roomListX + 4, rowY - 4, this._roomListW - 8, 34);

      const shortId = room.id.slice(0, 10) + '...';
      const t0 = this.add.text(colX[0], rowY + 8, shortId, { fontSize: '12px', fill: '#cccccc' });
      const t1 = this.add.text(colX[1], rowY + 8, room.mode, { fontSize: '13px', fill: '#ffd700' });
      const t2 = this.add.text(colX[2], rowY + 8, `${room.playerCount}/${room.maxPlayers}`, { fontSize: '13px', fill: '#aaffaa' });
      const t3 = this.add.text(colX[3], rowY + 8, room.status, { fontSize: '12px', fill: '#ff8c00' });

      const joinBtn = this.add.text(colX[4], rowY + 8, '  Join  ', {
        fontSize: '13px', fill: '#fff', backgroundColor: '#2266cc',
        padding: { x: 8, y: 4 }
      }).setInteractive({ useHandCursor: true });

      joinBtn.on('pointerdown', () => {
        network.emit('room:join', { roomId: room.id });
      });

      this._roomContainer.add([rowBg, t0, t1, t2, t3, joinBtn]);
    });
  }

  _renderPlayers() {
    this._playerContainer.removeAll(true);
    const pX = this._playerPanelX + 14;

    this._players.forEach((p, i) => {
      const rowY = this._playerPanelY + i * 36;
      const isMe = p.id === window._mySocketId;

      const dot = this.add.circle(pX + 6, rowY + 12, 5, isMe ? 0xffd700 : 0x00ff88);
      const nameText = this.add.text(pX + 18, rowY + 4, p.name + (isMe ? ' (You)' : ''), {
        fontSize: '14px', fill: isMe ? '#ffd700' : '#dddddd'
      });

      // Invite button (not for self)
      if (!isMe) {
        const inviteBtn = this.add.text(pX + 380, rowY + 4, 'Invite', {
          fontSize: '12px', fill: '#fff', backgroundColor: '#aa4400',
          padding: { x: 6, y: 3 }
        }).setInteractive({ useHandCursor: true });

        inviteBtn.on('pointerdown', () => {
          if (this._currentRoom) {
            network.emit('room:invite', { targetSocketId: p.id, roomId: this._currentRoom.id });
          } else {
            alert('Join or create a room first!');
          }
        });
        this._playerContainer.add(inviteBtn);
      }

      this._playerContainer.add([dot, nameText]);
    });
  }

  _setupNetwork() {
    network.on('room:list', (rooms) => {
      this._rooms = rooms;
      this._renderRooms();
    });

    network.on('lobby:playerList', (players) => {
      this._players = players;
      this._renderPlayers();
    });

    // When a room is created or we join one → go to waiting room
    network.on('room:created', (room) => {
      this._currentRoom = room;
      this.scene.start('HeroSelectScene', { room });
    });

    network.on('room:updated', (room) => {
      this._currentRoom = room;
      this.scene.start('HeroSelectScene', { room });
    });

    // Invite received
    network.on('room:inviteReceived', ({ from, roomId }) => {
      if (confirm(`${from} invites you to join their room. Accept?`)) {
        network.emit('room:inviteAccept', { roomId });
      }
    });
  }

  shutdown() {
    network.offAll('room:list');
    network.offAll('lobby:playerList');
    network.offAll('room:created');
    network.offAll('room:updated');
    network.offAll('room:inviteReceived');
  }
}
