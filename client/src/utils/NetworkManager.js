/**
 * NetworkManager — Wraps Socket.IO for easy use across scenes
 */
class NetworkManager {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect() {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

    // In production, connect to Railway server URL from env.js
    // In local dev, connect to localhost:3000
    const serverUrl = isLocal
      ? 'http://localhost:3000'
      : (window.GAME_SERVER_URL || 'https://anime-war-e9872.up.railway.app');

    const opts = {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000
    };

    console.log('[Network] Connecting to:', serverUrl);
    this.socket = io(serverUrl, opts);

    this.socket.on('connect', () => {
      console.log('[Network] Connected:', this.socket.id);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Network] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Network] Disconnected:', reason);
    });

    this.socket.onAny((event, ...args) => {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => cb(...args));
      }
    });
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  offAll(event) {
    delete this.listeners[event];
  }

  emit(event, data) {
    if (this.socket) this.socket.emit(event, data);
  }

  get id() { return this.socket ? this.socket.id : null; }
}

// Singleton
const network = new NetworkManager();
