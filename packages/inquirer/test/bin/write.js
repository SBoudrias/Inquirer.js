/**
 * Simple script to write an argument to a file
 */

import fs from 'fs';

if (process.argv.length === 4) {
  fs.writeFileSync(process.argv[3], process.argv[2]);
}
