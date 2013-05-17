Inquire.js
=====================

A collection of common interactive command line user interfaces.

**This is still early alpha, it's not yet published on NPM - that's coming soon!**


Goal and philosophy
---------------------

We strive at providing easily embeddable and beatiful command line interface for Node.js

_Inquire_ should ease the process of asking end user questions, parsing, validating answers, and providing error feedback.

_Inquire_ provide the interfaces, and the inquiring session flow. If you're searching for full blown command line utility, then checkout [Commander.js](https://github.com/visionmedia/commander.js) (inspired by) or [Charm](https://github.com/substack/node-charm) (used internally).

Installation
---------------------

``` prompt
npm install inquire
```

```javascript
var inquire = require("inquire");
inquire.prompt([/* Pass your questions in here */], function( answers ) {
	// Use user feedback for... whatever!!
});
```

Documentation
---------------------

_(Coming soon!!)_

License
---------------------

Copyright (c) 2012 Simon Boudrias
Licensed under the MIT license.