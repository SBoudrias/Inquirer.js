var expect = require("chai").expect;
var sinon = require("sinon");
var EventEmitter = require("events").EventEmitter;

process.charm = require("../../helpers/charm");
var Confirm = require("../../../lib/prompts/confirm");

describe("`confirm` prompt", function() {

  beforeEach(function() {
    this.rl = new EventEmitter();
    this.confirm = new Confirm({
      message: "foo bar"
    }, this.rl);
  });

  it("should default to true", function(done) {

    this.confirm.run(function(answer) {
      expect(answer).to.be.true;
      done();
    });

    this.rl.emit("line", "");
  });

  it("should parse 'Y' value to boolean", function(done) {

    this.confirm.run(function(answer) {
      expect(answer).to.be.true;
      done();
    });

    this.rl.emit("line", "Y");
  });

  it("should parse 'Yes' value to boolean", function(done) {

    this.confirm.run(function(answer) {
      expect(answer).to.be.true;
      done();
    });

    this.rl.emit("line", "Yes");
  });

  it("should parse 'No' value to boolean", function(done) {

    this.confirm.run(function(answer) {
      expect(answer).to.be.false;
      done();
    });

    this.rl.emit("line", "No");
  });

  it("should parse every string value to boolean", function(done) {

    this.confirm.run(function(answer) {
      expect(answer).to.be.false;
      done();
    });

    this.rl.emit("line", "bla bla foo");
  });

    describe("should accept a default value", function() {

    it("should allow a default value", function(done) {

      var falseConfirm = new Confirm({
        message: "foo bar",
        default: false
      }, this.rl);

      falseConfirm.run(function(answer) {
        expect(answer).to.be.false;
        done();
      });

      this.rl.emit("line", "");
    });

    it("should default \"true\" to boolean true", function(done) {

      var falseConfirm = new Confirm({
        message: "foo bar",
        default: "true"
      }, this.rl);

      falseConfirm.run(function(answer) {
        expect(answer).to.be.true;
        done();
      });

      this.rl.emit("line", "");
    });

    it("should default \"false\" to boolean false", function(done) {
      var falseConfirm = new Confirm({
        message: "foo bar",
        default: "false"
      }, this.rl);

      falseConfirm.run(function(answer) {
        expect(answer).to.be.false;
        done();
      });

      this.rl.emit("line", "");
    });

    it("should default any other string than \"true\" to boolean true", function(done) {
      var falseConfirm = new Confirm({
        message: "foo bar",
        default: "asdfdsa"
      }, this.rl);

      falseConfirm.run(function(answer) {
        expect(answer).to.be.true;
        done();
      });

      this.rl.emit("line", "");
    });

  });

});
