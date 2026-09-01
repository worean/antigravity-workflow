import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { createChannelService } from '../modules/chat/services/createChannel.service.js';
import { sendMessageService } from '../modules/chat/services/sendMessage.service.js';
import { toggleReactionService } from '../modules/chat/services/toggleReaction.service.js';
import { markAsReadService } from '../modules/chat/services/markAsRead.service.js';

describe('💬 [Chat: Reactions & MarkAsRead] Unit Tests', () => {
  let user1: any;
  let user2: any;
  let channel: any;
  let message: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 9) + Date.now();
    user1 = await createUserService({
      email: 'react_user1_' + rand + '@test.com',
      name: 'Charlie',
      password: 'password123'
    });

    user2 = await createUserService({
      email: 'react_user2_' + rand + '@test.com',
      name: 'David',
      password: 'password123'
    });

    channel = await createChannelService({
      name: '리액션 테스트 채널',
      type: 'GLOBAL',
      userId: user1.id,
    });

    message = await sendMessageService({
      channelId: channel.id,
      senderId: user1.id,
      content: '리액션을 달아주세요 👍',
    });
  });

  it('1. 이모지 반응을 추가하면 리액션 카운트가 1이 되어야 합니다.', async () => {
    const res = await toggleReactionService(message.id, user2.id, '👍');
    expect(res.action).toBe('ADDED');
    expect(res.emoji).toBe('👍');
    expect(res.reactions.length).toBe(1);
    expect(res.reactions[0].count).toBe(1);
  });

  it('2. 동일한 이모지 반응을 다시 누르면 삭제(토글)되어야 합니다.', async () => {
    await toggleReactionService(message.id, user2.id, '❤️');
    const toggleRes = await toggleReactionService(message.id, user2.id, '❤️');

    expect(toggleRes.action).toBe('REMOVED');
    expect(toggleRes.reactions.length).toBe(0);
  });

  it('3. markAsReadService 호출 시 lastReadAt이 현재 시각으로 갱신되어야 합니다.', async () => {
    const res = await markAsReadService(channel.id, user2.id);
    expect(res.success).toBe(true);

    const member = await prisma.chatMember.findUnique({
      where: { channelId_userId: { channelId: channel.id, userId: user2.id } },
    });
    expect(member?.lastReadAt).toBeDefined();
  });
});