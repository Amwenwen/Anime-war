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
      fill: '#ffd700', stroke: '#ff4400', strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#ff0000', blur: 8, fill: true }
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.35, 'Multiplayer MOBA — Anime Edition', {
      fontSize: '18px', fill: '#aaaaaa'
    }).setOrigin(0.5);

    // Name input box
    this.add.text(W / 2, H * 0.48, 'Enter Your Summoner Name', {
      fontSize: '20px', fill: '#cccccc'
    }).setOrigin(0.5);

    // DOM input
    const inputEl = this.add.dom(W / 2, H * 0.56).createFromHTML(`
      <input id="nameInput" type="text" maxlength="16" placeholder="YourName"
        style="
          width:280px; padding:12px 16px; font-size:18px;
          border:2px solid #ff8c00; border-radius:8px;
          background:#1a0033; color:#fff; outline:none;
          text-align:center; letter-spacing:2px;
        " />
    `);

    // Play button
    const playBtn = this.add.text(W / 2, H * 0.7, '▶  PLAY', {
      fontSize: '28px', fontStyle: 'bold',
      fill: '#ffffff', backgroundColor: '#ff4400',
      padding: { x: 40, y: 14 },
      shadow: { offsetX: 2, offsetY: 2, color: '#880000', blur: 6, fill: true }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#ff6600' }));
    playBtn.on('pointerout', () => playBtn.setStyle({ backgroundColor: '#ff4400' }));

    playBtn.on('pointerdown', () => {
      const input = document.getElementById('nameInput');
      const name = (input ? input.value.trim() : '') || `Hero_${Math.floor(Math.random() * 9999)}`;
      this._startGame(name);
    });

    // Enter key
    this.input.keyboard.on('keydown-ENTER', () => {
      const input = document.getElementById('nameInput');
      const name = (input ? input.value.trim() : '') || `Hero_${Math.floor(Math.random() * 9999)}`;
      this._startGame(name);
    });

    // Version
    this.add.text(W - 12, H - 12, 'v1.0.0 Beta', {
      fontSize: '12px', fill: '#555555'
    }).setOrigin(1, 1);
  }

  _startGame(playerName) {
    window._playerName = playerName;
    network.emit('lobby:join', { playerName });
    network.on('lobby:joined', (data) => {
      window._mySocketId = data.socketId;
      this.scene.start('LobbyScene');
    });
  }
}
