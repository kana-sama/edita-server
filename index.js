const io = require("socket.io");

const server = io();
const clients = new Map();
let nextClientId = 0;

server.on("connection", socket => {
  const clientId = nextClientId++;
  clients.set(clientId, socket);

  socket.on("disconnect", () => clients.delete(clientId));

  if (clients.size === 1) {
    socket.emit("init", { clientId });
  } else {
    const [_, otherClient] = Array.from(clients.entries()).find(
      ([id, _]) => id !== clientId
    );

    otherClient.once("get-chars", chars => {
      socket.emit("init", { clientId, chars });
    });

    otherClient.emit("get-chars");
  }

  socket.on("op", op => {
    for (const [id, client] of clients.entries()) {
      if (id !== clientId) {
        console.log("send", op.char.value, "to", id, "from", clientId);
        client.emit("op", op);
      }
    }
  });
});

server.listen(3001);
