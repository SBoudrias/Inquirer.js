var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../../helpers/readline");
var fixtures = require("../../helpers/fixtures");

var Confirm = require("../../../lib/prompts/confirm");


describe("`confirm` prompt", function() {

  beforeEach(function() {
    var self = this;
    this.output = "";
    this.fixture = _.clone( fixtures.confirm );

    this._write = Confirm.prototype.write;
    Confirm.prototype.write = function( str ) {
      self.output += str;
      return this;
    };

    this.rl = new ReadlineStub();
    this.confirm = new Confirm( this.fixture, this.rl );
  });

  afterEach(function() {
    Confirm.prototype.write = this._write;
  });

  it("should default to true", function( done ) {
    var self = this;

    this.confirm.run(function( answer ) {
      expect(self.output).to.contain("Y/n");
      expect(answer).to.be.true;
      done();
    });

    this.rl.emit( "line", "" );
  });

  it("should allow a default `false` value", function( done ) {
    var self = this;

    this.fixture.default = false;
    var falseConfirm = new Confirm( this.fixture, this.rl );

    falseConfirm.run(function( answer ) {
      expect(self.output).to.contain("y/N");
      expect(answer).to.be.false;
      done();
    });

    this.rl.emit( "line", "" );
  });

  it("should allow a default `true` value", function( done ) {
    var self = this;

    this.fixture.default = true;
    var falseConfirm = new Confirm( this.fixture, this.rl );

    falseConfirm.run(function( answer ) {
      expect(self.output).to.contain("Y/n");
      expect(answer).to.be.true;
      done();
    });

    this.rl.emit( "line", "" );
  });

  it("should parse 'Y' value to boolean true", function( done ) {

    this.confirm.run(function( answer ) {
      expect(answer).to.be.true;
      done();
    });

    this.rl.emit("line", "Y");
  });

  it("should parse 'Yes' value to boolean true", function( done ) {

    this.confirm.run(function( answer ) {
      expect(answer).to.be.true;
      done();
    });

    this.rl.emit("line", "Yes");
  });

  it("should parse 'No' value to boolean false", function( done ) {

    this.confirm.run(function( answer ) {
      expect(answer).to.be.false;
      done();
    });

    this.rl.emit("line", "No");
  });

  it("should parse every other string value to boolean false", function( done ) {

    this.confirm.run(function( answer ) {
      expect(answer).to.be.false;
      done();
    });

    this.rl.emit("line", "bla bla foo");
  });

});
