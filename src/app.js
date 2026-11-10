import { WebSocketServer, WebSocket } from "ws";

const HEARTBEAT_MS = 30_000;

const wss = new WebSocketServer({ port: 8321 });

// socket -> { alive, subscriptions: clientId -> Set<event name> }
const sockets = new Map();

wss.on("connection", (ws) => {
	console.log("connection received");
	const state = { alive: true, subscriptions: new Map() };
	sockets.set(ws, state);

	ws.on("error", console.error);
	ws.on("pong", () => { state.alive = true; });
	ws.on("close", () => { sockets.delete(ws); });

	ws.on("message", (raw) => {
		let message;
		try {
			message = JSON.parse(raw);
		} catch (e) {
			console.error(e);
			return;
		}
		const { clientId, event, data } = message ?? {};
		if (clientId === undefined || event === undefined || data === undefined) {
			return;
		}

		if (event === "register") {
			if (typeof data === "string") {
				const events = state.subscriptions.get(clientId) ?? new Set();
				events.add(data);
				state.subscriptions.set(clientId, events);
			}
			return;
		}

		if (event === "unregister") {
			const events = state.subscriptions.get(clientId);
			events?.delete(data);
			if (events?.size === 0) {
				state.subscriptions.delete(clientId);
			}
			return;
		}

		const text = JSON.stringify(message);
		for (const [other, { subscriptions }] of sockets) {
			if (other !== ws && other.readyState === WebSocket.OPEN && subscriptions.get(clientId)?.has(event)) {
				other.send(text);
			}
		}
	});
});

setInterval(() => {
	for (const [ws, state] of sockets) {
		if (!state.alive) {
			ws.terminate();
			continue;
		}
		state.alive = false;
		ws.ping();
	}
}, HEARTBEAT_MS);
