import { ModuleStatus } from "./BaseModule";
import JobQueue from "./JobQueue";
import { Modules, ModuleClass } from "./types/Modules";

export default class ModuleManager {
	static primaryInstance = new this();

	private _modules?: Modules;

	/**
	 * getStatus - Get status of modules
	 *
	 * @returns Module statuses
	 */
	public getStatus() {
		const status: Record<string, ModuleStatus> = {};
		Object.entries(this._modules || {}).forEach(([name, module]) => {
			status[name] = module.getStatus();
		});
		return status;
	}

	/**
	 * Gets a module
	 *
	 */
	public getModule(moduleName: keyof Modules) {
		return this._modules && this._modules[moduleName];
	}

	/**
	 * loadModule - Load and initialize module
	 *
	 * @param moduleName - Name of the module
	 * @returns Module
	 */
	private async _loadModule<T extends keyof Modules>(moduleName: T) {
		const mapper = {
			api: "APIModule",
			data: "DataModule",
			events: "EventsModule",
			stations: "StationModule",
			websocket: "WebSocketModule"
		};
		const { default: Module }: { default: ModuleClass<Modules[T]> } =
			await import(`./modules/${mapper[moduleName]}`);
		return new Module();
	}

	/**
	 * loadModules - Load and initialize all modules
	 *
	 * @returns Promise
	 */
	private async _loadModules() {
		this._modules = {
			api: await this._loadModule("api"),
			data: await this._loadModule("data"),
			events: await this._loadModule("events"),
			stations: await this._loadModule("stations"),
			websocket: await this._loadModule("websocket")
		};
	}

	/**
	 * startModule - Start module
	 */
	private async _startModule(module: Modules[keyof Modules]) {
		switch (module.getStatus()) {
			case ModuleStatus.STARTING:
			case ModuleStatus.STARTED:
				return;
			case ModuleStatus.ERROR:
				throw new Error("Dependent module failed to start");
			case ModuleStatus.STOPPING:
			case ModuleStatus.STOPPED:
			case ModuleStatus.DISABLED:
				throw new Error("Dependent module is unavailable");
			default:
				break;
		}

		for (const name of module.getDependentModules()) {
			const dependency = this.getModule(name);

			if (!dependency) throw new Error("Dependent module not found");

			// eslint-disable-next-line no-await-in-loop
			await this._startModule(dependency);
		}

		await module.startup().catch(async err => {
			module.setStatus(ModuleStatus.ERROR);
			throw err;
		});
	}

	/**
	 * getJobs - Get jobs for all modules
	 */
	public getJobs() {
		if (!this._modules) return [];

		return Object.fromEntries(
			Object.entries(this._modules).map(([name, module]) => [
				name,
				module.getJobs()
			])
		);
	}

	/**
	 * startup - Handle startup
	 */
	public async startup() {
		try {
			await this._loadModules();

			if (!this._modules) throw new Error("No modules were loaded");

			for (const module of Object.values(this._modules)) {
				// eslint-disable-next-line no-await-in-loop
				await this._startModule(module);
			}

			JobQueue.getPrimaryInstance().resume();
		} catch (err) {
			await this.shutdown();
			throw err;
		}
	}

	/**
	 * shutdown - Handle shutdown
	 */
	public async shutdown() {
		if (this._modules) {
			const modules = Object.entries(this._modules).filter(([, module]) =>
				[
					ModuleStatus.STARTED,
					ModuleStatus.STARTING,
					ModuleStatus.ERROR
				].includes(module.getStatus())
			);

			const shutdownOrder: (keyof Modules)[] = [];

			for (const [name, module] of modules) {
				if (!shutdownOrder.includes(name)) shutdownOrder.push(name);

				const dependencies = module.getDependentModules();

				dependencies
					.filter(dependency => shutdownOrder.includes(dependency))
					.forEach(dependency => {
						shutdownOrder.splice(
							shutdownOrder.indexOf(dependency),
							1
						);
					});

				shutdownOrder.push(...dependencies);
			}

			for (const moduleName of shutdownOrder) {
				// eslint-disable-next-line no-await-in-loop
				await this.getModule(moduleName)?.shutdown();
			}
		}
	}

	static getPrimaryInstance(): ModuleManager {
		return this.primaryInstance;
	}

	static setPrimaryInstance(instance: ModuleManager) {
		this.primaryInstance = instance;
	}
}
