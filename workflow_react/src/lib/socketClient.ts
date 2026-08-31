// -*- coding: utf-8 -*-
import { io, Socket } from 'socket.io-client';
import { getCurrentBackendHostUrl } from './apiClient';
import { prefRepository } from './prefRepository';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  const authToken = token || prefRepository.authToken || '';

  const hostUrl = typeof window !== 'undefined' ? getCurrentBackendHostUrl() : 'http://localhost:4000';

  if (!socket) {
    socket = io(hostUrl, {
      auth: {
        token: authToken,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🟢 [Socket.IO] Connected successfully:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.IO] Connection error:', err.message);
    });
  } else {
    socket.auth = { token: authToken };
    if (!socket.connected && authToken) {
      socket.connect();
    }
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};