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
window.addEventListener('pagehide', (): void => game.dispose());
