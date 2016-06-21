import {BottomBar} from '../lib/ui/bottom-bar';
import cmdify = require('cmdify');

var spawn = require('child_process').spawn;

var loader = [
  '/ Installing',
  '| Installing',
  '\\ Installing',
  '- Installing'
];
var i = 4;
var ui = new BottomBar({bottomBar: loader[i % 4]});

setInterval(function () {
  ui.updateBottomBar(loader[i++ % 4]);
}, 300);

var cmd = spawn(cmdify('npm'), ['-g', 'install', 'inquirer'], {stdio: 'pipe'});
cmd.stdout.pipe(ui.log);
cmd.on('close', function () {
  ui.updateBottomBar('Installation done!\n');
  process.exit();
});
