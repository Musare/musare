import { SessionSchema } from "@models/sessions/schema";
import JobContext from "@/JobContext";
import JobStatistics, { JobStatisticsType } from "@/JobStatistics";
import LogBook, { Log } from "@/LogBook";
import BaseModule from "./BaseModule";
import EventsModule from "./modules/EventsModule";
import { getErrorMessage } from "./utils/getErrorMessage";
import { generateUuid } from "@/utils/generateUuid";

export enum JobStatus {
	QUEUED = "QUEUED",
	ACTIVE = "ACTIVE",
	PAUSED = "PAUSED",
	COMPLETED = "COMPLETED"
}

export type JobOptions = {
	priority?: number;
	longJob?: string;
	session?: SessionSchema;
	socketId?: string;
	callbackRef?: string;
};

export default abstract class Job {
	protected static _apiEnabled = true;

	protected _module: InstanceType<typeof BaseModule>;

	protected _payload: any;

	protected _context: JobContext;

	protected _priority: number;

	protected _longJob?: {
		title: string;
		progress?: {
			data: unknown;
			time: Date;
			timeout?: NodeJS.Timeout;
		};
	};

	protected _uuid: string;

	protected _status: JobStatus;

	protected _createdAt: number;

	protected _startedAt?: number;

	protected _completedAt?: number;

	/**
	 * Job
	 *
	 * @param name - Job name
	 * @param module - Job module
	 * @param callback - Job callback
	 * @param options - Job options
	 */
	public constructor(
		module: InstanceType<typeof BaseModule>,
		payload: unknown,
		options?: JobOptions
	) {
		this._createdAt = performance.now();
		this._module = module;
		this._payload = payload;
		this._priority = 1;
		this._status = JobStatus.QUEUED;
		/* eslint-disable no-bitwise, eqeqeq */
		this._uuid = generateUuid();

		let contextOptions;

		if (options) {
			const { priority, longJob, session, socketId, callbackRef } =
				options;

			if (session || socketId)
				contextOptions = { session, socketId, callbackRef };

			if (priority) this._priority = priority;

			if (longJob)
				this._longJob = {
					title: longJob
				};
		}

		this._context = new JobContext(this, contextOptions);

		JobStatistics.updateStats(
			this.getPath(),
			JobStatisticsType.CONSTRUCTED
		);
	}

	/**
	 * getName - Get job name
	 */
	public static getName() {
		return this.name.substring(0, 1).toLowerCase() + this.name.substring(1);
	}

	/**
	 * getName - Get job name
	 */
	public getName() {
		return (
			this.constructor.name.substring(0, 1).toLowerCase() +
			this.constructor.name.substring(1)
		);
	}

	/**
	 * getPath - Get module and job name in a dot format, e.g. module.jobName
	 */
	public getPath() {
		return `${this._module.getName()}.${this.getName()}`;
	}

	/**
	 * getPriority - Get job priority
	 *
	 * @returns priority
	 */
	public getPriority() {
		return this._priority;
	}

	/**
	 * getUuid - Get job UUID
	 *
	 * @returns UUID
	 */
	public getUuid() {
		return this._uuid;
	}

	/**
	 * getStatus - Get job status
	 *
	 * @returns status
	 */
	public getStatus() {
		return this._status;
	}

	/**
	 * setStatus - Set job status
	 *
	 * @param status - Job status
	 */
	protected _setStatus(status: JobStatus) {
		this._status = status;
	}

	/**
	 * getModule - Get module
	 *
	 * @returns module
	 */
	public getModule() {
		return this._module;
	}

	public static isApiEnabled() {
		return this._apiEnabled;
	}

	public isApiEnabled() {
		return (this.constructor as typeof Job)._apiEnabled;
	}

	protected async _validate() {}

	protected async _authorize() {
		await this._context.assertPermission(this.getPath());
	}

	protected abstract _execute(): Promise<unknown>;

	/**
	 * execute - Execute job
	 *
	 * @returns Promise
	 */
	public async execute() {
		if (this._startedAt) throw new Error("Job has already been executed.");

		if (!this.getModule().canRunJobs())
			throw new Error("Module can not currently run jobs.");

		this._setStatus(JobStatus.ACTIVE);
		this._startedAt = performance.now();

		try {
			await this._validate();

			await this._authorize();

			const data = await this._execute();

			const socketId = this._context.getSocketId();
			const callbackRef = this._context.getCallbackRef();

			if (callbackRef) {
				await EventsModule.publish(`job.${this.getUuid()}`, {
					socketId,
					callbackRef,
					status: "success",
					data
				});
			}

			this.log({
				message: "Job completed successfully",
				type: "success"
			});

			JobStatistics.updateStats(
				this.getPath(),
				JobStatisticsType.SUCCESSFUL
			);

			return data;
		} catch (error: unknown) {
			const message = getErrorMessage(error);

			const socketId = this._context.getSocketId();
			const callbackRef = this._context.getCallbackRef();

			if (callbackRef) {
				await EventsModule.publish(`job.${this.getUuid()}`, {
					socketId,
					callbackRef,
					status: "error",
					message
				});
			}

			this.log({
				message: `Job failed with error "${message}"`,
				type: "error",
				data: { error }
			});

			JobStatistics.updateStats(this.getPath(), JobStatisticsType.FAILED);

			throw error;
		} finally {
			this._completedAt = performance.now();
			JobStatistics.updateStats(this.getPath(), JobStatisticsType.TOTAL);
			if (this._startedAt)
				JobStatistics.updateStats(
					this.getPath(),
					JobStatisticsType.DURATION,
					this._completedAt - this._startedAt
				);
			this._setStatus(JobStatus.COMPLETED);
		}
	}

	/**
	 * Log a message in the context of the current job, which automatically sets the category and data
	 *
	 * @param log - Log message or object
	 */
	public log(log: string | Omit<Log, "timestamp" | "category">) {
		const {
			message,
			type = undefined,
			data = {}
		} = {
			...(typeof log === "string" ? { message: log } : log)
		};
		LogBook.log({
			message,
			type,
			category: this.getPath(),
			data: {
				...this.toJSON(),
				...data
			}
		});
	}

	/**
	 * Serialize job info
	 *
	 * @returns json
	 */
	public toJSON() {
		return {
			uuid: this.getUuid(),
			priority: this.getPriority(),
			name: this.getPath(),
			status: this.getStatus(),
			moduleStatus: this._module.getStatus(),
			createdAt: this._createdAt,
			startedAt: this._startedAt,
			completedAt: this._completedAt,
			payload: JSON.stringify(this._payload)
		};
	}
}
