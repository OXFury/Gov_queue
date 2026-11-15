const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const initQueueSocket = require('./sockets/queueSocket');
const Token = require('./models/Token');
const seedData = require('./seed');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const counterRoutes = require('./routes/counterRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
});

// Store io reference in Express app
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Attach Sockets
initQueueSocket(io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', system: 'Gov Queue Management Server', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  // Auto-seed if database has no tokens yet
  const tokenCount = await Token.countDocuments();
  if (tokenCount === 0) {
    console.log('[Server] Fresh database detected. Running automatic seed data populator...');
    await seedData();
  }

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Government Digital Queue Server is Running!`);
    console.log(`🌐 HTTP API: http://localhost:${PORT}/api/health`);
    console.log(`⚡ Socket.io Real-Time Layer Attached`);
    console.log(`=======================================================`);
  });
}

startServer();
