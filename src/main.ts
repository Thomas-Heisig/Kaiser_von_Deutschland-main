import { KingdomGameUI } from './ui/KingdomGameUI';
import '/styles/kingdom.css';

const root = document.getElementById('app');
if (!root) throw new Error('Der Spielcontainer fehlt.');

// iPadOS Safari's visual viewport can shrink independently from CSS 100vh.
const syncViewport = (): void => {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--app-height', Math.max(240, height) + 'px');
};
syncViewport();
window.addEventListener('resize', syncViewport);
window.visualViewport?.addEventListener('resize', syncViewport);
const game = new KingdomGameUI(root);
// HTTPS (or localhost) only; the browser can cache a full offline package on request.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL }).catch(error => console.warn('Offline-Dienst:', error));
  });
}
window.addEventListener('pagehide', (): void => game.dispose());
