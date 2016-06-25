/**
 * Simple script to write an argument to a file
 */

require('fs').writeFileSync(process.argv[3], process.argv[2]);
