/* eslint no-multi-spaces: "off" */
/* eslint brace-style: "off" */
/* eslint max-statements-per-line: "off" */
var _ = require('lodash');
var expect = require('chai').expect;
var sinon = require('sinon');
var Paginator = require('../../../lib/utils/paginator');

describe('Paginator', function () {
  describe('Simple', function () {
    var paginator;

    beforeEach(function () {
      paginator = new Paginator();
    });

    it('should return default height (7)', function () { expect(paginator.getHeight(undefined, _.range(5))).equal(7);  });
    it('should return specified height',   function () { expect(paginator.getHeight(20,        _.range(5))).equal(20); });
  });

  describe('Auto height (Terminal mode)', function () {
    var paginator;

    beforeEach(function () {
      process.stdout.getWindowSize = sinon.stub().returns([80, 20]);
      paginator = new Paginator();
    });

    it('should return lines.count    if <   autoHeight-3',  function () { expect(paginator.getHeight('auto', _.range(16))).equal(16); });
    it('should return lines.count -3 if === autoHeight-3',  function () { expect(paginator.getHeight('auto', _.range(17))).equal(17); });
    it('should return lines.count -3 if === autoHeight-2',  function () { expect(paginator.getHeight('auto', _.range(18))).equal(17); });
    it('should return lines.count -3 if === autoHeight-1',  function () { expect(paginator.getHeight('auto', _.range(19))).equal(17); });
    it('should return lines.count -3 if === autoHeight',    function () { expect(paginator.getHeight('auto', _.range(20))).equal(17); });
    it('should return lines.count -3 if >   autoHeight+1',  function () { expect(paginator.getHeight('auto', _.range(21))).equal(17); });
    it('should return lines.count -3 if >   autoHeight+2',  function () { expect(paginator.getHeight('auto', _.range(22))).equal(17); });
  });

  describe('Auto height (non Terminal mode)', function () {
    var paginator;

    beforeEach(function () {
      paginator = new Paginator();
      process.stdout.getWindowSize = undefined;
    });

    it('should return lines.count    if <   autoHeight-3',  function () { expect(paginator.getHeight('auto', _.range(16))).equal(7); });
    it('should return lines.count -3 if === autoHeight-3',  function () { expect(paginator.getHeight('auto', _.range(17))).equal(7); });
    it('should return lines.count -3 if === autoHeight-2',  function () { expect(paginator.getHeight('auto', _.range(18))).equal(7); });
    it('should return lines.count -3 if === autoHeight-1',  function () { expect(paginator.getHeight('auto', _.range(19))).equal(7); });
    it('should return lines.count -3 if === autoHeight',    function () { expect(paginator.getHeight('auto', _.range(20))).equal(7); });
    it('should return lines.count -3 if >   autoHeight+1',  function () { expect(paginator.getHeight('auto', _.range(21))).equal(7); });
    it('should return lines.count -3 if >   autoHeight+2',  function () { expect(paginator.getHeight('auto', _.range(22))).equal(7); });
  });
});
