Inquirer.js  [![Build Status](https://travis-ci.org/SBoudrias/Inquirer.js.png?branch=master)](http://travis-ci.org/SBoudrias/Inquirer.js)
=====================

A collection of common interactive command line user interfaces.


Goal and philosophy
---------------------

We strive at providing easily embeddable and beatiful command line interface for Node.js ;
some hope in becoming the CLI Xanadu.

_Inquirer_ should ease the process of asking end user questions, parsing, validating answers, and providing error feedback.

_Inquirer_ provide the user interface, and the inquiry session flow. If you're searching for a full blown command line program utility, then check out [Commander.js](https://github.com/visionmedia/commander.js) (inspired by) or [Cli-color](https://github.com/medikoo/cli-color) (used internally).


Documentation
=====================


Installation
---------------------

``` prompt
npm install inquirer
```

```javascript
var inquirer = require("inquirer");
inquirer.prompt([/* Pass your questions in here */], function( answers ) {
	// Use user feedback for... whatever!!
});
```


Examples (Run it and see it)
---------------------

Checkout the `examples/` folder for code and interface examples.

``` prompt
node examples/pizza.js
# etc
```


Methods
---------------------

### `inquirer.prompt( questions, callback )`

Launch the prompt interface (inquiry session)

+ **questions** (Array) containing [Question Object](#question)
+ **callback** (Function) first parameter is the [Answers Object](#answers)


Objects
---------------------

### Question
A question object is a `hash` containing question related values:

+ **type**: (String) Type of the prompt. Defaults: `input` - Possible values: `input`, `confirm`,
`list`, `rawlist`
+ **name**: (String) The name to use when storing the answer in the anwers hash.
+ **message**: (String) The question to print.
+ **default**: (String) Default value to use if nothing is entered
+ **choices**: (Array) Choices array.  
Values can be simple `string`s, or `object`s containing a `name` (to display) and a `value` properties (to save in the answers hash).
+ **validate**: (Function) Receive the user input and should return `true` if the value is valid, and an error message (`String`) otherwise. If `false` is returned, a default error message is provided.
+ **filter**: (Function) Receive the user input and return the filtered value to be used inside the program. The value returned will be added to the _Answers_ hash.
+ **when**: (Function) Receive the current user answers hash and should return `true` or `false` depending on wheter or not this question should be asked.

`validate`, `filter` and `when` functions can be asynchronously using `this.async()`. You just have to pass the value you'd normally return to the callback option.

``` javascript
{
  validate: function(input) {

    // Declare function as asynchronous, and save the done callback
    var done = this.async();

    // Do async stuff
    setTimeout(function() {
      if (typeof input !== "number") {
        // Pass the return value in the done callback
        done("You need to provide a number");
        return;
      }
      // Pass the return value in the done callback
      done(true);
    }, 3000);
  }
}
```

### Answers
A key/value hash containing the client answers in each prompt.

+ **Key** The `name` property of the _question_ object
+ **Value** (Depends on the prompt)
  + `confirm`: (Boolean)
  + `input` : User input (filtered if `filter` is defined) (String)
  + `rawlist`, `list` : Selected choice value (or name if no value specified) (String)


Prompts
---------------------

### List - `{ type: "list" }`

Take `type`, `name`, `message`, `choices`[, `default`, `filter`] properties. (Note that
default must the choice `index` in the array)

``` prompt
[?] What about the toping: (Use arrow key)
  [X] Peperonni and chesse
  [ ] All dressed
  [ ] Hawaïan
```

### Raw List - `{ type: "rawlist" }`

Take `type`, `name`, `message`, `choices`[, `default`, `filter`] properties. (Note that
default must the choice `index` in the array)

``` prompt
[?] You also get a free 2L liquor: 
  1) Pepsi
  2) 7up
  3) Coke
  Answer: 
```

### Confirm - `{ type: "confirm" }`

Take `type`, `name`, `message`[, `default`] properties.

``` prompt
[?] Is it for a delivery: (Y/n)
```

### Input - `{ type: "input" }`

Take `type`, `name`, `message`[, `default`, `filter`, `validate`] properties.

``` prompt
[?] Any comments on your purchase experience: (Nope, all good!)
```


News on the march (Release notes)
=====================

+ **0.1.7** : Add a hierarchical prompt API with `when`, allow lists from having a default
+ **0.1.6** : Fix bug on unix and minor enhancement
+ **0.1.5** : Enhance visual style; prompts are now more succint. Lots of bug fixes.
+ **0.1.3** : Add async support for validation and filtering functions.
+ **0.1.0** : First official release. There's 4 prompt types: `input`, `confirm`, `list` and
`rawlist`. There's functionnality to allow the validation of input, and the filtering of values.


Contributing
=====================

**Style Guide**: Please base yourself on [Idiomatic.js](https://github.com/rwldrn/idiomatic.js) style guide with two space indent  
**Unit test**: Unit test are wrote in Mocha. Please add a unit test for every new feature
or bug fix. `npm test` to run the test suite.  
**Documentation**: Add documentation for every API change. Feel free to send corrections
or better docs!  


License
=====================

Copyright (c) 2012 Simon Boudrias  
Licensed under the MIT license.
