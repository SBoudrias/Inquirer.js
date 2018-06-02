var BottomBar = require('../lib/ui/bottom-bar');
var cmdify = require('cmdify');

var loader = ['/ Installing', '| Installing', '\\ Installing', '- Installing'];
var i = 4;
var ui = new BottomBar({ bottomBar: loader[i % 4] });

setInterval(() => {
  ui.updateBottomBar(loader[i++ % 4]);
}, 300);

var spawn = require('child_process').spawn;

var cmd = spawn(cmdify('npm'), ['-g', 'install', 'inquirer'], { stdio: 'pipe' });
cmd.stdout.pipe(ui.log);
cmd.on('close', () => {
  ui.updateBottomBar('Installation done!\n');
  process.exit();
});
