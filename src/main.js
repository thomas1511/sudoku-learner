// Entry point: load styles (in cascade order) and boot the app.
import './styles/base.css';
import './styles/layout.css';
import './styles/board.css';
import './styles/components.css';
import './styles/responsive.css';
import { init } from './app.js';

init();
