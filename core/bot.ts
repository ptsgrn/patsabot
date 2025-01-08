// Copyright (c) 2024 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Mwn, type MwnOptions } from "mwn";
import { version, dependencies } from '../package.json'
import { Command } from "@commander-js/extra-typings"
import { Replica } from '@core/replica';
import { Cron, type CronOptions } from 'croner';
import chalk from 'chalk';
import { ServiceBase } from './base';

export class Bot extends ServiceBase {
  private _botOptions: MwnOptions = {
    apiUrl: this.config.bot.apiUrl || "https://th.wikipedia.org/w/api.php",
    OAuthCredentials: {
      consumerToken: this.config.oauth.consumerToken,
      consumerSecret: this.config.oauth.consumerSecret,
      accessToken: this.config.oauth.accessToken,
      accessSecret: this.config.oauth.accessSecret,
    },
    // Set your user agent (required for WMF wikis, see https://meta.wikimedia.org/wiki/User-Agent_policy):
    userAgent: `${this.config.bot.username}/${version} (${this.config.bot.contact}) mwn/${dependencies.mwn}`,
    defaultParams: {
      assert: "user",
    },
  }

  public info: {
    id: string;
    name: string;
    description: string;
    frequency?: string;
  }

  public job?: Cron

  public bot = new Mwn({
    ...this._botOptions
  });

  public cli = new Command()

  public replica = new Replica()

  constructor() {
    super()
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

  async beforeRun() { }

  async run() {
    console.error('Please implement run() method')
    process.exit(1)
  }

  async afterRun() {
    if (this.replica.conn) {
      this.replica.end()
    }
  }

  async schedule(options: {
    pattern: string | Date;
    options?: CronOptions;
  }) {
    this.job = new Cron(options.pattern, {
      name: this.info.id,
      timezone: this.config.bot.timezone,
      ...options.options
    })
    this.job.schedule(() => this.run())
  }
}
