"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * Sticky bottom bar user interface
 */
var baseUI_1 = require('./baseUI');
var through = require('through');
// import Base = require('./baseUI');
var rlUtils = require('../utils/readline');
var _ = require('lodash');
var BottomBar = (function (_super) {
    __extends(BottomBar, _super);
    /**
     * Constructor
     */
    function BottomBar(opt) {
        _super.call(this, opt);
        opt = opt || {};
        this.log = through(this.writeLog.bind(this));
        this.bottomBar = opt.bottomBar || '';
        this.render();
    }
    /**
     * Render the prompt to screen
     * @return {BottomBar} self
     */
    BottomBar.prototype.render = function () {
        this.write(this.bottomBar);
        return this;
    };
    ;
    BottomBar.prototype.clean = function () {
        rlUtils.clearLine(this.rl, this.bottomBar.split('\n').length);
        return this;
    };
    /**
     * Update the bottom bar content and rerender
     * @param  {String} bottomBar Bottom bar content
     * @return {BottomBar}           self
     */
    BottomBar.prototype.updateBottomBar = function (bottomBar) {
        this.bottomBar = bottomBar;
        rlUtils.clearLine(this.rl, 1);
        this.rl.output.unmute();
        this.clean().render();
        this.rl.output.mute();
        return this;
    };
    /**
     * Rerender the prompt
     * @return {BottomBar} self
     */
    BottomBar.prototype.writeLog = function (data) {
        rlUtils.clearLine(this.rl, 1);
        this.rl.output.write(this.enforceLF(data.toString()));
        return this.render();
    };
    /**
     * Make sure line end on a line feed
     * @param  {String} str Input string
     * @return {String}     The input string with a final line feed
     */
    BottomBar.prototype.enforceLF = function (str) {
        return str.match(/[\r\n]$/) ? str : str + '\n';
    };
    /**
     * Helper for writing message in BottomBar
     * @param {BottomBar} prompt  - The BottomBar object that extends tty
     * @param {String} message - The message to be output
     */
    BottomBar.prototype.write = function (message) {
        var msgLines = message.split(/\n/);
        this.height = msgLines.length;
        // Write message to screen and setPrompt to control backspace
        this.rl.setPrompt(_.last(msgLines));
        if (this.rl.output.rows === 0 && this.rl.output.columns === 0) {
            /* When it's a tty through serial port there's no terminal info and the render will malfunction,
             so we need enforce the cursor to locate to the leftmost position for rendering. */
            rlUtils.left(this.rl, message.length + this.rl.line.length);
        }
        this.rl.output.write(message);
    };
    return BottomBar;
}(baseUI_1.BaseUI));
exports.BottomBar = BottomBar;
//# sourceMappingURL=bottom-bar.js.map