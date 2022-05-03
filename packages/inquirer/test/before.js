import mockery from 'mockery';
import ReadlineStub from './helpers/readline';

mockery.enable();
mockery.warnOnUnregistered(false);
mockery.registerMock('readline', {
  createInterface() {
    return new ReadlineStub();
  },
});
