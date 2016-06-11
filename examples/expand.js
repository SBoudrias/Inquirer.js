"use strict";
/**
 * Expand list examples
 */
var inquirer = require('../lib');
// import * as inquirer from  '../lib/index';
inquirer.prompt([{
        type: 'expand',
        message: 'Conflict on `file.js`: ',
        name: 'overwrite',
        choices: [{
                key: 'y',
                name: 'Overwrite',
                value: 'overwrite'
            }, {
                key: 'a',
                name: 'Overwrite this one and all next',
                value: 'overwrite_all'
            }, {
                key: 'd',
                name: 'Show diff',
                value: 'diff'
            },
            new inquirer.Separator(),
            {
                key: 'x',
                name: 'Abort',
                value: 'abort'
            }]
    }
]).then(function (answers) {
    console.log(JSON.stringify(answers, null, '  '));
});
//# sourceMappingURL=expand.js.map