import { Client } from 'matrix-org-irc'
import { ircConfig } from './config.js'
import { spawn } from 'child_process'
import cuid from 'cuid'

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
  channels: [
    '#patsabot-console',
    '#patsabot-log'
  ],
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
  encoding: ''
})

client.on('message#patsabot-console', (nick, text, meta) => {

  console.log(`${nick}: ${text}`)
  if (text.startsWith('!log')) {
    client.say('#patsabot-log', `${nick}: ${text.substring(4)}`)
  }
  if (text.startsWith('!help')) {
    client.say('#patsabot-console', `${nick}: !log <message> - send message to #patsabot-log`)
  }
  if (text.startsWith('!quit')) {
    client.disconnect()
  }
  if (text.startsWith('!eval')) {
    client.say('#patsabot-console', `${nick}: ${eval(text.substring(5))}`)
  }
  if (text.startsWith('!run')) {
    const runid = cuid()
    const [_bin, ...cmd] = text.substring(4).split(' ')
    client.say('#patsabot-console', `${nick}: ${runid} - ${cmd.join(' ')}`)
    const child = spawn('patsabot', cmd)
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => {
      client.say('#patsabot-log', `[${runid}] ${data.toString()}`)
    })
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (data) => {
      client.say('#patsabot-log', `[${runid}] ${data.toString()}`)
    })
    child.on('close', (code) => {
      client.say('#patsabot-console', `${nick}: [${runid}] exited with code ${code}`)
      client.say('#patsabot-log', `[${runid}] exited with code ${code}`)
    })
  }
})
