/**
 * @inuse
 * @id archive
 * @name archive
 * @desc ดูการใช้งาน {{tl|เก็บอภิปรายอัตโนมัติ}} แล้วเก็บลงกรุ
 * @script https://github.com/ptsgrn/patsabot/blob/main/src/scripts/archive.ts
 * @cron 15 0 * * *
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
await archive();
