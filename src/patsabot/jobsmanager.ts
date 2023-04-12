import { CronCommand, CronJob, CronTime } from 'cron';
import { exec } from 'node:child_process';
import baselogger from './logger.js';
import { promisify } from 'node:util';
import util from 'node:util';
import { DateTime } from 'luxon';
const promiseExec = promisify(exec);

const logger = baselogger.child({
  module: 'jobmanagers',
}); // thank to winstonjs/winston/issues/1577#issuecomment-458117399

export interface JobData {
  /**
   * Job name
   */
  name: string;
  /**
   * Job crontab data
   */
  cron: CronJob;
  /**
   * Using for future reference
   */
  data: JobOption;
}

export interface JobsManagerOptions {
  /**
   * Don't throw error. Just logging and ignore it.
   */
  ignoreError?: boolean;
  /**
   * Default timezone for jobs
   */
  timezone?: string;
  /**
   * Dhould it start automatically?
   */
  autostart?: boolean;
}

export interface JobOption {
  name: string;
  crontab: string;
  command: string;
  autostart?: boolean;
  timezone?: string;
}

export interface Job {
  name: string;
  cron: CronJob;
  running: boolean;
  last: DateTime;
  next: DateTime;
  data: JobOption;
}

export class JobsManager {
  /**
   * List of jobs
   */
  jobs: {
    [x: string]: JobData;
  };
  #options: JobsManagerOptions;
  #jobsName: string[];
  /**
   * managin many cron job
   * @param options job manager option
   */
  constructor(options: JobsManagerOptions) {
    this.#options = options;
    if (options.timezone)
      logger.log('debug', `timezone set to ${options.timezone}`);
    this.#jobsName = [];
    this.jobs = {};
  }
  /**
   * Add many job at once
   * @param jobs array of job
   */
  addJobs(jobs: JobOption[]) {
    for (const job of jobs) {
      this.addJob(job);
    }
    logger.log('debug', `added ${jobs.length} jobs`);
  }
  /**
   * Add job to the list
   * @param job job option
   */
  addJob(job: JobOption) {
    if (this.#jobsName.includes(job.name)) {
      logger.log('error', `${job.name} is already defined`);
      if (!this.#options.ignoreError)
        throw Error(`${job.name} is already defined`);
      return;
    }
    this.jobs[job.name] = {
      name: job.name,
      cron: new CronJob(
        job.crontab,
        this.run(job.command, job),
        this.onComplete(job.name),
        job.autostart ?? this.#options.autostart,
        job.timezone ?? this.#options.timezone
      ),
      data: job,
    };
    this.#jobsName.push(job.name);
    logger.log('info', `${job.name} added`);
  }
  /**
   * Start all job in list
   */
  startAll() {
    for (const name in this.jobs) {
      this.start(name);
    }
  }
  /**
   * start a specific job
   * @param name name identifier of the job
   */
  start(name: string) {
    if (!this.jobs[name]) {
      logger.log('error', `${name} is not exist`);
      if (!this.#options.ignoreError) throw new Error(`${name} is not exist`);
      return;
    }
    this.jobs[name].cron.start();
    logger.log('info', `${name} started`);
  }
  /**
   * Running commands
   * @param command run command
   * @param job job data
   */
  run(command: string, job: JobOption): CronCommand {
    return () => {
      logger.log('info', `running ${job.name}`);
      promiseExec(command) // logging are handled separately
        .catch((err) => {
          logger.log('error', `${job.name} error`, {
            name: job.name,
            error: err,
          });
        });
    };
  }
  /**
   * Call on job complete
   * @param name name of the job
   * @returns
   */
  onComplete(name: string): CronCommand {
    return () => {
      logger.log('info', `${name} complete`);
    };
  }
  listJobs() {
    let list = [];
    for (const name in this.jobs) {
      list.push(this.job(name));
    }
    return list;
  }
  job(name: string) {
    if (!this.#jobsName.includes(name)) {
      if (!this.#options.ignoreError) throw new Error(`${name} not found`);
      return undefined;
    }
    const job = this.jobs[name];
    return {
      name: name,
      cron: job.cron,
      running: job.cron.running,
      last: job.cron.lastDate(),
      next: job.cron.nextDate(),
      data: job.data,
    };
  }
}
