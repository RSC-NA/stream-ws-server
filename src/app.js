import { WebSocket, WebSocketServer } from "ws";

const http = require("http");
const fs = require("fs");

// windows for local testing; go ahead and judge
const path = process.platform === "win32" ? "C:\\Users\\kj\\Development\\rlcert\\" : "/home/kj767/rlcert/";
console.log(process.cwd());

try {

const server = http.createServer();

const wss = new WebSocketServer({
	server,
});

let connections = {};

wss.on("connection", function connection(ws) {
	console.log("connection received");
	ws.on("error", console.error);

	let connectionId = (+ new Date()).toString();
	connections[connectionId] = {
		connection: ws,
		registeredClients: [],
	}

	ws.on("message", function message(msg) {
		// console.log("received: %s", msg);

		try {
			const dataParse = JSON.parse(msg)
			const clientIndex = connections[connectionId].registeredClients.map((client) => client.clientId).indexOf(dataParse.clientId);

			if (dataParse.hasOwnProperty("event") && dataParse.hasOwnProperty("clientId") && dataParse.hasOwnProperty("data")) {

				// register
				if (dataParse.event === "register" && typeof(dataParse.data) === "string") {
					if (clientIndex === -1) {
						connections[connectionId].registeredClients.push({
							clientId: dataParse.clientId,
							subscriptions: [dataParse.data],
						});
					} else if (connections[connectionId].registeredClients[clientIndex].subscriptions.indexOf(dataParse.data) === -1) {
						connections[connectionId].registeredClients[clientIndex].subscriptions.push(dataParse.data);
					}
				}

				// unregister
				if (dataParse.event === "unregister" && clientIndex > -1  && typeof(dataParse.data) === "string") {
					const subscriptionIndex = connections[connectionId].registeredClients[clientIndex].subscriptions.indexOf(dataParse.data);
					if (subscriptionIndex > -1) {
						if (connections[connectionId].registeredClients[clientIndex].subscriptions.length === 1) {
							connections[connectionId].registeredClients.splice(clientIndex, 1);
						} else {
							connections[connectionId].registeredClients[clientIndex].subscriptions.splice(subscriptionIndex, 1);
						}
					}
				}


				// received message, send to subscribers
				if (dataParse.event !== "register" && dataParse.event !=="unregister" && dataParse.hasOwnProperty("data")) {
					for (let c in connections) {
						if (connectionId === c) {
							continue;
						}
						if (!connections.hasOwnProperty(c)) {
							continue;
						}

						const cIndex = connections[c].registeredClients.map((client) => client.clientId).indexOf(dataParse.clientId);

						if (cIndex === -1) {
							continue;
						}
						if (!connections[c].registeredClients[cIndex].hasOwnProperty("subscriptions")) {
							continue;
						}

						if (cIndex > -1 && connections[c].registeredClients[cIndex].subscriptions.indexOf(dataParse.event) > -1) {
							setTimeout(() => {
								connections[c].connection.send(JSON.stringify(dataParse));
							}, 0);
						}
					}
				}

			}

		} catch(e) {
			console.error(e);
			return;
		}

	});

});

server.listen(8321, function listening() {

	const ws = new WebSocket(`ws://localhost:${server.address().port}`, {
	  rejectUnauthorized: false
	});

	ws.on("error", console.error);

	ws.on("open", function open() {
		// console.log("cool", server.address().port);
	});

});


} catch (err) {
	console.log(err);
}
