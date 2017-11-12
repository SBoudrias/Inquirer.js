var expect = require('chai').expect;
var stripAnsi = require('strip-ansi');

var Separator = require('../../../lib/objects/separator');
var Inquirer = require('../../../lib/inquirer');

describe('Separator constructor', function() {
  it('should set a default', function() {
    var sep = new Separator();
    expect(stripAnsi(sep.toString())).to.equal('──────────────');
  });

  it('should set user input as separator', function() {
    var sep = new Separator('foo bar');
    expect(stripAnsi(sep.toString())).to.equal('foo bar');
  });

  it('instances should be stringified when appended to a string', function() {
    var sep = new Separator('foo bar');
    expect(stripAnsi(String(sep))).to.equal('foo bar');
  });

  it('should be exposed on Inquirer object', function() {
    expect(Inquirer.Separator).to.equal(Separator);
  });

  it('should expose a helper function to check for separator', function() {
    expect(Separator.exclude({})).to.equal(true);
    expect(Separator.exclude(new Separator())).to.equal(false);
  });

  it("give the type 'separator' to its object", function() {
    var sep = new Separator();
    expect(sep.type).to.equal('separator');
  });
});
