import { prisma } from '#lib/prisma.js';
import { broadcastToChannel, sendToUser, isUserActiveInChannel } from '../../../lib/socket.js';

export interface SendMessageInput {
  channelId: number;
  senderId: number;
  content: string;
  attachments?: any[];
}

const THROTTLE_WINDOW_MS = 30000; // 30초

export const sendMessageService = async (data: SendMessageInput) => {
  const { channelId, senderId, content, attachments } = data;

  if (!channelId) throw new Error('Channel ID is required');
  if (!senderId) throw new Error('Sender ID is required');
  if (!content || !content.trim()) throw new Error('Message content cannot be empty');

  // 1. 채널 정보 및 참여 멤버 목록 조회
  const channel = await prisma.chatChannel.findUnique({
    where: { id: channelId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!channel) throw new Error('Channel not found');

  // DM인 경우 참여자 체크
  if (channel.type === 'DM' && !channel.members.some((m) => m.userId === senderId)) {
    throw new Error('Unauthorized: You are not a member of this DM channel');
  }

  // GLOBAL 채널인데 아직 ChatMember로 등록되지 않은 유저인 경우 자동 멤버 등록
  let senderMember = channel.members.find((m) => m.userId === senderId);
  if (!senderMember) {
    senderMember = await prisma.chatMember.create({
      data: {
        channelId,
        userId: senderId,
        role: 'MEMBER',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // 2. 멘션 파싱 (@all 또는 @username / @userId)
  const isAllMention = content.includes('@all') || content.includes('@전체');
  const mentionUserIds: number[] = [];

  // 워크스페이스 유저 목록 기반 멘션 매칭
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  for (const u of allUsers) {
    if (u.id === senderId) continue;
    if (u.name && content.includes(`@${u.name}`)) {
      mentionUserIds.push(u.id);
    } else if (u.email && content.includes(`@${u.email.split('@')[0]}`)) {
      mentionUserIds.push(u.id);
    } else if (content.includes(`@${u.id}`)) {
      mentionUserIds.push(u.id);
    }
  }

  const hasMention = isAllMention || mentionUserIds.length > 0;
  const mentionsData = isAllMention ? '@all' : JSON.stringify(mentionUserIds);

  // 3. 메시지 DB 저장
  const savedMessage = await prisma.chatMessage.create({
    data: {
      channelId,
      senderId,
      content: content.trim(),
      attachments: attachments && attachments.length > 0 ? JSON.stringify(attachments) : null,
      mentions: mentionsData,
      hasMention,
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true, avatar: true, avatarColor: true, role: true },
      },
      reactions: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  // 발신자 본인의 lastReadAt 갱신
  await prisma.chatMember.updateMany({
    where: { channelId, userId: senderId },
    data: { lastReadAt: new Date() },
  });

  // 4. Socket.IO 채널 룸에 실시간 메시지 브로드캐스트
  const messagePayload = {
    id: savedMessage.id,
    channelId: savedMessage.channelId,
    senderId: savedMessage.senderId,
    sender: savedMessage.sender,
    content: savedMessage.content,
    attachments: attachments || [],
    mentions: isAllMention ? ['@all'] : mentionUserIds,
    hasMention: savedMessage.hasMention,
    isPinned: savedMessage.isPinned,
    isSystem: savedMessage.isSystem,
    reactions: [],
    createdAt: savedMessage.createdAt,
    updatedAt: savedMessage.updatedAt,
  };

  broadcastToChannel(channelId, 'chat:new_message', messagePayload);

  // 5. ⚡ 스마트 알림 스로틀러 엔진 (Smart Notification Throttler)
  const now = Date.now();
  const targetMembers = channel.type === 'GLOBAL'
    ? (await prisma.chatMember.findMany({ where: { channelId } }))
    : channel.members;

  for (const member of targetMembers) {
    if (member.userId === senderId) continue; // 발신자 제외

    // 1) 활성 방 유저는 알림 생략 (In-Room)
    if (isUserActiveInChannel(member.userId, channelId)) {
      continue;
    }

    // 2) 음소거 체크
    if (member.notificationLevel === 'MUTED') {
      if (!member.mutedUntil || new Date(member.mutedUntil).getTime() > now) {
        continue;
      }
    }

    // 3) 멘션 여부 및 쿨다운 판별
    const isDirectlyMentioned = isAllMention || mentionUserIds.includes(member.userId);

    if (member.notificationLevel === 'MENTIONS_ONLY' && !isDirectlyMentioned) {
      // 멘션 전용 모드인데 멘션이 없으면 생략
      continue;
    }

    const lastNotifiedAt = member.lastNotificationAt ? new Date(member.lastNotificationAt).getTime() : 0;
    const isCooldownElapsed = now - lastNotifiedAt >= THROTTLE_WINDOW_MS;

    // 알림 발송 조건: @멘션이거나 30초 쿨다운이 지난 경우
    if (isDirectlyMentioned || isCooldownElapsed) {
      // 알림 타임스탬프 갱신
      await prisma.chatMember.updateMany({
        where: { channelId, userId: member.userId },
        data: { lastNotificationAt: new Date(now) },
      });

      // 소켓 알림 디스패치
      sendToUser(member.userId, 'chat:notification', {
        channelId,
        channelName: channel.name,
        channelType: channel.type,
        senderName: savedMessage.sender.name || '알 수 없음',
        senderAvatar: savedMessage.sender.avatar,
        content: content.length > 80 ? content.slice(0, 80) + '...' : content,
        isMention: isDirectlyMentioned,
        timestamp: new Date(now),
      });
    }
  }

  return messagePayload;
};