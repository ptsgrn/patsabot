import { Client } from 'matrix-org-irc';
import { cuid } from './utils.js';
import { ircConfig } from './config.js';
import { spawn } from 'child_process';
const client = new Client(ircConfig.server, 'patsabot[bot]', {
  userName: 'bot',
  password: ircConfig.password,
  realName: ircConfig.realName,
  port: ircConfig.port,
  localAddress: null,
  // debug: true,
  showErrors: true,
  autoRejoin: true,
  autoConnect: true,
  channels: ['#patsabot-console', '#patsabot-log'],
  secure: false,
  selfSigned: false,
  certExpired: false,
  floodProtection: false,
  floodProtectionDelay: 1000,
  sasl: false,
  retryCount: 0,
  retryDelay: 2000,
  stripColors: false,
  channelPrefixes: '&#',
  messageSplit: 512,
  encoding: '',
});
let queue = [];
client.on('message#patsabot-console', (nick, text, meta) => {
  console.log(`${nick}: ${text}`);
  if (text.startsWith('!log')) {
    client.say('#patsabot-log', `${nick}: ${text.substring(4)}`);
  }
  if (text.startsWith('!help')) {
    client.say(
      '#patsabot-console',
      `${nick}: !log <message> - send message to #patsabot-log`
    );
  }
  if (text.startsWith('!quit')) {
    client.disconnect();
  }
  if (text.startsWith('!eval')) {
    client.say('#patsabot-console', `${nick}: ${eval(text.substring(5))}`);
  }
  if (text.startsWith('!run')) {
    const runid = cuid();
    const [_bin, ...cmd] = text.split(' ');
    console.log('#patsabot-console', `${nick}: [${runid}] ${cmd.join(' ')}`);
    const child = spawn('patsabot', cmd);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => {
      data.split('\n').forEach((line) => {
        queue.push({ channel: '#patsabot-log', text: `[${runid}] ${line}` });
      });
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (data) => {
      data.split('\n').forEach((line) => {
        queue.push({
          channel: '#patsabot-console',
          text: `[${runid}] ${line}`,
        });
      });
    });
    child.on('close', (code) => {
      queue.forEach(async ({ channel, text }) => {
        console.log(`${channel}: ${text}`);
        await new Promise((resolve) => setTimeout(resolve, 500)); // dont so hurry
      });
    });
  }
});
