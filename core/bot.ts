// Copyright (c) 2024 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Mwn, type MwnOptions } from "mwn";
import { version, dependencies } from '../package.json'
import { Command } from "@commander-js/extra-typings"
import { Cron, type CronOptions } from 'croner';
import chalk from 'chalk';
import { Replica } from './replica';

interface ScheduleOptions {
  pattern: string | Date;
  options: CronOptions;
}

if (!Bun.file('../config.toml').exists()) {
  throw new Error('Please create config.toml')
}

const config = await import('../config.toml')

if (!config.oauth.consumerToken || !config.oauth.consumerSecret || !config.oauth.accessToken || !config.oauth.accessSecret) {
  throw new Error('Please fill in the OAuth credentials in config.toml')
}

export class Bot {
  private _botOptions: MwnOptions = {
    apiUrl: config.bot.apiUrl || "https://th.wikipedia.org/w/api.php",
    OAuthCredentials: {
      consumerToken: config.oauth.consumerToken || process.env.BOT_CONSUMER_TOKEN,
      consumerSecret: config.oauth.consumerSecret || process.env.BOT_CONSUMER_SECRET,
      accessToken: config.oauth.accessToken || process.env.BOT_ACCESS_TOKEN,
      accessSecret: config.oauth.accessSecret || process.env.BOT_ACCESS_SECRET,
    },
    // Set your user agent (required for WMF wikis, see https://meta.wikimedia.org/wiki/User-Agent_policy):
    userAgent: `${config.bot.username}/${version} (${config.bot.contact}) mwn/${dependencies.mwn}`,
    defaultParams: {
      assert: "user",
    },
  }

  public info: {
    id: string;
    name: string;
    description: string;
  }

  public job?: Cron

  public log(obj: any) {
    return Mwn.log(obj)
  }

  public bot = new Mwn({
    ...this._botOptions
  });

  public cli = new Command()

  public replica = new Replica()

  constructor() {
    this.info = {
      id: "bot",
      name: "Bot",
      description: "A bot"
    }
    this.initBot()
  }

  get scriptDescription() {
    return `${chalk.bold(this.info.name)}\n${this.info.description}`
  }

  private async initBot() {
    this.bot = new Mwn(this.botOptions);
    this.bot.initOAuth()
    await this.bot.getTokensAndSiteInfo()
  }

  set botOptions(options: MwnOptions) {
    this._botOptions = options;
    this.bot.setOptions(options);
  }

  get botOptions() {
    return this._botOptions;
  }

  async run() {
    console.error('Please implement run() method')
    process.exit(1)
  }

  async schedule(options: ScheduleOptions) {
    this.job = new Cron(options.pattern, {
      name: this.info.id,
      timezone: config.bot.timezone,
      ...options.options
    })
    this.job.schedule(() => this.run())
  }
}
