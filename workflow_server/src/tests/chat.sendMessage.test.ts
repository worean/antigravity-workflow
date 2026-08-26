// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { createChannelService } from '../modules/chat/services/createChannel.service.js';
import { sendMessageService } from '../modules/chat/services/sendMessage.service.js';
import { getMessagesService } from '../modules/chat/services/getMessages.service.js';
import { updateMemberSettingsService } from '../modules/chat/services/updateMemberSettings.service.js';

describe('💬 [Chat: sendMessage & Smart Throttler] Unit Tests', () => {
  let user1: any;
  let user2: any;
  let channel: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 9) + Date.now();
    user1 = await createUserService({
      email: 'send_user1_' + rand + '@test.com',
      name: 'Alice',
      password: 'password123'
    });

    user2 = await createUserService({
      email: 'send_user2_' + rand + '@test.com',
      name: 'Bob',
      password: 'password123'
    });

    channel = await createChannelService({
      name: '테스트 대화방',
      type: 'GLOBAL',
      userId: user1.id,
    });

    // user2도 채널 멤버로 등록
    await prisma.chatMember.create({
      data: {
        channelId: channel.id,
        userId: user2.id,
        role: 'MEMBER',
      },
    });
  });

  it('1. 일반 메시지 전송 및 조회가 성공해야 합니다.', async () => {
    const msg = await sendMessageService({
      channelId: channel.id,
      senderId: user1.id,
      content: '안녕하세요! 첫 메시지입니다.',
    });

    expect(msg.content).toBe('안녕하세요! 첫 메시지입니다.');
    expect(msg.hasMention).toBe(false);

    const history = await getMessagesService(channel.id, user1.id, {});
    expect(history.messages.length).toBe(1);
    expect(history.messages[0].content).toBe('안녕하세요! 첫 메시지입니다.');
  });

  it('2. @멘션이 포함된 경우 hasMention이 true로 설정되고 멘션 유저가 식별되어야 합니다.', async () => {
    const msg = await sendMessageService({
      channelId: channel.id,
      senderId: user1.id,
      content: `@Bob 긴급 확인 부탁드립니다!`,
    });

    expect(msg.hasMention).toBe(true);
    expect(msg.mentions).toContain(user2.id);
  });

  it('3. 음소거(MUTED) 설정된 유저에게는 알림 타임스탬프가 갱신되지 않아야 합니다.', async () => {
    // user2를 MUTED로 설정
    await updateMemberSettingsService({
      channelId: channel.id,
      userId: user2.id,
      notificationLevel: 'MUTED',
    });

    await sendMessageService({
      channelId: channel.id,
      senderId: user1.id,
      content: '일반 공지 메시지입니다.',
    });

    const member2 = await prisma.chatMember.findUnique({
      where: { channelId_userId: { channelId: channel.id, userId: user2.id } },
    });

    // MUTED 상태이므로 알림이 억제되어 lastNotificationAt이 null 유지
    expect(member2?.lastNotificationAt).toBeNull();
  });
});