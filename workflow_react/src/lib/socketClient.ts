// -*- coding: utf-8 -*-
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const getSocket = (token?: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const authToken = token || localStorage.getItem('token') || '';

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: authToken,
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  } else {
    socket.auth = { token: authToken };
  }

  if (!socket.connected && authToken) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};