import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';
import https from 'https';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;

// Key: userId -> Set<socketId> (사용자의 연결된 소켓들)
const userSocketsMap = new Map<number, Set<string>>();

// Key: socketId -> userId
const socketUserMap = new Map<string, number>();

// Key: socketId -> Set<channelId> (소켓이 현재 활성 구독 중인 채널 룸들)
const socketActiveChannelsMap = new Map<string, Set<number>>();

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';

export const initSocketServer = (server: http.Server | https.Server): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT 인증 미들웨어
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      (socket as any).userId = decoded.userId || decoded.id;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as number;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // 유저 소켓 매핑 등록
    socketUserMap.set(socket.id, userId);
    const existing = userSocketsMap.get(userId) || new Set();
    existing.add(socket.id);
    userSocketsMap.set(userId, existing);
    socketActiveChannelsMap.set(socket.id, new Set());

    // 개인 유저 룸 조인 (개인 알림 수신용)
    socket.join(`user_${userId}`);

    // 온라인 상태 브로드캐스트
    io?.emit('presence:update', { userId, status: 'ONLINE' });

    // 채널 룸 입장 (In-Room)
    socket.on('chat:join_channel', (payload: any) => {
      const channelId = typeof payload === 'object' && payload !== null ? Number(payload.channelId) : Number(payload);
      if (!channelId || isNaN(channelId)) return;
      const roomName = `channel_${channelId}`;
      socket.join(roomName);
      socketActiveChannelsMap.get(socket.id)?.add(channelId);
    });

    // 채널 룸 퇴장
    socket.on('chat:leave_channel', (payload: any) => {
      const channelId = typeof payload === 'object' && payload !== null ? Number(payload.channelId) : Number(payload);
      if (!channelId || isNaN(channelId)) return;
      const roomName = `channel_${channelId}`;
      socket.leave(roomName);
      socketActiveChannelsMap.get(socket.id)?.delete(channelId);
    });

    // 실시간 타이핑 인디케이터
    socket.on('chat:typing', (data: any) => {
      const channelId = typeof data === 'object' && data !== null ? Number(data.channelId) : Number(data);
      if (!channelId || isNaN(channelId)) return;
      socket.to(`channel_${channelId}`).emit('chat:user_typing', {
        channelId,
        userId,
        userName: data?.userName,
      });
    });

    socket.on('chat:stop_typing', (data: any) => {
      const channelId = typeof data === 'object' && data !== null ? Number(data.channelId) : Number(data);
      if (!channelId || isNaN(channelId)) return;
      socket.to(`channel_${channelId}`).emit('chat:user_stop_typing', {
        channelId,
        userId,
      });
    });

    // 연결 종료
    socket.on('disconnect', () => {
      socketUserMap.delete(socket.id);
      socketActiveChannelsMap.delete(socket.id);

      const userSockets = userSocketsMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketsMap.delete(userId);
          // 오프라인 상태 브로드캐스트
          io?.emit('presence:update', { userId, status: 'OFFLINE' });
        }
      }
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

/**
 * 특정 채널 룸에 실시간 이벤트 브로드캐스트
 */
export const broadcastToChannel = (channelId: number, event: string, payload: any) => {
  if (!io) return;
  io.to(`channel_${channelId}`).emit(event, payload);
};

/**
 * 특정 유저 개인에게 실시간 이벤트 전송
 */
export const sendToUser = (userId: number, event: string, payload: any) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, payload);
};

/**
 * 🌐 전역 전체 연결 클라이언트에게 실시간 이벤트 브로드캐스트
 */
export const broadcastGlobal = (event: string, payload: any) => {
  if (!io) return;
  io.emit(event, payload);
};

/**
 * 특정 사용자가 현재 특정 채널을 실시간으로 보고 있는지(In-Room 활성 상태) 확인
 */
export const isUserActiveInChannel = (userId: number, channelId: number): boolean => {
  const socketIds = userSocketsMap.get(userId);
  if (!socketIds || socketIds.size === 0) return false;

  for (const sId of socketIds) {
    const channels = socketActiveChannelsMap.get(sId);
    if (channels && channels.has(Number(channelId))) {
      return true;
    }
  }
  return false;
};