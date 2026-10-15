import { KingdomGameUI } from './ui/KingdomGameUI';
import '/styles/kingdom.css';

const root = document.getElementById('app');
if (!root) throw new Error('Der Spielcontainer fehlt.');

const game = new KingdomGameUI(root);
window.addEventListener('pagehide', (): void => game.dispose());
