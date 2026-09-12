import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { RoomManager } from './domain/room/RoomManager.js';
import { setupSockets } from './sockets/index.js';
import { authRouter } from './http/routes/auth.js';
import { createRoomsRouter } from './http/routes/rooms.js';
import type { AppServer } from './sockets/types.js';

const app = express();
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

const roomManager = new RoomManager();

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/rooms', createRoomsRouter(roomManager));

const httpServer = createServer(app);
const io: AppServer = new Server(httpServer, {
  cors: { origin: env.clientOrigin },
});

setupSockets(io, roomManager);

httpServer.listen(env.port, () => {
  console.log(`[server] listening on :${env.port}`);
});
