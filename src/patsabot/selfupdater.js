/**
 * self-update script
 */
import { execSync } from 'child_process';
import { createHmac, timingSafeEqual } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import baseLogger from './logger.js';
import { credentials, loggerDir } from './config.js';
const logger = baseLogger.child({ script: 'selfupdate' });
export default async function selfUpdate(req, res) {
    logger.log('debug', 'hook accessed');
    const sig = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const id = req.headers['x-github-delivery'];
    const calculatedSig = `sha256=${createHmac('sha256', credentials.githooksecret)
        .update(JSON.stringify(req.body))
        .digest('hex')}`;
    if (!timingSafeEqual(Buffer.from(calculatedSig), Buffer.from(sig))) {
        logger.log('error', 'Wrong signature', { id });
        return res.status(403).send('Wrong signature');
    }
    logger.log('debug', 'signature verified', { id });
    // check if it's ptsgrn/patsabot and main branch
    if (req.body.repository.full_name !== 'ptsgrn/patsabot' || req.body.ref !== 'refs/heads/main') {
        logger.log('debug', 'Not main branch or not ptsgrn/patsabot', { id });
        return res.status(200).send('Not main branch or not ptsgrn/patsabot');
    }
    const logPath = join(loggerDir, 'update.log');
    try {
        let output = `>> Start Update ${new Date().toISOString()}\n`;
        output += `>>>> git version: ${execSync('git --version')}\n`;
        output += `>>>> npm version: ${execSync('npm --version')}\n`;
        output += `>>>> node version: ${execSync('node --version')}\n`;
        output += `>>>> commit id: ${execSync('git rev-parse HEAD')}\n`;
        output += `>> Pulling from repo\n`;
        output += execSync('git pull').toString();
        const modified = execSync('git diff --name-only HEAD HEAD~1').toString();
        if (modified.includes('package.json')) {
            output += '>> Installing dependencies\n';
            output += execSync('npm install --production').toString();
        }
        output += `>> Webservice restart`;
        output += execSync('webservice --backend=kubernetes node16 restart').toString();
        output += `>> Update finished ${new Date().toISOString()}\n`;
        await fs.writeFile(logPath, output);
        logger.log('info', 'Update finished', { id });
        res.status(200).send('Update finished');
    }
    catch (e) {
        logger.log('error', 'Update failed', { id, error: e });
        res.status(500).send('Update failed');
    }
}
