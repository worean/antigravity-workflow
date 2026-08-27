// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { toggleFavoriteService } from '../modules/favorites/services/toggleFavorite.service.js';
import { getFavoritesService } from '../modules/favorites/services/getFavorites.service.js';
import { getProjectsService } from '../modules/projects/services/getProjects.service.js';

describe('favorites.getFavorites.test.ts', () => {
  let testUser: any;
  let proj1: any;
  let proj2: any;

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        email: `fav_get_user_${Date.now()}_${Math.random()}@test.com`,
        name: '즐겨찾기 조회 유저',
      },
    });

    proj1 = await prisma.project.create({
      data: {
        name: `Normal Project ${Date.now()}`,
        key: `NORM${Math.floor(Math.random() * 1000)}`,
        ownerId: testUser.id,
      },
    });

    proj2 = await prisma.project.create({
      data: {
        name: `Starred Project ${Date.now()}`,
        key: `STAR${Math.floor(Math.random() * 1000)}`,
        ownerId: testUser.id,
      },
    });

    // proj2만 즐겨찾기 등록
    await toggleFavoriteService({
      userId: testUser.id,
      targetType: 'PROJECT',
      targetId: proj2.id,
    });
  });

  it('getFavoritesService는 유저의 즐겨찾기 목록과 상세 메타데이터를 반환한다', async () => {
    const favs = await getFavoritesService({
      userId: testUser.id,
      targetType: 'PROJECT',
    });

    expect(favs.length).toBe(1);
    expect(favs[0].targetId).toBe(proj2.id);
    expect(favs[0].detail?.name).toBe(proj2.name);
  });

  it('getProjectsService는 즐겨찾기된 프로젝트(isFavorite: true)를 최우선 상단에 정렬한다', async () => {
    const list = await getProjectsService({}, testUser.id);
    const myProjects = list.filter((p: any) => p.id === proj1.id || p.id === proj2.id);

    expect(myProjects.length).toBe(2);
    // proj2가 즐겨찾기되어 있으므로 proj1보다 앞에 위치해야 함
    const idxProj2 = myProjects.findIndex((p: any) => p.id === proj2.id);
    const idxProj1 = myProjects.findIndex((p: any) => p.id === proj1.id);
    expect(idxProj2).toBeLessThan(idxProj1);
    expect(myProjects[idxProj2].isFavorite).toBe(true);
    expect(myProjects[idxProj1].isFavorite).toBe(false);
  });
});