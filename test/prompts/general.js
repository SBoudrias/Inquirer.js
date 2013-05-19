/**
 * General prompt interface specs
 */

var _ = require("lodash");
var expect = require("chai").expect;
var sinon = require("sinon");
var EventEmitter = require("events").EventEmitter;

var prompts = [ "input", "confirm", "rawlist", "list" ];

describe("Basic prompt interfaces", function() {

  prompts.forEach(function(promptName) {

    var Prompt = require("../../lib/prompts/" + promptName);
    it(promptName + " prompt constructor should extend defaults property/methods", function() {
      expect(new Prompt({}, {})).to.contain.keys("filter", "validate", "height");
    });

  });

});

