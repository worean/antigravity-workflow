// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { createProjectService } from '../modules/projects/services/createProject.service.js';
import { getChannelsService } from '../modules/chat/services/getChannels.service.js';
import { createChannelService } from '../modules/chat/services/createChannel.service.js';

describe('💬 [Chat: getChannels] Unit Tests', () => {
  let user1: any;
  let user2: any;
  let project: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 9) + Date.now();
    user1 = await createUserService({
      email: 'chat_user1_' + rand + '@test.com',
      name: 'Chat Tester 1',
      password: 'password123'
    });

    user2 = await createUserService({
      email: 'chat_user2_' + rand + '@test.com',
      name: 'Chat Tester 2',
      password: 'password123'
    });

    project = await createProjectService(
      {
        name: 'Chat Test Project',
        key: ('CHAT_' + rand).substring(0, 20).toUpperCase(),
      },
      user1.id
    );
  });

  it('1. 기본 GLOBAL 채널들이 조회되어야 합니다.', async () => {
    const channels = await getChannelsService(user1.id);
    expect(channels.length).toBeGreaterThanOrEqual(2);
    expect(channels.some((c) => c.type === 'GLOBAL' && c.name.includes('전체-공지사항'))).toBe(true);
  });

  it('2. 1:1 DM 채널 생성 후 양쪽 유저의 채널 목록에 정상 조회되어야 합니다.', async () => {
    const dm = await createChannelService({
      type: 'DM',
      targetUserId: user2.id,
      userId: user1.id,
    });

    expect(dm.type).toBe('DM');

    const u1Channels = await getChannelsService(user1.id);
    const u2Channels = await getChannelsService(user2.id);

    expect(u1Channels.some((c) => c.id === dm.id)).toBe(true);
    expect(u2Channels.some((c) => c.id === dm.id)).toBe(true);
  });
});