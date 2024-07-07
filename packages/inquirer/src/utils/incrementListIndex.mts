export default function incrementListIndex(
  current: number,
  dir: 'up' | 'down',
  opt: { loop?: boolean; choices: { realLength: number } },
): number {
  const len = opt.choices.realLength;
  const shouldLoop = 'loop' in opt ? Boolean(opt.loop) : true;
  if (dir === 'up') {
    if (current > 0) {
      return current - 1;
    }
    return shouldLoop ? len - 1 : current;
  }
  if (dir === 'down') {
    if (current < len - 1) {
      return current + 1;
    }
    return shouldLoop ? 0 : current;
  }
  throw new Error('dir must be up or down');
}
