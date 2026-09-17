﻿﻿﻿import { describe, it, expect, beforeEach } from 'vitest';
import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma as workspacePrisma } from '#lib/prisma.js';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { createChannelService } from '../modules/chat/services/createChannel.service.js';

describe('💬 [Chat: createChannel - Robustness & Name Fallback] Unit Tests', () => {
  let user1: any;
  let user2: any;
  let testWorkspace: any;
  let testProject: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 9) + Date.now();

    // 1. 유저 생성
    user1 = await createUserService({
      email: 'chan_u1_' + rand + '@test.com',
      name: 'Channel Creator',
      password: 'password123',
    });

    user2 = await createUserService({
      email: 'chan_u2_' + rand + '@test.com',
      name: 'Target Partner',
      password: 'password123',
    });

    // 2. 워크스페이스 확인 또는 생성
    testWorkspace = await globalPrisma.workspace.findFirst({
      where: { status: 'ACTIVE' },
    });
    if (!testWorkspace) {
      testWorkspace = await globalPrisma.workspace.create({
        data: {
          name: 'Test Workspace ' + rand,
          slug: 'ws-' + rand,
          dbUrl: 'file:test.db',
          status: 'ACTIVE',
          owner: { connect: { id: user1.id } },
        },
      });
    }

    // 3. 테스트용 프로젝트 생성
    testProject = await workspacePrisma.project.create({
      data: {
        name: 'Alpha Project ' + rand,
        key: 'ALP' + String(Date.now()).slice(-4),
        ownerId: user1.id,
      },
    });
  });

  it('1. DM 채널 생성 시 name이 생략되어도 상대방 유저 이름으로 자동 명명되어야 합니다.', async () => {
    const channel = await createChannelService({
      userId: user1.id,
      type: 'DM',
      targetUserId: user2.id,
      workspaceId: testWorkspace.id,
    });

    expect(channel).toBeDefined();
    expect(channel.type).toBe('DM');
    expect(channel.workspaceId).toBe(testWorkspace.id);
    expect(channel.name).toBe(user2.name);
    expect(channel.isPrivate).toBe(true);
    expect(channel.members.length).toBe(2);
  });

  it('2. 동일 유저 간 기존 DM이 존재하면 신규 생성 대신 기존 DM 채널을 반환해야 합니다.', async () => {
    const dm1 = await createChannelService({
      userId: user1.id,
      type: 'DM',
      targetUserId: user2.id,
      workspaceId: testWorkspace.id,
    });

    const dm2 = await createChannelService({
      userId: user2.id,
      type: 'DM',
      targetUserId: user1.id,
      workspaceId: testWorkspace.id,
    });

    expect(dm1.id).toBe(dm2.id);
  });

  it('3. PROJECT 채널 생성 시 name이 비어있으면 해당 프로젝트 이름이 자동으로 사용되어야 합니다.', async () => {
    const channel = await createChannelService({
      userId: user1.id,
      type: 'PROJECT',
      projectId: testProject.id,
      workspaceId: testWorkspace.id,
      name: '', // 빈 이름 전송
    });

    expect(channel).toBeDefined();
    expect(channel.type).toBe('PROJECT');
    expect(channel.name).toBe(testProject.name);
    expect(channel.topic).toContain(testProject.key);
    expect(channel.icon).toBe('📁');
  });

  it('4. GENERAL 채널 생성 시 name이 누락되어도 400 에러 없이 기본 이름으로 생성되어야 합니다.', async () => {
    const channel = await createChannelService({
      userId: user1.id,
      type: 'GENERAL',
      workspaceId: testWorkspace.id,
      // name 완전히 누락
    });

    expect(channel).toBeDefined();
    expect(channel.type).toBe('GENERAL');
    expect(channel.name).toBe('새 대화방');
    expect(channel.icon).toBe('💬');
  });

  it('5. type이 소문자 ("dm", "project")로 전송되어도 대소문자 정규화되어 정상 동작해야 합니다.', async () => {
    const dmChan = await createChannelService({
      userId: user1.id,
      type: 'dm' as any,
      targetUserId: user2.id,
      workspaceId: testWorkspace.id,
    });
    expect(dmChan.type).toBe('DM');

    const projChan = await createChannelService({
      userId: user1.id,
      type: 'project' as any,
      projectId: testProject.id,
      workspaceId: testWorkspace.id,
      name: 'Custom Project Channel',
    });
    expect(projChan.type).toBe('PROJECT');
    expect(projChan.name).toBe('Custom Project Channel');
  });
});
