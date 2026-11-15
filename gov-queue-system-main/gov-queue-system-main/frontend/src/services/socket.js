import { io } from 'socket.io-client';

const socket = io('/', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
});

socket.on('connect', () => {
  console.log('[SocketClient] Connected to server with ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('[SocketClient] Disconnected from server');
});

export default socket;
