declare module 'cli-width' {
  import { Stream } from 'node:stream';

  export default function (options?: { defaultWidth?: number; output?: Stream }): number;
}
