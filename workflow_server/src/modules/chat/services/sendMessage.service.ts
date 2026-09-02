import { globalPrisma } from '#lib/globalPrisma.js';
import { broadcastToChannel } from '#lib/socket.js';

export interface SendMessageDTO {
  channelId: number;
  senderId: number;
  content: string;
  attachments?: any[];
}

export const sendMessageService = async (data: SendMessageDTO, customDb?: any) => {
  const { channelId, senderId, content, attachments } = data;
  const gdb = (customDb ?? globalPrisma) as any;

  if (!channelId || !senderId || !content?.trim()) {
    throw new Error('Channel ID, Sender ID, and Content are required');
  }

  // 1. 채널 및 멤버십 확인
  const channel = await gdb.chatChannel.findUnique({
    where: { id: channelId },
    include: { members: true },
  });

  if (!channel) throw new Error('Channel not found');

  const isMember = channel.members.some((m: any) => m.userId === senderId);
  if (!isMember) {
    if (channel.type === 'GLOBAL' || channel.type === 'GENERAL' || !channel.isPrivate) {
      await gdb.chatMember.create({
        data: { channelId, userId: senderId, role: 'MEMBER' },
      });
    } else {
      throw new Error('Unauthorized: You are not a member of this private channel');
    }
  }

  // 2. 멘션 파싱 (@유저명)
  const mentionMatches = content.match(/@([a-zA-Z0-9가-힣_]+)/g) || [];
  const mentionedNames = mentionMatches.map((m) => m.substring(1));
  const hasMention = mentionedNames.length > 0;

  let mentions: number[] = [];
  if (hasMention) {
    const mentionedUsers = await gdb.user.findMany({
      where: { name: { in: mentionedNames } },
      select: { id: true },
    });
    mentions = mentionedUsers.map((u: any) => u.id);
  }

  // 3. 메시지 생성
  const message = await gdb.chatMessage.create({
    data: {
      channelId,
      senderId,
      content: content.trim(),
      attachments: attachments ? JSON.stringify(attachments) : null,
    },
    include: {
      sender: {
        select: { id: true, name: true, avatar: true, avatarColor: true },
      },
      reactions: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  // 4. 발신자 마지막 읽음 시간 갱신
  await gdb.chatMember.updateMany({
    where: { channelId, userId: senderId },
    data: { lastReadAt: new Date() },
  });

  // 5. 실시간 소켓 브로드캐스트
  broadcastToChannel(channelId, 'new_message', {
    channelId,
    message: { ...message, hasMention, mentionedNames, mentions },
  });

  return {
    ...message,
    hasMention,
    mentionedNames,
    mentions,
  };
};
