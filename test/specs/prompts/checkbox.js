var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../../helpers/readline");
var fixtures = require("../../helpers/fixtures");

var Checkbox = require("../../../lib/prompts/checkbox");


describe("`checkbox` prompt", function() {

  beforeEach(function() {
    var self = this;
    this.output = "";
    this.fixture = _.clone( fixtures.checkbox );

    this._write = Checkbox.prototype.write;
    Checkbox.prototype.write = function( str ) {
      self.output += str;
      return this;
    };

    this.rl = new ReadlineStub();
    this.checkbox = new Checkbox( this.fixture, this.rl );
  });

  afterEach(function() {
    Checkbox.prototype.write = this._write;
  });

  it("should return a single selected choice in an array", function( done ) {
    this.checkbox.run(function( answer ) {
      expect(answer).to.be.an("array");
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal("choice 1");
      done();
    });
    this.rl.emit("keypress", " ", { name: "space" });
    this.rl.emit("line");
  });

  it("should return multiples selected choices in an array", function( done ) {
    this.checkbox.run(function( answer ) {
      expect(answer).to.be.an("array");
      expect(answer.length).to.equal(2);
      expect(answer[0]).to.equal("choice 1");
      expect(answer[1]).to.equal("choice 2");
      done();
    });
    this.rl.emit("keypress", " ", { name: "space" });
    this.rl.emit("keypress", null, { name: "down" });
    this.rl.emit("keypress", " ", { name: "space" });
    this.rl.emit("line");
  });

  it("should check defaults choices", function( done ) {
    this.fixture.choices = [
      { name: "1", checked: true  },
      { name: "2", checked: false },
      { name: "3", checked: false }
    ];
    this.checkbox = new Checkbox( this.fixture, this.rl );
    this.checkbox.run(function( answer ) {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal("1");
      done();
    });
    this.rl.emit("line");
  });

  it("should toggle choice when hitting space", function( done ) {
    this.checkbox.run(function( answer ) {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal("choice 1");
      done();
    });
    this.rl.emit("keypress", " ", { name: "space" });
    this.rl.emit("keypress", null, { name: "down" });
    this.rl.emit("keypress", " ", { name: "space" });
    this.rl.emit("keypress", " ", { name: "space" });
    this.rl.emit("line");
  });

  it("should allow for vi-style navigation", function( done ) {
    this.checkbox.run(function( answer ) {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal("choice 2");
      done();
    });
    this.rl.emit("keypress", "j", { name: "j" });
    this.rl.emit("keypress", "j", { name: "j" });
    this.rl.emit("keypress", "k", { name: "k" });
    this.rl.emit("keypress", " ", { name: "space" });
    this.rl.emit("line");
  });

  it("should allow 1-9 shortcut key", function( done ) {

    this.checkbox.run(function( answer ) {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal("choice 2");
      done();
    });

    this.rl.emit("keypress", "2");
    this.rl.emit("line");
  });

});
