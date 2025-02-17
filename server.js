require('dotenv').config();
const net = require("net");
const admin = require("./firebase-config");
const express = require('express');
const cors = require('cors');
const { swaggerUi, specs } = require('./swagger');
const WebSocket = require('ws');

const port = process.env.PORT || 4000;
const app = express();

// Enable CORS for all routes
app.use(cors());

// Enable JSON parsing
app.use(express.json());

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on('connection', async (ws) => {
  console.log("Nuevo cliente conectado");

  ws.on('message', async (data) => {
    try {
      const authData = JSON.parse(data);
      console.log("Datos recibidos:", authData);

      if (authData.type === "google_signin" && authData.idToken) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(authData.idToken);
          console.log(`Usuario autenticado: ${decodedToken.name || decodedToken.email}`);
          
          ws.send(JSON.stringify({
            status: "success",
            message: "Autenticación exitosa",
            user: {
              uid: decodedToken.uid,
              email: decodedToken.email,
              name: decodedToken.name
            }
          }));
        } catch (authError) {
          console.error("Error al verificar el token:", authError);
          ws.send(JSON.stringify({
            status: "error",
            message: "Error de autenticación: Token inválido",
            error: authError.message
          }));
        }
      } else {
        ws.send(JSON.stringify({
          status: "error",
          message: "Solicitud inválida: Se requiere tipo 'google_signin' y token ID"
        }));
      }
    } catch (error) {
      console.error("Error al procesar los datos:", error);
      ws.send(JSON.stringify({
        status: "error",
        message: "Error al procesar los datos"
      }));
    }
  });

  ws.on('close', () => {
    console.log("Cliente desconectado");
  });

  ws.on('error', (err) => {
    console.error("Error en el WebSocket:", err.message);
  });
});

// Create HTTP server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});

// Handle upgrade requests for WebSocket
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
