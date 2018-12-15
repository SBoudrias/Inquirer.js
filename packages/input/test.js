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

  it('supports defaults', () => {
    const withDefault = Input.render({
      prefix: '?',
      message: 'Question:',
      default: 'foo',
      status: 'idle'
    });
    expect(withDefault).toMatchSnapshot();
    expect(withDefault).toContain('foo');

    const whenDone = Input.render({
      prefix: '?',
      message: 'Question:',
      default: 'foo',
      status: 'done'
    });
    expect(whenDone).toMatchSnapshot();
    expect(whenDone).toContain('foo');

    const withAnswer = Input.render({
      prefix: '?',
      message: 'Question:',
      default: 'foo',
      value: 'bar',
      status: 'done'
    });
    expect(withAnswer).toMatchSnapshot();
    expect(withAnswer).toContain('bar');
    expect(withAnswer).not.toContain('foo');
  });

  it('handles keypress', () => {
    const setState = jest.fn();
    const backspace = { name: 'backspace' };

    // Allow removing the default value
    Input.config.onKeypress('', backspace, { canRemoveDefault: true }, setState);
    expect(setState).toHaveBeenLastCalledWith({
      default: undefined,
      canRemoveDefault: true
    });

    // Doesn't allow removing if there's a value
    Input.config.onKeypress('a', backspace, { canRemoveDefault: true }, setState);
    expect(setState).toHaveBeenLastCalledWith({
      canRemoveDefault: false
    });

    Input.config.onKeypress('', backspace, { canRemoveDefault: false }, setState);
    expect(setState).toHaveBeenLastCalledWith({
      canRemoveDefault: true
    });
  });
});
