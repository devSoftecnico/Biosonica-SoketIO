const net = require("net");

const options = {
  port: 4000,
  host: "127.0.0.1"
};

const client = net.createConnection(options);
client.on("connect", () => {
  console.log("Cliente connectado al servidor");
  client.write("Hola desde el cliente!");
});

client.on("error", err => {
  console.error("Error en el cliente:", err.message);
});
