/**
 * NetworkManager — Wraps Socket.IO for easy use across scenes
 * Automatically connects to Firebase Function in production,
 * or localhost in development.
 */
class NetworkManager {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.serverUrl = null;
  }

  connect() {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

    const opts = {
      transports: ['polling', 'websocket'],
      path: '/socket.io',
      reconnectionAttempts: 5,
      reconnectionDelay: 1500
    };

    // Priority: env.js override → local dev → same origin
    const serverUrl = window.GAME_SERVER_URL
      || (isLocal ? 'http://localhost:3000' : '/');

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
