export type EditorParams = {
  args: string[];
  bin: string;
};

export function parseEditorCommand(editor: string): EditorParams {
  let bin: string;
  let rest: string;

  if (editor.startsWith('"')) {
    const closeQuote = editor.indexOf('"', 1);
    if (closeQuote === -1) {
      // Unmatched quote — treat the whole string as the binary
      bin = editor.slice(1);
      rest = '';
    } else {
      bin = editor.substring(1, closeQuote);
      rest = editor.substring(closeQuote + 1).trim();
    }
  } else {
    const firstSpace = editor.indexOf(' ');
    if (firstSpace === -1) {
      bin = editor;
      rest = '';
    } else {
      bin = editor.substring(0, firstSpace);
      rest = editor.substring(firstSpace + 1).trim();
    }
  }

  return { bin, args: rest ? rest.split(/\s+/) : [] };
}
