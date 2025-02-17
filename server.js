require('dotenv').config();
const net = require("net");
const admin = require("./firebase-config");
const express = require('express');
const cors = require('cors');
const { swaggerUi, specs } = require('./swagger');

const port = process.env.PORT || 4000;
const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Start Express server for Swagger docs
app.listen(process.env.SWAGGER_PORT, () => {
  console.log(`Swagger documentation available at http://${process.env.HOST}:${process.env.SWAGGER_PORT}/api-docs`);
});

const server = net.createServer();

server.on("connection", socket => {
  console.log("Nuevo cliente conectado");

  socket.on("data", async data => {
    const rawData = data.toString();
    
    // Check if the data looks like an HTTP request
    if (rawData.match(/^(GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE|CONNECT) /)) {
      console.log("Received HTTP request instead of raw TCP data");
      socket.write(
        JSON.stringify({
          status: "error",
          message: "This is a TCP socket server, not an HTTP server. Please use raw TCP connection."
        })
      );
      return;
    }

    try {
      const authData = JSON.parse(rawData);
      console.log("Datos recibidos:", authData);

      if (authData.type === "google_signin" && authData.idToken) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(authData.idToken);
          console.log(`Usuario autenticado: ${decodedToken.name || decodedToken.email}`);
          
          socket.write(
            JSON.stringify({
              status: "success",
              message: "Autenticación exitosa",
              user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name
              }
            })
          );
        } catch (authError) {
          console.error("Error al verificar el token:", authError);
          socket.write(
            JSON.stringify({
              status: "error",
              message: "Error de autenticación: Token inválido",
              error: authError.message
            })
          );
        }
      } else {
        socket.write(
          JSON.stringify({
            status: "error",
            message: "Solicitud inválida: Se requiere tipo 'google_signin' y token ID"
          })
        );
      }
    } catch (error) {
      console.error("Error al procesar los datos:", error);
      socket.write(
        JSON.stringify({
          status: "error",
          message: "Error al procesar los datos"
        })
      );
    }
  });

  socket.on("close", () => {
    console.log("Cliente desconectado");
  });

  socket.on("error", err => {
    console.error("Error en el socket:", err.message);
  });
});

server.listen(process.env.PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
