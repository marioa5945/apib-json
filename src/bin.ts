#!/usr/bin/env node

import ApibJson from './index';
import arg = require('arg');

const apibJson = new ApibJson();

const main = (argv: string[] = process.argv.slice(2)) => {
  // Get parameters
  const args = {
    ...arg(
      {
        '--help': Boolean,
        '--version': Boolean,
        // Aliases.
        '-h': '--help',
        '-v': '--version',
      },
      {
        argv,
      }
    ),
  };
  const { '--help': help = false, '--version': version = false } = args;

  printHelp(help);
  printVersion(version);
  if (args._.length === 2) {
    apibJson.run(argv[0], argv[1]);
  } else {
    printHelp(true);
  }
};

/**
 * Output help tips
 * @param help
 */
const printHelp = (help: boolean) => {
  if (help) {
    console.log(
      `
      Usage: apib-json  olderUrl(apib) folderUrl(target)

      Options:

      -h, --help          Print CLI usage
      -v, --version       Print module version information
      `
    );
    process.exit(0);
  }
};

/**
 * Output project information
 * @param version
 */
const printVersion = (version: boolean) => {
  if (version) {
    console.log(`v${require('../package.json').version}`);
    process.exit(0);
  }
};

main();
