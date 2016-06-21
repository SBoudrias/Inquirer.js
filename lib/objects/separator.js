"use strict";
var chalk = require('chalk');
var figures = require('figures');
/**
 * Separator object
 * Used to space/separate choices group
 * @constructor
 * @param {String} line   Separation line content (facultative)
 */
var Separator = (function () {
    function Separator(line) {
        this.type = 'separator';
        //noinspection TypeScriptValidateTypes
        this.line = chalk.dim(line || new Array(15).join(figures.line));
    }
    ;
    /**
     * Helper function returning false if object is a separator
     * @param  {Object} obj object to test against
     * @return {Boolean}    `false` if object is a separator
     */
    Separator.exclude = function (obj) {
        return obj.type !== 'separator';
    };
    ;
    /**
     * Stringify separator
     * @return {String} the separator display string
     */
    Separator.prototype.toString = function () {
        return this.line;
    };
    ;
    return Separator;
}());
exports.Separator = Separator;
//# sourceMappingURL=separator.js.map