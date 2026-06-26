/**
 * BootScene — Name entry, connects to server, then goes to Lobby
 */
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0010, 0x0a0010, 0x1a0033, 0x1a0033, 1);
    bg.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 120; i++) {
      const s = this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.Between(1, 2), 0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8)
      );
      this.tweens.add({ targets: s, alpha: 0.1, duration: Phaser.Math.Between(800, 2000), yoyo: true, repeat: -1 });
    }

    // Title
    this.add.text(W / 2, H * 0.22, '⚔  ANIME WAR  ⚔', {
      fontSize: '52px', fontStyle: 'bold',
      fill: '#ffd700', stroke: '#ff4400', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.35, 'Multiplayer MOBA — Anime Edition', {
      fontSize: '18px', fill: '#aaaaaa'
    }).setOrigin(0.5);

    // Name label
    this.add.text(W / 2, H * 0.46, 'Enter Your Summoner Name', {
      fontSize: '18px', fill: '#cccccc'
    }).setOrigin(0.5);

    // Simple HTML input
    const inputEl = this.add.dom(W / 2, H * 0.54).createFromHTML(`
      <input id="nameInput" type="text" maxlength="16" placeholder="YourName"
        style="
          width:280px; padding:12px 16px; font-size:18px;
          border:2px solid #ff8c00; border-radius:8px;
          background:#1a0033; color:#fff; outline:none;
          text-align:center; letter-spacing:2px;
        " />
    `);

    // Status message (shows connecting / errors)
    this._statusText = this.add.text(W / 2, H * 0.63, '', {
      fontSize: '14px', fill: '#ffaa00'
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.text(W / 2, H * 0.72, '▶  PLAY', {
      fontSize: '28px', fontStyle: 'bold',
      fill: '#ffffff', backgroundColor: '#ff4400',
      padding: { x: 40, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#ff6600' }));
    playBtn.on('pointerout', () => playBtn.setStyle({ backgroundColor: '#ff4400' }));
    playBtn.on('pointerdown', () => {
      const input = document.getElementById('nameInput');
      const name = (input ? input.value.trim() : '') || `Hero_${Math.floor(Math.random() * 9999)}`;
      this._startGame(name, playBtn);
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      const input = document.getElementById('nameInput');
      const name = (input ? input.value.trim() : '') || `Hero_${Math.floor(Math.random() * 9999)}`;
      this._startGame(name, playBtn);
    });

    // Connection status indicator
    this._showConnectionStatus();

    this.add.text(W - 12, H - 12, 'v1.0.0 Beta', {
      fontSize: '12px', fill: '#555555'
    }).setOrigin(1, 1);
  }

  _showConnectionStatus() {
    const W = this.scale.width, H = this.scale.height;

    // Show live socket connection state
    const dot = this.add.circle(20, H - 20, 6, 0xff4444);
    const connText = this.add.text(32, H - 27, 'Connecting...', {
      fontSize: '12px', fill: '#aaaaaa'
    });

    // Poll connection state
    this.time.addEvent({
      delay: 500,
      repeat: 20,
      callback: () => {
        if (network.socket && network.socket.connected) {
          dot.setFillStyle(0x00ff88);
          connText.setText('Connected ✓');
        } else if (network.socket && network.socket.disconnected) {
          dot.setFillStyle(0xff4444);
          connText.setText('Disconnected — retrying...');
        } else {
          dot.setFillStyle(0xffaa00);
          connText.setText('Connecting...');
        }
      }
    });
  }

  _startGame(playerName, playBtn) {
    // Guard: make sure socket is connected
    if (!network.socket || !network.socket.connected) {
      this._statusText.setText('⚠ Not connected to server. Retrying...');
      this._statusText.setStyle({ fill: '#ff4444' });

      // Try reconnecting
      if (network.socket) {
        network.socket.connect();
      } else {
        network.connect();
      }

      // Retry after 2s
      this.time.delayedCall(2000, () => {
        this._startGame(playerName, playBtn);
      });
      return;
    }

    playBtn.setText('Connecting...');
    playBtn.disableInteractive();
    this._statusText.setText('Joining server...');
    this._statusText.setStyle({ fill: '#ffaa00' });

    window._playerName = playerName;

    // Set a timeout in case server doesn't respond
    const timeout = this.time.delayedCall(8000, () => {
      this._statusText.setText('⚠ Server timeout. Try again.');
      this._statusText.setStyle({ fill: '#ff4444' });
      playBtn.setText('▶  PLAY');
      playBtn.setInteractive({ useHandCursor: true });
    });

    // Listen for join confirmation
    network.offAll('lobby:joined');
    network.on('lobby:joined', (data) => {
      timeout.remove();
      window._mySocketId = data.socketId;
      window._playerName = data.playerName;
      this._statusText.setText('✓ Joined!');
      this.time.delayedCall(300, () => {
        this.scene.start('LobbyScene');
      });
    });

    network.emit('lobby:join', { playerName });
  }
}
