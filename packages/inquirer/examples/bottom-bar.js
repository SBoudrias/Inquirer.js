import { spawn } from 'node:child_process';
import BottomBar from '../lib/ui/bottom-bar.js';

const loader = ['/ Installing', '| Installing', '\\ Installing', '- Installing'];
let i = 4;
const ui = new BottomBar({ bottomBar: loader[i % 4] });

const interval = setInterval(() => {
  ui.updateBottomBar(loader[i++ % 4]);
}, 300);

const cmd = spawn('npm', ['-g', 'install', 'inquirer'], { stdio: 'pipe' });
cmd.stdout.pipe(ui.log);
cmd.on('close', () => {
  clearInterval(interval);
  ui.updateBottomBar('Installation done!\n');

  // eslint-disable-next-line n/no-process-exit
  process.exit(0);
});
