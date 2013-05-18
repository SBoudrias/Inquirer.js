Inquirer.js
=====================

A collection of common interactive command line user interfaces.

**This is still early alpha, it's not yet published on NPM - that's coming soon!**


Goal and philosophy
---------------------

We strive at providing easily embeddable and beatiful command line interface for Node.js ;
some hope in becoming the CLI Xanadu.

_Inquirer_ should ease the process of asking end user questions, parsing, validating answers, and providing error feedback.

_Inquirer_ provide the user interface, and the inquiry session flow. If you're searching for a full blown command line program utility, then check out [Commander.js](https://github.com/visionmedia/commander.js) (inspired by) or [Charm](https://github.com/substack/node-charm) (used internally).

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

Documentation
---------------------

### Methods

#### `.prompt( questions, callback )`

Launch the prompt interface (inquiry session)

##### questions
**Type:** Array  
**Contain:** Question Object

##### callback
**Type:** Function
**Parameter:** Answer Object

### Objects

#### Question
A question object is a `hash` containing question related values:

+ **type**: (String) Type of the prompt. Defaults: `input` - Possible values: `input`, `confirm`,
`list`, `rawlist`
+ **name**: (String) The name to use when storing the answer in the anwers hash.
+ **message**: (String) The question to print.
+ **default**: (String) Default value to use if nothing is entered
+ **Choices**: (Array) Choices array.  
Values can be simple strings, or object containing a `name` (to display) and a `value` (to save in the answers hash).

#### Answers
A key/value hash containing the client answers in each prompt.

##### Key
The `name` property of the _question_ object

##### Value

###### confirm
Boolean

###### input
User input (String)

###### rawlist and list
Selected choice value (or name if no value specified)

### Prompts

_(Coming soon)_


News on the march (Release notes)
---------------------

_(Coming soon)_

License
---------------------

Copyright (c) 2012 Simon Boudrias  
Licensed under the MIT license.
