const WebSocket = require("ws");

const PORT = process.env.PORT || 9000;

const server = new WebSocket.Server({
    host: "0.0.0.0",
    port: PORT
});

const clients = new Map();

let nextPlayerId = 1;

console.log(`Dungeon Crawler server running on port ${PORT}`);

server.on("connection", (socket) => {

    const playerId = nextPlayerId++;

    clients.set(socket, playerId);

    console.log(`Player ${playerId} connected`);

    // Tell the new player their ID
    socket.send(JSON.stringify({
        type: "welcome",
        id: playerId
    }));

    // Tell everyone about the new player
    for (const [client, id] of clients) {

        if (client.readyState === WebSocket.OPEN) {

            client.send(JSON.stringify({
                type: "player_joined",
                id: playerId
            }));
        }
    }

    // Send existing players to the new player
    for (const [client, id] of clients) {

        if (client !== socket && client.readyState === WebSocket.OPEN) {

            socket.send(JSON.stringify({
                type: "player_joined",
                id: id
            }));
        }
    }

    // Relay messages to everyone else
    socket.on("message", (message) => {

        for (const [client] of clients) {

            if (
                client !== socket &&
                client.readyState === WebSocket.OPEN
            ) {
                client.send(message);
            }
        }
    });

    socket.on("close", () => {

        console.log(`Player ${playerId} disconnected`);

        clients.delete(socket);

        for (const [client] of clients) {

            if (client.readyState === WebSocket.OPEN) {

                client.send(JSON.stringify({
                    type: "player_left",
                    id: playerId
                }));
            }
        }
    });
});