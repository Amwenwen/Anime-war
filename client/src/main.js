/**
 * Anime War — Phaser 3 Game Entry Point
 */

window.addEventListener('load', () => {
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }, 2200);
});

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0a0010',
  parent: 'game-container',
  pixelArt: false,
  antialias: true,
  dom: {
    createContainer: true   // needed for DOM input elements in BootScene
  },
  scene: [BootScene, LobbyScene, HeroSelectScene, BattleScene, HUDScene, ResultScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);

// Connect to server after Phaser initialises
network.connect();
