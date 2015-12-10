var expect = require("chai").expect;
var sinon = require("sinon");
var fs = require("fs");
var _ = require("lodash");
var ReadlineStub = require("../../helpers/readline");
var fixtures = require("../../helpers/fixtures");

var Directory = require("../../../lib/prompts/directory");


describe("`directory` prompt", function() {

  beforeEach(function() {
    this.fixture = _.clone( fixtures.directory );
    this.rl = new ReadlineStub();
    this.list = new Directory( this.fixture, this.rl );
  });


  it("should allow user to drill into a folder", function( done ) {

    this.list.run(function( answer ) {
      expect(answer).to.equal("examples");
      done();
    });

    this.rl.input.emit("keypress", "", { name : "down" });
    this.rl.emit("line");
    this.rl.emit("line");
  });

  it("should allow user to go back from drilled folder", function( done ) {

    this.list.run(function( answer ) {
      expect(answer).to.equal("examples");
      done();
    });

    this.rl.input.emit("keypress", "", { name : "down" });
    this.rl.emit("line");
    this.rl.input.emit("keypress", "", { name : "down" });
    this.rl.emit("line");
    this.rl.input.emit("keypress", "", { name : "down" });
    this.rl.input.emit("keypress", "", { name : "down" });
    this.rl.input.emit("keypress", "", { name : "down" });
    this.rl.input.emit("keypress", "", { name : "down" });
    this.rl.input.emit("keypress", "", { name : "down" });
    this.rl.emit("line");
  });

});
