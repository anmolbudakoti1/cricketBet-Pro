import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import betRoutes from './routes/bets.js';
import walletRoutes from './routes/wallet.js';
import adminRoutes from './routes/admin.js';
import { initializeMatches, updateLiveMatches } from './services/matchSimulator.js';
import { broadcastToAll } from './services/websocket.js';

const app = express();
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Store WebSocket connections
global.wsConnections = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  global.wsConnections.add(ws);
  
  ws.on('close', () => {
    global.wsConnections.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    global.wsConnections.delete(ws);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize mock data and start simulators
initializeMatches();

// Update live matches every 5 seconds
setInterval(() => {
  updateLiveMatches();
}, 5000);

// Update odds every 15 seconds
setInterval(() => {
  broadcastToAll({
    type: 'ODDS_UPDATE',
    data: { timestamp: Date.now() }
  });
}, 15000);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}/ws`);
});