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
import { ServiceBase, Input } from './base';
import { createId } from '@paralleldrive/cuid2';

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

  /**
   * Information about the bot
   */
  public info: {
    /**
     * The ID of the bot. Must be unique.
     */
    id: string;
    /**
     * The name of the script.
     */
    name: string;
    /**
     * A brief description of the script.
     */
    description: string;
    /**
     * The frequency at which the script should run.
     */
    frequency?: string;
    /**
     * The source of the script. Used for tracking purposes.
     */
    scriptSource?: string;
    /**
     * The run ID of the script. Automatically generated.
     */
    rid?: string;
  }

  /**
   * The cron job for the bot
   * @type {Cron}
   */
  public job?: Cron

  /**
   * The bot instance
   * @type {Mwn}
   */
  public bot: Mwn = new Mwn({
    ...this._botOptions
  });

  /**
   * The commander CLI instance
   */
  public cli = new Command()

  /**
   * The replica instance
   */
  public replica = new Replica()

  /**
   * The input service
   */
  public input = new Input()

  constructor() {
    super()
    this.info = {
      id: "bot",
      name: "Bot",
      description: "A bot",
    }
    this.initBot()
  }

  /**
   * The script description
   */
  get scriptDescription() {
    return `${chalk.bold(this.info.name)}\n${this.info.description}`
  }

  /**
   * Initialize the bot
   */
  private async initBot() {
    this.bot = new Mwn(this.botOptions);
    this.bot.initOAuth()
    await this.bot.getTokensAndSiteInfo()
  }

  /**
   * Set the MWN bot options
   */
  set botOptions(options: MwnOptions) {
    this._botOptions = options;
    this.bot.setOptions(options);
  }

  /**
   * Get the MWN bot options
   * @returns {MwnOptions}
   */
  get botOptions(): MwnOptions {
    return this._botOptions;
  }

  /**
   * Run before the main run method
   */
  async beforeRun() { }

  /**
   * The main run method
   */
  async run() {
    console.error('Please implement run() method')
    process.exit(1)
  }

  /**
   * Cleanup after the main run method
   */
  async afterRun() {
    if (this.replica.conn) {
      this.replica.end()
    }
  }

  /**
   * Start the bot and wait for scheduled time
   * @param options The cron options
   */
  async schedule(options: {
    pattern?: string | Date;
    options?: CronOptions;
  } = {
      pattern: this.info.frequency
    }) {
    const pattern = options.pattern
    if (!pattern) {
      throw new Error('No pattern or frequency specified');
    }
    this.job = new Cron(pattern, {
      name: this.info.id,
      timezone: this.config.bot.timezone,
      ...options.options
    })
    this.job.schedule(() => this.run())
  }
}
