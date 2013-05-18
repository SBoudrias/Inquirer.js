/**
 * General prompt interface specs
 */

var _ = require("lodash");
var expect = require("chai").expect;
var sinon = require("sinon");
var EventEmitter = require("events").EventEmitter;

var prompts = [ "input", "confirm", "rawlist", "list" ];

_.each(prompts, function(promptName) {

  describe("`" + promptName + "` prompt", function() {

    var prompt = require("../../lib/prompts/" + promptName);

    it("`init` method should return the prompt", function() {
      expect(prompt.init()).to.equal(prompt);
    });
  });

});

