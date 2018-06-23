const Input = require('.');

describe('Input prompt', () => {
  it('renders in idle state', () => {
    const output = Input.render({
      prefix: '?',
      message: 'Question:',
      value: 'answer',
      status: 'idle'
    });
    expect(output).toMatchSnapshot();
  });

  it('renders in done state', () => {
    const output = Input.render({
      prefix: '?',
      message: 'Question:',
      value: 'answer',
      status: 'done'
    });
    expect(output).toMatchSnapshot();
  });
});
