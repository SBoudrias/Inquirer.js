const readline = require('readline');
const MuteStream = require('mute-stream');
const ScreenManager = require('./lib/screen-manager');
const { getPromptConfig } = require('./lib/options');

let sessionRl;
let hooks = [];
let hooksCleanup = [];
let index = 0;
let handleChange = () => {};

const cleanupHook = (index) => {
  const cleanFn = hooksCleanup[index];
  if (typeof cleanFn === 'function') {
    cleanFn();
  }
};

exports.useState = (defaultValue) => {
  const _idx = index;
  const value = _idx in hooks ? hooks[_idx] : defaultValue;

  index++;

  return [
    value,
    (newValue) => {
      hooks[_idx] = newValue;

      // Trigger re-render
      handleChange();
    },
  ];
};

exports.useKeypress = (userHandler) => {
  const _idx = index;
  const prevHandler = hooks[_idx];
  const handler = (input, event) => {
    userHandler(event, sessionRl);
  };

  if (prevHandler !== handler) {
    cleanupHook(_idx);

    sessionRl.input.on('keypress', handler);
    hooks[_idx] = handler;
    hooksCleanup[_idx] = () => {
      sessionRl.input.removeListener('keypress', handler);
    };
  }

  index++;
};

exports.useEffect = (cb, depArray) => {
  const _idx = index;

  const oldDeps = hooks[_idx];
  let hasChanged = true;
  if (oldDeps) {
    hasChanged = depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));
  }
  if (hasChanged) {
    cleanupHook(_idx);
    hooksCleanup[_idx] = cb();
  }
  hooks[_idx] = depArray;

  index++;
};

exports.useRef = (val) => {
  return exports.useState({ current: val })[0];
};

exports.createPrompt = (view) => {
  return (options) => {
    // Default `input` to stdin
    const input = process.stdin;

    // Add mute capabilities to the output
    const output = new MuteStream();
    output.pipe(process.stdout);

    const rl = readline.createInterface({
      terminal: true,
      input,
      output,
    });
    const screen = new ScreenManager(rl);

    return new Promise((resolve, reject) => {
      sessionRl = rl;

      const done = (value) => {
        let len = cleanupHook.length;
        while (len--) {
          cleanupHook(len);
        }
        screen.done();

        // Reset hooks state
        hooks = [];
        index = 0;
        sessionRl = undefined;

        // Finally we resolve our promise
        resolve(value);
      };

      hooks = [];
      const workLoop = (config) => {
        index = 0;
        handleChange = () => workLoop(config);
        screen.render(...[view(config, done)].flat().filter(Boolean));
      };

      // TODO: we should display a loader while we get the default options.
      getPromptConfig(options).then(workLoop, reject);
    });
  };
};
