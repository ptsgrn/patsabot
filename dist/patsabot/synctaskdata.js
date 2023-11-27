// Copyright (c) 2023 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
/**
 * @fileoverview sync task data from each script to schedule.json and update cron field to be human readable
 *  and update on-wiki shutoff page
 */
import 'cronstrue/locales/th.js';
import { readFile, readdir, writeFile } from 'fs/promises';
import bot from './bot.js';
import cronstrue from 'cronstrue';
import meow from 'meow';
import { resolveRelativePath } from './utils.js';
const cli = meow(
  `
  บันทึกและ sync ข้อมูล task จาก script ทั้งหมดไปหน้า User:PatsaBot/shutoff และอัปเดต schedule.json

  Usage
    $ patsabot synctaskdata

  Options
    --dry-run, -d  พิมพ์ผลไฟล์ schedule.json และหน้า User:PatsaBot/shutoff แต่ไม่บันทึก
`,
  {
    importMeta: import.meta,
    flags: {
      dryRun: {
        type: 'boolean',
        alias: 'd',
        default: false,
      },
    },
  }
);
const taskDataFields = ['inuse', 'id', 'name', 'desc', 'script', 'cron'];
/**
 * Read first jsdoc from script file (metadata)
 * @param scriptString File text
 * @returns
 */
function readJsdoc(scriptString) {
  const jsdocRegex = /\/\*\*([\s\S]*?)\*\//;
  let jsdoc = jsdocRegex.exec(scriptString)?.[1];
  if (!jsdoc) {
    return null;
  }
  const taskData = jsdoc
    .split('\n')
    .map((line) => line.trim().slice(3))
    .filter((line) => line !== '')
    .map((line) => {
      const [key, ...value] = line.split(' ');
      return { key, value: value.join(' ') };
    })
    .reduce((acc, { key, value }) => {
      if (taskDataFields.includes(key)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  return taskData;
}
const scriptString = `/**
 * @inuse
 * @id archive
 * @name archive
 * @desc ดูการใช้งาน {{tl|เก็บอภิปรายอัตโนมัติ}} แล้วเก็บลงกรุ
 * @script https://github.com/ptsgrn/patsabot/blob/main/src/scripts/archive.ts
 * @cron 0 15 * * *
 * @author Σ ([[:w:en:User:Σ]]) for archive script
 * @license LGPLv2+
 */

import baselogger from '../patsabot/logger.js';
import { credentials } from '../patsabot/config.js';
import { resolveRelativePath } from '../patsabot/utils.js';
import { spawn } from 'child_process';

const logger = baselogger.child({ script: 'archive' });

/**
 * @function archive
 * @desc ดูการใช้งาน {{tl|เก็บอภิปรายอัตโนมัติ}} แล้วเก็บลงกรุ
 * @cron 0 15 * * *
 * @author Σ ([[:w:en:User:Σ]]) for archive script
 */
async function archive() {
  const archiveScriptPath = resolveRelativePath(
    import.meta.url,
    '../../python/archive.py'
  );
  try {
    const { stdout, stderr } = spawn(
      process.env.NODE_ENV === 'development' ? 'python' : '~/pyvenv/bin/python',
      [archiveScriptPath],
      {
        env: {
          ...process.env,
          PATSABOT_ARCHIVE_KEY_SALT:
            credentials?.scripts?.archive?.key_salt ?? '',
          PATSABOT_PASSWORD: credentials.password ?? '',
        },
      }
    );
    stdout.on('data', (data) => {
      logger.info(data.toString());
    });
    stderr.on('data', (data) => {
      logger.error(data.toString());
    });
  } catch (e) {
    logger.error(e.message, { stack: e.stack });
  }
}

archive();
`;
async function main() {
  const scriptDir = resolveRelativePath(import.meta.url, '../scripts');
  const scriptFiles = (await readdir(scriptDir)).filter((file) =>
    file.endsWith('.ts')
  );
  const taskDataList = (
    await Promise.all(
      scriptFiles.map(async (file) => {
        const scriptString = await readFile(
          resolveRelativePath(import.meta.url, `../scripts/${file}`),
          {
            encoding: 'utf-8',
          }
        ).catch((err) => {
          console.error(err);
          return '';
        });
        return { file, ...readJsdoc(scriptString) };
      })
    ).catch((error) => {
      console.error(error);
      return [];
    })
  )
    .filter((taskData) => taskData.inuse || taskData.inuse === '')
    .sort((a, b) => {
      if (typeof a === 'string' || typeof b === 'string') {
        return -1;
      }
      return Number(a.id) - Number(b.id);
    })
    .map((taskData) => {
      const { cron, ...rest } = taskData;
      return {
        ...rest,
        cron,
        cronText: cronstrue.toString(cron, {
          verbose: true,
          locale: 'th',
          use24HourTimeFormat: true,
        }),
      };
    });
  const schedules = taskDataList.map((taskData) => {
    return {
      name: taskData.name,
      crontab: taskData.cron,
      command: `node $HOME/bot/src/patsabot/run.js ${taskData.file.replace(
        '.ts',
        ''
      )}`,
    };
  });
  let rowTaskTable = taskDataList
    .filter(
      (taskData) =>
        taskData.inuse !== 'no-include-table' &&
        (taskData.inuse || taskData.inuse === '')
    )
    .map((taskDataFields) => {
      return `{{/row|${Object.entries(taskDataFields)
        .map(([key, value]) => {
          return `${key}=${value}`;
        })
        .join('|')}}}`;
    })
    .join('\n');
  const shutoffPageContent = await bot
    .read('User:PatsaBot/shutoff')
    .catch((err) => {
      console.error('cannot read shutoff page', { stack: err.stack });
      process.exit(1);
    })
    .then((page) => {
      return page.revisions[0].content;
    });
  const [prePart, _, postPart] = shutoffPageContent.split(
    /<!-- \/?taskmarker -->/
  );
  const newShutoffPageContent = `${prePart}<!-- taskmarker -->\n${rowTaskTable}\n<!-- /taskmarker -->${postPart}`;
  if (!cli.flags?.dryRun) {
    await bot
      .save('User:PatsaBot/shutoff', newShutoffPageContent, 'อัปเดตตารางงาน', {
        bot: true,
      })
      .catch((err) => {
        console.error('cannot save shutoff page', { stack: err.stack });
        process.exit(1);
      });
    await writeFile(
      resolveRelativePath(import.meta.url, '../../schedule.json'),
      JSON.stringify(schedules, null, 2)
    ).catch((err) => {
      console.error('cannot write schedules.json', { stack: err.stack });
      process.exit(1);
    });
  } else {
    console.log('dry run');
    console.log(schedules);
    console.log(newShutoffPageContent);
  }
}
main();
