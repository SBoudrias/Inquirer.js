import mockery from 'mockery';
import ReadlineStub from './helpers/readline.js';

mockery.enable();
mockery.warnOnUnregistered(false);
mockery.registerMock('readline', {
  createInterface() {
    return new ReadlineStub();
  },
});
