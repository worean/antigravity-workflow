﻿import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import jwt from 'jsonwebtoken';

describe('🧪 [groups.deleteGroup] Service & Cascade Deletion Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let ownerUser: any;
  let ownerToken: string;
  let normalUser: any;
  let normalToken: string;
  let group: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 8) + Date.now();

    ownerUser = await prisma.user.create({
      data: {
        email: `grp_owner_${rand}@example.com`,
        name: 'Group Owner',
        role: 'MEMBER',
      },
    });
    ownerToken = jwt.sign({ userId: ownerUser.id, email: ownerUser.email }, jwtSecret, { expiresIn: '1h' });

    normalUser = await prisma.user.create({
      data: {
        email: `grp_user_${rand}@example.com`,
        name: 'Normal User',
        role: 'MEMBER',
      },
    });
    normalToken = jwt.sign({ userId: normalUser.id, email: normalUser.email }, jwtSecret, { expiresIn: '1h' });

    group = await prisma.group.create({
      data: {
        name: `테스트 삭제 그룹 ${rand}`,
        code: `GRP_${rand}`,
        members: {
          create: [
            { userId: ownerUser.id, role: 'OWNER' },
            { userId: normalUser.id, role: 'MEMBER' },
          ],
        },
      },
    });

    // Global DB에 그룹 연관 채팅방 생성
    await globalPrisma.chatChannel.create({
      data: {
        name: group.name,
        type: 'GROUP',
        groupId: group.id,
      },
    });
  });

  it('1. 그룹 삭제 성공 시 Workspace DB 그룹 삭제와 Global DB 연관 채팅방이 함께 삭제되어야 합니다.', async () => {
    // 삭제 전 채팅방 존재 확인
    const chanBefore = await globalPrisma.chatChannel.findFirst({
      where: { type: 'GROUP', groupId: group.id },
    });
    expect(chanBefore).not.toBeNull();

    // 그룹 삭제 API 호출 (오너 권한)
    const res = await request(app)
      .delete(`/api/groups/${group.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);

    // Workspace DB에서 그룹 삭제 확인
    const checkGroup = await prisma.group.findUnique({ where: { id: group.id } });
    expect(checkGroup).toBeNull();

    // Global DB에서 연관된 GROUP 채팅방이 함께 삭제되었는지 확인
    const chanAfter = await globalPrisma.chatChannel.findFirst({
      where: { type: 'GROUP', groupId: group.id },
    });
    expect(chanAfter).toBeNull();
  });

  it('2. 일반 멤버가 그룹 삭제 시도시 403 Forbidden 에러를 반환하고 채팅방도 유지되어야 합니다.', async () => {
    const res = await request(app)
      .delete(`/api/groups/${group.id}`)
      .set('Authorization', `Bearer ${normalToken}`);

    expect(res.status).toBe(403);

    // 채팅방 유지 확인
    const chanStillExists = await globalPrisma.chatChannel.findFirst({
      where: { type: 'GROUP', groupId: group.id },
    });
    expect(chanStillExists).not.toBeNull();
  });
});
