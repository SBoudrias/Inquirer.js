"use strict";
var _ = require('lodash');
var MuteStream = require('mute-stream');
var readline = require('readline');
/**
 * Base interface class other can inherits from
 */
var BaseUI = (function () {
    function BaseUI(rl) {
        // Instantiate the Readline interface
        // @Note: Don't reassign if already present (allow test to override the Stream)
        this.rl = rl || readline.createInterface(setupReadlineOptions());
        this.rl.resume();
        this.onForceClose = this.onForceClose.bind(this);
        // Make sure new prompt start on a newline when closing
        this.rl.on('SIGINT', this.onForceClose);
        process.on('exit', this.onForceClose);
    }
    /**
     * Handle the ^C exit
     * @return {null}
     */
    BaseUI.prototype.onForceClose = function () {
        this.close();
        console.log('\n'); // Line return
    };
    /**
     * Close the interface and cleanup listeners
     */
    BaseUI.prototype.close = function () {
        // Remove events listeners
        this.rl.removeListener('SIGINT', this.onForceClose);
        process.removeListener('exit', this.onForceClose);
        // Restore prompt functionnalities
        this.rl.output.unmute();
        // Close the readline
        this.rl.output.end();
        this.rl.pause();
        this.rl.close();
    };
    return BaseUI;
}());
exports.BaseUI = BaseUI;
function setupReadlineOptions() {
    var opt = {
        input: process.stdin,
        output: process.stdout
    };
    // Add mute capabilities to the output
    var ms = new MuteStream();
    ms.pipe(opt.output);
    opt.output = ms;
    return _.extend({
        terminal: true
    }, opt);
}
//# sourceMappingURL=baseUI.js.map