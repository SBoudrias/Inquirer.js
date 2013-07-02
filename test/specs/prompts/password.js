var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../../helpers/readline");
var fixtures = require("../../helpers/fixtures");

var Password = require("../../../lib/prompts/password");


describe("`password` prompt", function() {

  beforeEach(function() {
    this._write = Password.prototype.write;
    Password.prototype.write = function() { return this; };

    this.fixture = _.clone( fixtures.password );
    this.rl = new ReadlineStub();
  });

  afterEach(function() {
    Password.prototype.write = this._write;
  });

  it("should use raw value from the user", function( done ) {

    var password = new Password( this.fixture, this.rl );

    password.run(function( answer ) {
      expect(answer).to.equal("Inquirer");
      done();
    });

    this.rl.emit( "line", "Inquirer" );
  });

});
