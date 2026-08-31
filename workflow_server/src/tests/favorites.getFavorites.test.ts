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
        key: `NRM_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ownerId: testUser.id,
      },
    });

    proj2 = await prisma.project.create({
      data: {
        name: `Starred Project ${Date.now()}`,
        key: `STR_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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

  it('getFavoritesService는 SPRINT 즐겨찾기 조회 시 project 및 issues 메타데이터를 포함한다', async () => {
    const sprint = await prisma.sprint.create({
      data: {
        name: `Sprint #${Date.now()}`,
        projectId: proj1.id,
        goal: '집중 모니터링 테스트 목표',
        status: 'ACTIVE',
      },
    });

    await prisma.issue.create({
      data: {
        title: '스프린트 테스트 일감 1',
        projectId: proj1.id,
        sprintId: sprint.id,
        authorId: testUser.id,
        statusId: 1,
        priorityId: 4,
      },
    });

    await toggleFavoriteService({
      userId: testUser.id,
      targetType: 'SPRINT',
      targetId: sprint.id,
    });

    const favs = await getFavoritesService({
      userId: testUser.id,
      targetType: 'SPRINT',
    });

    expect(favs.length).toBe(1);
    expect(favs[0].targetId).toBe(sprint.id);
    expect(favs[0].detail?.name).toBe(sprint.name);
    expect(favs[0].detail?.project?.id).toBe(proj1.id);
    expect(favs[0].detail?.issues?.length).toBe(1);
    expect(favs[0].detail?.issues[0].title).toBe('스프린트 테스트 일감 1');
  });
});