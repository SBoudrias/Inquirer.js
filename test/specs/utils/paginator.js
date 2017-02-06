/* eslint no-multi-spaces: "off" */
/* eslint space-in-parens: "off" */
/* eslint brace-style: "off" */
/* eslint max-statements-per-line: "off" */
var _ = require('lodash');
var expect = require('chai').expect;
var sinon = require('sinon');
var Paginator = require('../../../lib/utils/paginator');

describe('Paginator', function () {
  describe('Auto height (Terminal mode)', function () {
    var paginator;
    var height;

    beforeEach(function () {
      process.stdout.getWindowSize = sinon.stub().returns([80, 20]);
      paginator = new Paginator();
      height = paginator.getHeight.bind(paginator);
    });

    it('should return specified height',                    function () { expect(height(_.range(20), 10)).equal(10); });
    it('should return lines.count    if <   autoHeight-3',  function () { expect(height(_.range(16)    )).equal(16); });
    it('should return lines.count -3 if === autoHeight-3',  function () { expect(height(_.range(17)    )).equal(17); });
    it('should return lines.count -3 if === autoHeight-2',  function () { expect(height(_.range(18)    )).equal(17); });
    it('should return lines.count -3 if === autoHeight-1',  function () { expect(height(_.range(19)    )).equal(17); });
    it('should return lines.count -3 if === autoHeight',    function () { expect(height(_.range(20)    )).equal(17); });
    it('should return lines.count -3 if >   autoHeight+1',  function () { expect(height(_.range(21)    )).equal(17); });
    it('should return lines.count -3 if >   autoHeight+2',  function () { expect(height(_.range(22)    )).equal(17); });
  });

  describe('Auto height (non Terminal mode)', function () {
    var paginator;
    var height;

    beforeEach(function () {
      paginator = new Paginator();
      process.stdout.getWindowSize = undefined;
      height = paginator.getHeight.bind(paginator);
    });

    it('should return specified height',                    function () { expect(height(_.range(20), 10)).equal(10); });
    it('should return default height if <   autoHeight-3',  function () { expect(height(_.range(16)    )).equal(7);  });
    it('should return default height if === autoHeight-3',  function () { expect(height(_.range(17)    )).equal(7);  });
    it('should return default height if === autoHeight-2',  function () { expect(height(_.range(18)    )).equal(7);  });
    it('should return default height if === autoHeight-1',  function () { expect(height(_.range(19)    )).equal(7);  });
    it('should return default height if === autoHeight',    function () { expect(height(_.range(20)    )).equal(7);  });
    it('should return default height if >   autoHeight+1',  function () { expect(height(_.range(21)    )).equal(7);  });
    it('should return default height if >   autoHeight+2',  function () { expect(height(_.range(22)    )).equal(7);  });
  });
});
