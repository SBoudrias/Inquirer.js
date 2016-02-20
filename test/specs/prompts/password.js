var expect = require("chai").expect;
var sinon = require("sinon");
var clone = require("lodash.clone");
var ReadlineStub = require("../../helpers/readline");
var fixtures = require("../../helpers/fixtures");

var Password = require("../../../lib/prompts/password");


describe("`password` prompt", function() {
  beforeEach(function() {
    this.fixture = clone( fixtures.password );
    this.rl = new ReadlineStub();
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
