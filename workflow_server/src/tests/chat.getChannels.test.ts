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

  it('3. 유저가 소유하거나 참여한 프로젝트 채널이 자동으로 프로비저닝되어 조회되어야 합니다.', async () => {
    const channels = await getChannelsService(user1.id);
    const projChannel = channels.find((c) => c.type === 'PROJECT' && c.projectId === project.id);

    expect(projChannel).toBeDefined();
    expect(projChannel?.name).toBe('Chat Test Project');
  });

  it('4. 그룹 생성 및 그룹 채널 생성이 정상 동작해야 합니다.', async () => {
    const group = await prisma.group.create({
      data: {
        name: '개발 1팀',
        code: `DEV_${Date.now()}`,
        members: {
          create: [
            { userId: user1.id, role: 'LEADER' },
            { userId: user2.id, role: 'MEMBER' },
          ],
        },
      },
    });

    const channels = await getChannelsService(user1.id);
    const groupChannel = channels.find((c) => c.type === 'GROUP' && c.groupId === group.id);

    expect(groupChannel).toBeDefined();
    expect(groupChannel?.name).toBe('개발 1팀');
  });
});