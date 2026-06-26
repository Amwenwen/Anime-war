/**
 * ResultScene — Victory / Defeat screen with stats
 */
class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
    this._winner = null;
    this._won = false;
  }

  init(data) {
    this._winner = data.winner;
    this._won = data.won;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // Background
    const g = this.add.graphics();
    if (this._won) {
      g.fillGradientStyle(0x002244, 0x002244, 0x004488, 0x004488, 1);
    } else {
      g.fillGradientStyle(0x220000, 0x220000, 0x440011, 0x440011, 1);
    }
    g.fillRect(0, 0, W, H);

    // Particles effect
    for (let i = 0; i < 80; i++) {
      const s = this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.Between(2, 5),
        this._won ? 0xffd700 : 0xff4444,
        Phaser.Math.FloatBetween(0.3, 0.9)
      );
      this.tweens.add({
        targets: s,
        y: s.y - Phaser.Math.Between(100, 500),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1,
        repeatDelay: Phaser.Math.Between(0, 3000)
      });
    }

    // Main result text
    const resultText = this._won ? '🏆 VICTORY!' : '💀 DEFEAT';
    const resultColor = this._won ? '#ffd700' : '#ff4444';

    this.add.text(W / 2, H * 0.22, resultText, {
      fontSize: '72px', fontStyle: 'bold',
      fill: resultColor,
      stroke: '#000000', strokeThickness: 8,
      shadow: { offsetX: 4, offsetY: 4, color: this._won ? '#aa8800' : '#880000', blur: 10, fill: true }
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.38, `Team ${this._winner} Wins!`, {
      fontSize: '28px', fill: '#cccccc',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    // Divider
    const line = this.add.graphics();
    line.lineStyle(2, this._won ? 0xffd700 : 0xff4444, 0.5);
    line.strokeLineShape(new Phaser.Geom.Line(W * 0.2, H * 0.46, W * 0.8, H * 0.46));

    // Score summary placeholder
    this.add.text(W / 2, H * 0.52, 'Match Complete', {
      fontSize: '16px', fill: '#888888'
    }).setOrigin(0.5);

    // Buttons
    const playAgainBtn = this.add.text(W / 2 - 110, H * 0.75, '🔄  Play Again', {
      fontSize: '22px', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#226622', padding: { x: 24, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playAgainBtn.on('pointerover', () => playAgainBtn.setAlpha(0.85));
    playAgainBtn.on('pointerout', () => playAgainBtn.setAlpha(1));
    playAgainBtn.on('pointerdown', () => {
      this.scene.start('LobbyScene');
    });

    const mainMenuBtn = this.add.text(W / 2 + 110, H * 0.75, '🏠  Main Menu', {
      fontSize: '22px', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#333333', padding: { x: 24, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    mainMenuBtn.on('pointerover', () => mainMenuBtn.setAlpha(0.85));
    mainMenuBtn.on('pointerout', () => mainMenuBtn.setAlpha(1));
    mainMenuBtn.on('pointerdown', () => {
      this.scene.start('BootScene');
    });

    // Auto-return timer
    let countdown = 30;
    const countText = this.add.text(W / 2, H * 0.88, `Returning to lobby in ${countdown}s`, {
      fontSize: '13px', fill: '#777777'
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 1000,
      repeat: 29,
      callback: () => {
        countdown--;
        countText.setText(`Returning to lobby in ${countdown}s`);
        if (countdown <= 0) this.scene.start('LobbyScene');
      }
    });
  }
}
