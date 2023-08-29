import { Separator } from '@inquirer/core';
import { Choice } from './choice.type.mjs';

export type Item<Value> = Separator | Choice<Value>;
