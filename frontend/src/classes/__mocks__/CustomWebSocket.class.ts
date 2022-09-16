import ListenerHandler from "@/classes/ListenerHandler.class";

export default class CustomWebSocketMock {
	dispatcher: ListenerHandler;

	url: string;

	data: {
		dispatch?: {
			[key: string]: (...args: any[]) => any;
		};
		progress?: {
			[key: string]: (...args: any[]) => any;
		};
		on?: {
			[key: string]: any;
		};
	};

	onDisconnectCbs: {
		temp: any[];
		persist: any[];
	};

	executeDispatch: boolean;

	constructor(url) {
		this.dispatcher = new ListenerHandler();
		this.url = url;
		this.data = {
			dispatch: {},
			progress: {},
			on: {}
		};
		this.onDisconnectCbs = {
			temp: [],
			persist: []
		};
		this.executeDispatch = true;
	}

	on(target, cb, options?) {
		const onData = this.data.on && this.data.on[target];
		this.dispatcher.addEventListener(
			`on.${target}`,
			event => cb(event.detail() || onData),
			options
		);
	}

	dispatch(target, ...args) {
		const lastArg = args[args.length - 1];
		const _args = args.slice(0, -1);
		const dispatchData = () =>
			this.data.dispatch &&
			typeof this.data.dispatch[target] === "function"
				? this.data.dispatch[target](..._args)
				: undefined;
		const progressData = () =>
			this.data.progress &&
			typeof this.data.progress[target] === "function"
				? this.data.progress[target](..._args)
				: undefined;

		if (typeof lastArg === "function") {
			if (this.executeDispatch && dispatchData()) lastArg(dispatchData());
			else if (!this.executeDispatch)
				this.dispatcher.addEventListener(
					`dispatch.${target}`,
					event => lastArg(event.detail(..._args) || dispatchData()),
					false
				);
		} else if (typeof lastArg === "object") {
			if (this.executeDispatch) {
				if (progressData())
					progressData().forEach(data => {
						lastArg.onProgress(data);
					});
				if (dispatchData()) lastArg.cb(dispatchData());
			} else {
				this.dispatcher.addEventListener(
					`progress.${target}`,
					event => {
						if (event.detail(..._args))
							lastArg.onProgress(event.detail(..._args));
						else if (progressData())
							progressData().forEach(data => {
								lastArg.onProgress(data);
							});
					},
					false
				);
				this.dispatcher.addEventListener(
					`dispatch.${target}`,
					event =>
						lastArg.cb(event.detail(..._args) || dispatchData()),
					false
				);
			}
		}
	}

	// eslint-disable-next-line class-methods-use-this
	onConnect(cb) {
		cb();
	}

	onDisconnect(...args) {
		if (args[0] === true) this.onDisconnectCbs.persist.push(args[1]);
		else this.onDisconnectCbs.temp.push(args[0]);

		this.dispatcher.addEventListener(
			"socket.disconnect",
			() => {
				this.onDisconnectCbs.temp.forEach(cb => cb());
				this.onDisconnectCbs.persist.forEach(cb => cb());
			},
			false
		);
	}

	clearCallbacks() {
		this.onDisconnectCbs.temp = [];
	}

	// eslint-disable-next-line class-methods-use-this
	destroyModalListeners() {}

	trigger(type, target, data?) {
		this.dispatcher.dispatchEvent(
			new CustomEvent(`${type}.${target}`, {
				detail: (...args) => {
					if (typeof data === "function") return data(...args);
					if (typeof data === "undefined") return undefined;
					return JSON.parse(JSON.stringify(data));
				}
			})
		);
	}
}
