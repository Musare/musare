import DataModule, { DataModuleJobs } from "../modules/DataModule";
import EventsModule, { EventsModuleJobs } from "../modules/EventsModule";
import StationModule, { StationModuleJobs } from "../modules/StationModule";
import WebSocketModule, {
	WebSocketModuleJobs
} from "../modules/WebSocketModule";
import BaseModule from "../BaseModule";

export type Module = BaseModule;

export type ModuleClass<Module extends typeof BaseModule> = {
	new (): Module;
};

export type Jobs = {
	data: {
		[Property in keyof DataModuleJobs]: DataModuleJobs[Property];
	};
	events: {
		[Property in keyof EventsModuleJobs]: EventsModuleJobs[Property];
	};
	stations: {
		[Property in keyof StationModuleJobs]: StationModuleJobs[Property];
	};
	websocket: {
		[Property in keyof WebSocketModuleJobs]: WebSocketModuleJobs[Property];
	};
};

export type Modules = {
	data: DataModule & typeof BaseModule;
	events: EventsModule & typeof BaseModule;
	stations: StationModule & typeof BaseModule;
	websocket: WebSocketModule & typeof BaseModule;
};

export type Methods<T> = {
	[P in keyof T as T[P] extends (...args: any) => Awaited<any>
		? P
		: never]: T[P];
};

export type UniqueMethods<T> = Methods<Omit<T, keyof BaseModule>>;