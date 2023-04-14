/**
 * self-update script
 */
import { createHmac, timingSafeEqual } from 'crypto';
import Axios from 'axios';
import baseLogger from './logger.js';
import { credentials } from './config.js';
import { spawn } from 'child_process';
const logger = baseLogger.child({ script: 'selfupdate' });
const axios = Axios.create({
    baseURL: 'https://patsabot.toolforge.org',
    timeout: 10000,
});
export default async function selfUpdate(req, res) {
    logger.log('debug', 'hook accessed');
    const sig = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const id = req.headers['x-github-delivery'];
    const calculatedSig = `sha256=${createHmac('sha256', credentials.githooksecret)
        .update(JSON.stringify(req.body))
        .digest('hex')}`;
    if (!timingSafeEqual(Buffer.from(calculatedSig), Buffer.from(sig))) {
        return res.status(403).send('Wrong signature');
    }
    logger.log('debug', 'signature verified', { id });
    // check if it's ptsgrn/patsabot and main branch
    if (req.body.repository.full_name !== 'ptsgrn/patsabot' ||
        req.body.ref !== 'refs/heads/main') {
        return res.status(200).send('Not main branch or not ptsgrn/patsabot');
    }
    logger.log('debug', 'repository verified', { id });
    if (event !== 'push') {
        return res.status(200).send('Not push event');
    }
    res.status(200).send('OK');
    logger.info('🚀 Deploying...', { id });
    // Pulling new code from github
    const pull = spawn('git', ['pull'], {
        cwd: '~/bot',
        stdio: 'inherit',
    });
    pull.on('data', (data) => {
        logger.info(data.toString(), { id });
    });
    pull.on('error', (err) => {
        logger.error(`${err.name} ${err.message}`, { id });
    });
    pull.on('close', async (code) => {
        if (code !== 0) {
            logger.error('git pull failed', { id, code });
            process.exit(1);
            return;
        }
        logger.log('debug', `git pull exited with code ${code}`, { id });
    });
    // npm install if package.json changed in git
    const gitStatus = spawn('git', ['status', '--porcelain'], {
        cwd: '~/bot',
        stdio: 'pipe',
    });
    gitStatus.stdout.on('data', async (data) => {
        if (data.toString().includes('package.json')) {
            logger.info('package.json changed, running npm install', { id });
            const install = spawn('npm', ['install', '--only=prod'], {
                cwd: '~/bot',
                stdio: 'inherit',
            });
            install.on('data', (data) => {
                logger.info(data.toString(), { id });
            });
            install.on('error', (err) => {
                logger.error(`${err.name} ${err.message}`, { id });
            });
            install.on('close', async (code) => {
                if (code !== 0) {
                    logger.error('npm install failed', { id, code });
                    process.exit(1);
                    return;
                }
                logger.log('debug', `npm install exited with code ${code}`, { id });
            });
        }
    });
    gitStatus.on('error', (err) => {
        logger.error(`${err.name} ${err.message}`, { id });
    });
    gitStatus.on('close', async (code) => {
        if (code !== 0) {
            logger.error('git status failed', { id, code });
            process.exit(1);
            return;
        }
        logger.log('debug', `git status exited with code ${code}`, { id });
    });
    // restart bot with webservice
    // webservice --backend=kubernetes node16 restart
    const restart = spawn('webservice', ['--backend=kubernetes', 'node16', 'restart'], {
        stdio: 'inherit',
    });
    restart.on('data', (data) => {
        logger.info(data.toString(), { id });
    });
    restart.on('error', (err) => {
        logger.error(`${err.name} ${err.message}`, { id });
    });
    restart.on('close', async (code) => {
        if (code !== 0) {
            logger.error('webservice restart failed', { id, code });
            process.exit(1);
            return;
        }
        logger.log('debug', `webservice restart exited with code ${code}`, { id });
    });
    logger.info('🚀 Deployed!', { id });
    // test ping to make sure bot is alive
    const ping = await axios.post('/ping');
    if (ping.status !== 200) {
        logger.error(`ping failed status: ${ping.status}`, {
            id,
            status: ping.status,
        });
        process.exit(1);
        return;
    }
}
