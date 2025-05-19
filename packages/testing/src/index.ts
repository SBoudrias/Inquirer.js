import { createPrompt } from '@inquirer/core';

type Key = {
  name: string;
};

export async function render(prompt: any, options: any): Promise<{
  answer: Promise<any>;
  events: {
    keypress: (key: string) => void;
  };
  getScreen: () => string;
}> {
  let screen = '';
  let resolveAnswer: (value: any) => void;

  const answerPromise = new Promise((resolve) => {
    resolveAnswer = resolve;
  });

  let keypressHandler: ((key: Key) => void) | null = null;

  // Mock useKeypress hook to capture keypress handler
  function useKeypress(handler: (key: Key) => void) {
    keypressHandler = handler;
  }

  // Patch prompt to use our mock useKeypress
  const originalUseKeypress = (prompt as any).useKeypress;
  (prompt as any).useKeypress = useKeypress;

  // Function to render prompt and update screen
  function renderPrompt() {
    screen = prompt(options, (value: any) => {
      resolveAnswer(value);
    });
  }

  // Initial render
  renderPrompt();

  // Restore original useKeypress
  if (originalUseKeypress) {
    (prompt as any).useKeypress = originalUseKeypress;
  }

  const events = {
    keypress: (keyName: string) => {
      if (!keypressHandler) {
        throw new Error('No keypress handler registered');
      }
      keypressHandler({ name: keyName });
      renderPrompt();
    },
  };

  return {
    answer: answerPromise,
    events,
    getScreen: () => screen,
  };
}
