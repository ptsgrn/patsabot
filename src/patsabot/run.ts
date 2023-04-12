#!/usr/bin/env node
// Copyright (c) 2021 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { dirname, resolve } from 'path';

import chalk from 'chalk';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from './logger.js';
import { spawn } from 'child_process';
import { version } from './version.js';

const argv = process.argv.splice(2);
const script_path = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../scripts/'
);

process.on('uncaughtException', (err) => {
  logger.log('error', err);
});

if (argv.length === 0) {
  fs.readdir(script_path, function (err, files) {
    if (err) {
      return console.log(chalk.red.bold('Unable to scan directory: ' + err));
    }
    let scripts = files
      .filter((f) => f.endsWith('.js'))
      .map((f) => f.replace('.js', ''));
    console.log(`
  For show help, use:
    $ ${chalk.green('patsabot')} --help

  ${chalk.green.bold('Available scripts:')}
${scripts.map((s) => `    ${chalk.green(s)}`).join('\n')}

  For more usage and information about each script, see:
    $ ${chalk.green('patsabot')} <script> --help`);
    process.exit(0);
  });
}

if (argv[0] === '--help' || argv[0] === '-h') {
  console.log(`
  ${chalk.blueBright(`PatsaBot v${version}`)}

  ${chalk.white.bold('Usage')}
    $ ${chalk.green('patsabot')} <script> [options]
    script: Script to run. Must be in the src/scripts/ folder.
    options: Options to pass to the script.

    --help, -h: Show this help.
    You can also run ${chalk.green(
      'patsabot'
    )} with no arguments to see a list of scripts 
    and use --help to see the help of a script.

  Examples
    $ ${chalk.green('patsabot')} afccat --help
      See the help of the afccat script.
    
  (c) MIT License 2020-21 Patsagorn Y.`);
  process.exit(0);
}

if (argv[0] !== undefined && argv[0] != '--help' && argv[0] != '-h') {
  const ls = spawn(
    'node',
    [
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        `../scripts/${argv[0]}.js`
      ),
      ...argv.splice(1),
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
      stdio: 'inherit',
    }
  );
  ls.on('close', (code) => {
    console.log(
      chalk.black[code === 0 ? 'bgGreenBright' : 'bgRed'](
        `  script process exited with code ${chalk.bold(code)}  `
      )
    );
  });
}
