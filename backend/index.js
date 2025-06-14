const express = require('express');
const cors = require("cors");
const http = require('http');
const WebSocket = require('ws');
const rootRouter = require("./routes/index");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use("/api/v1", rootRouter);
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

// Add a simple test route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// WebSocket server setup with more logging
const wss = new WebSocket.Server({
    server,
    path: '/ws'
});

console.log('WebSocket server created on path /ws');

wss.on('connection', (ws, req) => {
    console.log('✅ New WebSocket connection established');
    console.log('Client IP:', req.socket.remoteAddress);

    ws.send('Connected to WebSocket server');

    ws.on('message', (message) => {
        console.log('📩 Received message:', message.toString());
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log('❌ WebSocket connection closed');
    });

    ws.on('error', (error) => {
        console.error('🚫 WebSocket error:', error);
    });
});

wss.on('error', (error) => {
    console.error('🚫 WebSocket Server error:', error);
});

server.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
    console.log("🔌 WebSocket available at ws://localhost:3000/ws");
});

server.on('error', (error) => {
    console.error('🚫 Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error('Port 3000 is already in use!');
    }
});
