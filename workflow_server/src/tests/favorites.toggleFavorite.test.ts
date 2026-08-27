// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { toggleFavoriteService } from '../modules/favorites/services/toggleFavorite.service.js';
import { getUserFavoriteIdsService } from '../modules/favorites/services/getUserFavoriteIds.service.js';

describe('favorites.toggleFavorite.test.ts', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        email: `fav_user_${Date.now()}_${Math.random()}@test.com`,
        name: '즐겨찾기 유저',
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: `Fav Test Project ${Date.now()}`,
        key: `FAV${Math.floor(Math.random() * 1000)}`,
        ownerId: testUser.id,
      },
    });
  });

  it('즐겨찾기가 없는 상태에서 토글 시 isFavorite: true 반환 및 DB 레코드 생성', async () => {
    const res = await toggleFavoriteService({
      userId: testUser.id,
      targetType: 'PROJECT',
      targetId: testProject.id,
    });

    expect(res.isFavorite).toBe(true);
    expect(res.targetType).toBe('PROJECT');
    expect(res.targetId).toBe(testProject.id);

    const favIds = await getUserFavoriteIdsService({
      userId: testUser.id,
      targetType: 'PROJECT',
    });
    expect(favIds.has(testProject.id)).toBe(true);
  });

  it('이미 즐겨찾기된 상태에서 다시 토글 시 isFavorite: false 반환 및 DB 레코드 삭제', async () => {
    // 1. 등록
    await toggleFavoriteService({
      userId: testUser.id,
      targetType: 'PROJECT',
      targetId: testProject.id,
    });

    // 2. 해제
    const res = await toggleFavoriteService({
      userId: testUser.id,
      targetType: 'PROJECT',
      targetId: testProject.id,
    });

    expect(res.isFavorite).toBe(false);

    const favIds = await getUserFavoriteIdsService({
      userId: testUser.id,
      targetType: 'PROJECT',
    });
    expect(favIds.has(testProject.id)).toBe(false);
  });
});