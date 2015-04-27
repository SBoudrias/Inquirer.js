var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../../helpers/readline");
var fixtures = require("../../helpers/fixtures");

var utils = require("../../../lib/utils/utils");
var Input = require("../../../lib/prompts/input");


describe("`input` prompt", function() {

  beforeEach(function() {
    var self = this;
    this.output = "";

    this._write = Input.prototype.write;
    Input.prototype.write = function( str ) {
      self.output += str;
      return this;
    };

    this.fixture = _.clone( fixtures.input );
    this.rl = new ReadlineStub();
  });

  afterEach(function() {
    Input.prototype.write = this._write;
  });

  it("should use raw value from the user", function( done ) {

    var input = new Input( this.fixture, this.rl );

    input.run(function( answer ) {
      expect(answer).to.equal("Inquirer");
      done();
    });

    this.rl.emit( "line", "Inquirer" );
  });

  it("should output filtered value", function( done ) {
    this.fixture.filter = function() {
      return "pass";
    };

    var prompt = new Input( this.fixture, this.rl );
    prompt.run(function( answer ) {
      expect(this.output).to.contain("pass");
      done();
    }.bind(this));

    this.rl.emit("line", "");
  });

  describe("given a terminal width", function() {

    beforeEach(function() {
      this.cliWidthStub = sinon.stub( utils, "cliWidth" );
      this.cliWidthStub.returns(20);
    });

    afterEach(function() {
      this.cliWidthStub.restore();
    });

    it("should clean short lines appropriately", function( done ) {
      var prompt = new Input( this.fixture, this.rl );
      var cleanSpy = sinon.spy( prompt, "clean" );
      prompt.run(function() {
        expect( cleanSpy.callCount ).to.equal(1);
        expect( cleanSpy.calledWith(1) ).to.be.true;
        done();
      }.bind(this));

      this.rl.line = "hello";
      this.rl.emit( "line", this.rl.line );
    });

    it("should clean wrapped long lines", function( done ) {
      var prompt = new Input( this.fixture, this.rl );
      var cleanSpy = sinon.spy( prompt, "clean" );
      prompt.run(function() {
        expect( cleanSpy.callCount ).to.equal(1);
        expect( cleanSpy.calledWith(3) ).to.be.true;
        done();
      }.bind(this));

      this.rl.line = "asdfasdfasdfasdfasdfasdfasdfasdfasdfasdf";
      this.rl.emit( "line", this.rl.line );
    });

  });

  describe("given no terminal width", function() {

    beforeEach(function() {
      this.cliWidthStub = sinon.stub( utils, "cliWidth" );

      // Return the default value
      this.cliWidthStub.returns(0);
    });

    afterEach(function() {
      this.cliWidthStub.restore();
    });

    it("should clean one line even if the input line is long", function( done ) {
      var prompt = new Input( this.fixture, this.rl );
      var cleanSpy = sinon.spy( prompt, "clean" );
      prompt.run(function() {
        expect( cleanSpy.callCount ).to.equal(1);
        expect( cleanSpy.calledWith(1) ).to.be.true;
        done();
      }.bind(this));

      this.rl.line = "asdfasdfasdfasdfasdfasdfasdfasdfasdfasdf";
      this.rl.emit( "line", this.rl.line );
    });

  });

});
