import BaseModule from "@/BaseModule";
import Job, { JobStatus } from "@/Job";
import { JobOptions } from "@/types/JobOptions";
import { Jobs, Modules } from "@/types/Modules";
import ModuleManager from "./ModuleManager";

export class JobQueue {
	private _concurrency: number;

	private _isPaused: boolean;

	private _jobs: Job[];

	private _queue: Job[];

	private _active: Job[];

	private _processLock: boolean;

	private _callbacks: Record<
		string,
		{
			resolve: (value: any) => void;
			reject: (reason?: any) => void;
		}
	>;

	/**
	 * Job Queue
	 */
	public constructor() {
		this._concurrency = 50;
		this._isPaused = true;
		this._jobs = [];
		this._queue = [];
		this._active = [];
		this._callbacks = {};
		this._processLock = false;
	}

	/**
	 * getJob - Fetch job
	 *
	 * @param jobId - Job UUID
	 * @returns Job if found
	 */
	public getJob(jobId: string) {
		return this._jobs.find(job => job.getUuid() === jobId);
	}

	/**
	 * pause - Pause queue
	 *
	 * Pause processing of jobs in queue, active jobs will not be paused.
	 */
	public pause() {
		this._isPaused = true;
	}

	/**
	 * resume - Resume queue
	 */
	public resume() {
		this._isPaused = false;
		this._process();
	}

	/**
	 * runJob - Run a job
	 *
	 * @param moduleName - Module name
	 * @param jobName - Job name
	 * @param params - Params
	 */
	public async runJob<ModuleNameType extends keyof Jobs & keyof Modules>(
		moduleName: ModuleNameType,
		jobName: string,
		payload: any,
		options?: JobOptions
	): Promise<ReturnType> {
		return new Promise<ReturnType>((resolve, reject) => {
			this.queueJob(
				moduleName,
				jobName,
				payload,
				{ resolve, reject },
				options
			).catch(reject);
		});
	}

	/**
	 * queueJob - Queue a job
	 *
	 * @param moduleName - Module name
	 * @param jobName - Job name
	 * @param params - Params
	 */
	public async queueJob<ModuleNameType extends keyof Jobs & keyof Modules>(
		moduleName: ModuleNameType,
		jobName: string,
		payload: any,
		callback: {
			resolve: (value: any) => void;
			reject: (reason?: any) => void;
		},
		options?: JobOptions
	): Promise<string> {
		const module = ModuleManager.getModule(moduleName);
		if (!module) throw new Error("Module not found.");

		const JobClass = module.getJob(jobName);

		const job = new JobClass(payload, options);

		this._callbacks[job.getUuid()] = callback;

		this._jobs.push(job);
		this._queue.push(job);
		this._process();

		return job.getUuid();
	}

	/**
	 * process - Process queue
	 */
	private async _process() {
		// If the process is locked, don't continue. This prevents running process at the same time which could lead to issues
		if (this._processLock) return;
		// If the queue is paused, we've reached the maximum number of active jobs, or there are no jobs in the queue, don't continue
		if (
			this._isPaused ||
			this._active.length >= this._concurrency ||
			this._queue.length === 0
		)
			return;

		// Lock the process function
		this._processLock = true;

		// Sort jobs based on priority, with a lower priority being preferred
		const jobs = this._queue.sort(
			(a, b) => a.getPriority() - b.getPriority()
		);

		// Loop through all jobs
		for (let i = 0; i < jobs.length; i += 1) {
			const job = jobs[i];

			// If the module of the job is not started, we can't run the job, so go to the next job in the queue
			// eslint-disable-next-line no-continue
			if (!job.getModule().canRunJobs()) continue;

			// Remove the job from the queue and add it to the active jobs array
			this._queue.splice(this._queue.indexOf(job), 1);

			// Execute the job
			this._active.push(job);

			const callback = this._callbacks[job.getUuid()];
			job.execute()
				.then(callback.resolve)
				.catch(callback.reject)
				.finally(() => {
					delete this._callbacks[job.getUuid()];

					// If the current job is in the active jobs array, remove it, and then run the process function to run another job
					const activeJobIndex = this._active.indexOf(job);
					if (activeJobIndex > -1) {
						this._active.splice(activeJobIndex, 1);
					}

					this._process();
				});
			// Stop the for loop
			if (this._active.length >= this._concurrency) break;
		}

		// Unlock the process after the for loop is finished, so it can be run again
		this._processLock = false;
	}

	/**
	 * getStatus - Get status of job queue
	 *
	 * @returns Job queue status
	 */
	public getStatus() {
		return {
			isPaused: this._isPaused,
			queueLength: this._queue.length,
			activeLength: this._active.length,
			concurrency: this._concurrency
		};
	}

	/**
	 * getQueueStatus - Get statistics of queued or active jobs
	 *
	 * @param type - Job type filter
	 * @returns Job queue statistics
	 */
	public getQueueStatus(type?: JobStatus) {
		const status: Record<string, ReturnType<Job["toJSON"]>[]> = {};
		if (!type || type === JobStatus.ACTIVE)
			status.active = this._active.map(job => job.toJSON());
		if (!type || type === JobStatus.QUEUED)
			status.queue = this._queue.map(job => job.toJSON());
		return status;
	}

	/**
	 * Gets the job array
	 *
	 */
	public getJobs() {
		return this._jobs;
	}
}

export default new JobQueue();
