var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _JobsManager_options, _JobsManager_jobsName;
import { CronJob } from 'cron';
import { exec } from 'node:child_process';
import baselogger from './logger.js';
import { promisify } from 'node:util';
const promiseExec = promisify(exec);
const logger = baselogger.child({
    module: 'jobmanagers'
}); // thank to winstonjs/winston/issues/1577#issuecomment-458117399
export class JobsManager {
    /**
     * managin many cron job
     * @param options job manager option
     */
    constructor(options) {
        _JobsManager_options.set(this, void 0);
        _JobsManager_jobsName.set(this, void 0);
        __classPrivateFieldSet(this, _JobsManager_options, options, "f");
        if (options.timezone)
            logger.log('debug', `timezone set to ${options.timezone}`);
        __classPrivateFieldSet(this, _JobsManager_jobsName, [], "f");
        this.jobs = {};
    }
    /**
     * Add many job at once
     * @param jobs array of job
     */
    addJobs(jobs) {
        for (const job of jobs) {
            this.addJob(job);
        }
        logger.log('debug', `added ${jobs.length} jobs`);
    }
    /**
     * Add job to the list
     * @param job job option
     */
    addJob(job) {
        if (__classPrivateFieldGet(this, _JobsManager_jobsName, "f").includes(job.name)) {
            logger.log('error', `${job.name} is already defined`);
            if (!__classPrivateFieldGet(this, _JobsManager_options, "f").ignoreError)
                throw Error(`${job.name} is already defined`);
            return;
        }
        this.jobs[job.name] = {
            name: job.name,
            cron: new CronJob(job.crontab, this.run(job.command, job), this.onComplete(job.name), job.autostart ?? __classPrivateFieldGet(this, _JobsManager_options, "f").autostart, job.timezone ?? __classPrivateFieldGet(this, _JobsManager_options, "f").timezone),
            data: job
        };
        __classPrivateFieldGet(this, _JobsManager_jobsName, "f").push(job.name);
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
    start(name) {
        if (!this.jobs[name]) {
            logger.log('error', `${name} is not exist`);
            if (!__classPrivateFieldGet(this, _JobsManager_options, "f").ignoreError)
                throw new Error(`${name} is not exist`);
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
    run(command, job) {
        return () => {
            logger.log('info', `running ${job.name}`);
            promiseExec(command) // logging are handled separately
                .catch((err) => {
                logger.log('error', `${job.name} error`, {
                    name: job.name,
                    error: err
                });
            });
        };
    }
    /**
     * Call on job complete
     * @param name name of the job
     * @returns
     */
    onComplete(name) {
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
    job(name) {
        if (!__classPrivateFieldGet(this, _JobsManager_jobsName, "f").includes(name)) {
            if (!__classPrivateFieldGet(this, _JobsManager_options, "f").ignoreError)
                throw new Error(`${name} not found`);
            return undefined;
        }
        const job = this.jobs[name];
        return {
            name: name,
            cron: job.cron,
            running: job.cron.running,
            last: job.cron.lastDate(),
            next: job.cron.nextDate(),
            data: job.data
        };
    }
}
_JobsManager_options = new WeakMap(), _JobsManager_jobsName = new WeakMap();
