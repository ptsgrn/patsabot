// // import { type CronCommand, CronJob, CronTime } from "cron";
// import { exec } from "node:child_process";
// import baselogger from "./logger.js";
// import { promisify } from "node:util";
// const promiseExec = promisify(exec);

// const logger = baselogger.child({
// 	module: "jobmanagers",
// }); // thank to winstonjs/winston/issues/1577#issuecomment-458117399

// export interface JobData {
// 	/**
// 	 * Job name
// 	 */
// 	name: string;
// 	/**
// 	 * Job crontab data
// 	 */
// 	cron: CronJob;
// 	/**
// 	 * Using for future reference
// 	 */
// 	data: JobOption;
// }

// export interface JobsManagerOptions {
// 	/**
// 	 * Don't throw error. Just logging and ignore it.
// 	 */
// 	ignoreError?: boolean;
// 	/**
// 	 * Default timezone for jobs
// 	 */
// 	timezone?: string;
// 	/**
// 	 * Dhould it start automatically?
// 	 */
// 	autostart?: boolean;
// }

// export interface JobOption {
// 	name: string;
// 	crontab: string;
// 	command: string;
// 	autostart?: boolean;
// 	timezone?: string;
// }

// export interface Job {
// 	name: string;
// 	cron: CronJob;
// 	running: boolean;
// 	last: DateTime;
// 	s;
// 	next: DateTime;
// 	data: JobOption;
// }

// type DateString = string;
// export interface JobSerialized {
// 	[x: string]: any;
// 	name: string;
// 	cron: string;
// 	running: boolean;
// 	last: DateString;
// 	next: DateString;
// 	nexts: DateString[];
// 	data: JobOption;
// }

// export class JobsManager {
// 	/**
// 	 * List of jobs
// 	 */
// 	jobs: {
// 		[x: string]: JobData;
// 	};
// 	#options: JobsManagerOptions;
// 	#jobsName: string[];
// 	/**
// 	 * managin many cron job
// 	 * @param options job manager option
// 	 */
// 	constructor(options: JobsManagerOptions) {
// 		this.#options = options;
// 		if (options.timezone)
// 			logger.log("debug", `timezone set to ${options.timezone}`);
// 		this.#jobsName = [];
// 		this.jobs = {};
// 	}
// 	/**
// 	 * Add many job at once
// 	 * @param jobs array of job
// 	 */
// 	addJobs(jobs: JobOption[]) {
// 		for (const job of jobs) {
// 			this.addJob(job);
// 		}
// 		logger.log("debug", `added ${jobs.length} jobs`);
// 	}
// 	/**
// 	 * Add job to the list
// 	 * @param job job option
// 	 */
// 	addJob(job: JobOption) {
// 		if (this.#jobsName.includes(job.name)) {
// 			logger.log("error", `${job.name} is already defined`);
// 			if (!this.#options.ignoreError)
// 				throw Error(`${job.name} is already defined`);
// 			return;
// 		}
// 		this.jobs[job.name] = {
// 			name: job.name,
// 			cron: new CronJob(
// 				job.crontab,
// 				this.run(job.command, job),
// 				this.onComplete(job.name),
// 				job.autostart ?? this.#options.autostart,
// 				job.timezone ?? this.#options.timezone,
// 			),
// 			data: job,
// 		};
// 		this.#jobsName.push(job.name);
// 		logger.log("info", `${job.name} added`);
// 	}
// 	/**
// 	 * Start all job in list
// 	 */
// 	startAll() {
// 		for (const name in this.jobs) {
// 			this.start(name);
// 		}
// 	}
// 	/**
// 	 * start a specific job
// 	 * @param name name identifier of the job
// 	 */
// 	start(name: string) {
// 		if (!this.jobs[name]) {
// 			logger.log("error", `${name} is not exist`);
// 			if (!this.#options.ignoreError) throw new Error(`${name} is not exist`);
// 			return;
// 		}
// 		this.jobs[name].cron.start();
// 		logger.log("info", `${name} started`);
// 	}
// 	/**
// 	 * Running commands
// 	 * @param command run command
// 	 * @param job job data
// 	 */
// 	run(command: string, job: JobOption): CronCommand {
// 		return () => {
// 			logger.log("info", `running ${job.name}`);
// 			promiseExec(command) // logging are handled separately
// 				.catch((err) => {
// 					logger.log("error", `${job.name} error`, {
// 						name: job.name,
// 						error: err,
// 					});
// 				});
// 		};
// 	}
// 	/**
// 	 * Call on job complete
// 	 * @param name name of the job
// 	 * @returns
// 	 */
// 	onComplete(name: string): CronCommand {
// 		return () => {
// 			logger.log("info", `${name} complete`);
// 		};
// 	}
// 	listJobs() {
// 		const list: ReturnType<JobsManager["job"]>[] = [];
// 		for (const name in this.jobs) {
// 			list.push(this.job(name));
// 		}
// 		return list;
// 	}
// 	listJobsSerialized() {
// 		let list = [];
// 		const jobs = this.listJobs();
// 		for (const job in jobs) {
// 			list = [
// 				...list,
// 				{
// 					name: jobs[job].name,
// 					// @ts-expect-error
// 					cron: jobs[job].cron.cronTime.source,
// 					running: jobs[job].cron.running,
// 					last: jobs[job]?.last ? jobs[job]?.last?.toISOString() : undefined,
// 					next: jobs[job]?.next ? jobs[job]?.next?.toISO() : undefined,
// 					// @ts-expect-error
// 					nexts: jobs[job]?.cron?.nextDates(5).map((date) => date.toISO()),
// 					data: jobs[job].data,
// 				},
// 			];
// 		}
// 		return list;
// 	}
// 	job(name: string) {
// 		if (!this.#jobsName.includes(name)) {
// 			if (!this.#options.ignoreError) throw new Error(`${name} not found`);
// 			return undefined;
// 		}
// 		const job = this.jobs[name];
// 		return {
// 			name: name,
// 			cron: job.cron,
// 			running: job.cron.running,
// 			last: job.cron.lastDate(),
// 			next: job.cron.nextDate(),
// 			data: job.data,
// 		};
// 	}
// 	stop(name: string) {
// 		if (!this.#jobsName.includes(name)) {
// 			logger.log("error", `${name} is not exist`);
// 			if (!this.#options.ignoreError) throw new Error(`${name} is not exist`);
// 			return;
// 		}
// 		this.jobs[name].cron.stop();
// 		logger.log("info", `${name} stopped`);
// 	}
// 	stopAll() {
// 		for (const name in this.jobs) {
// 			this.stop(name);
// 		}
// 	}
// 	/**
// 	 * Remove job from list
// 	 * @param name name of the job
// 	 */
// 	remove(name: string) {
// 		if (!this.#jobsName.includes(name)) {
// 			logger.log("error", `${name} is not exist`);
// 			if (!this.#options.ignoreError) throw new Error(`${name} is not exist`);
// 			return;
// 		}
// 		this.jobs[name].cron.stop();
// 		delete this.jobs[name];
// 		this.#jobsName.splice(this.#jobsName.indexOf(name), 1);
// 		logger.log("info", `${name} removed`);
// 	}
// 	/**
// 	 * Remove all job from list
// 	 */
// 	removeAll() {
// 		for (const name in this.jobs) {
// 			this.remove(name);
// 		}

// 		logger.log("info", `removed all jobs`);
// 	}
// }
