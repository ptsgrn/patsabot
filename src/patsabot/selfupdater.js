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
    if (!event) {
        logger.log('error', 'No event', { id });
        return res.status(400).send('No event');
    }
    if (event !== 'push') {
        logger.log('error', 'Event is not push', { id });
        return res.status(400).send('Event is not push');
    }
    const { ref, head_commit: { modified }, repository } = req.body;
    if (ref !== 'refs/heads/master') {
        logger.log('error', 'Not master branch', { id });
        return res.status(400).send('Not master branch');
    }
    if (!modified) {
        logger.log('error', 'No modified', { id });
        return res.status(400).send('No modified');
    }
    if (!repository) {
        logger.log('error', 'No repository', { id });
        return res.status(400).send('No repository');
    }
    const { full_name: repo } = repository;
    if (repo !== 'ptsgrn/patsabot') {
        logger.log('error', 'Not ptsgrn/patsabot', { id });
        return res.status(400).send('Not ptsgrn/patsabot');
    }
    const logPath = join(loggerDir, 'update.log');
    try {
        let output = `>> Start Update ${new Date().toISOString()}\n`;
        output += `>> Pulling from ${repo}\n`;
        output += execSync('git pull').toString();
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
