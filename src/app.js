import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8321 });

let connections = {};

wss.on("connection", function connection(ws) {
	ws.on("error", console.error);

	let connectionId = (+ new Date()).toString();
	connections[connectionId] = {
		connection: ws,
		registeredClients: [],
	}

	ws.on("message", function message(msg) {
		// console.log('received: %s', msg);

		try {
			const dataParse = JSON.parse(msg)
			if (dataParse.hasOwnProperty("event") && dataParse.hasOwnProperty("clientId")) {
				if (dataParse.event === "register" && connections[connectionId].registeredClients.indexOf(dataParse.clientId) < 0) {
					connections[connectionId].registeredClients.push(dataParse.clientId);
				}
				if (dataParse.event === "unregister" && connections[connectionId].registeredClients.indexOf(dataParse.clientId) > -1) {
					connections[connectionId.registeredClients.splice(connections[connectionId].registeredClients.indexOf(dataParse.clientId), 1)];
				}
				if (dataParse.event === "update" && dataParse.hasOwnProperty("data") && connections[connectionId].registeredClients.indexOf(dataParse.clientId) > -1) {
					for (let c in connections) {
						if (connectionId === c) {
							continue;
						}
						if (!connections.hasOwnProperty(c)) {
							continue;
						}
						if (connections[c].registeredClients.indexOf(dataParse.clientId) > -1) {
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
