/**
 * 🧪 [Domain: users / Feature: Profile Extension]
 * - 기능: 사용자 자기 설명(bio), 소속 부서(department), 직책(jobTitle) 수정 및 조회 단위 테스트
 * - 경우의 수:
 *   1. bio, department, jobTitle 정상 수정 및 반환 (200 OK)
 *   2. getUser, getUsers 호출 시 확장 프로필 필드 포함 여부 검증
 *   3. 빈 문자열 또는 null 처리 검증
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';

describe('🧪 [users.profile] Profile Extensions Unit Tests', () => {
  let targetUserId: number;
  let authToken: string;

  beforeAll(async () => {
    const email = `profile-test-${Date.now()}@example.com`;
    // Global User 생성
    const gUser = await globalPrisma.user.create({
      data: {
        email,
        name: 'Profile Test User',
      },
    });

    // Workspace User 생성
    const user = await prisma.user.create({
      data: {
        id: gUser.id,
        email,
        name: 'Profile Test User',
      },
    });
    targetUserId = user.id;

    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    authToken = jwt.sign({ userId: targetUserId, email: user.email }, jwtSecret);
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: targetUserId } }).catch(() => {});
    await globalPrisma.user.delete({ where: { id: targetUserId } }).catch(() => {});
  });

  it('TC-POS-01: bio, department, jobTitle 정상 수정 및 반환 검증', async () => {
    const res = await request(app)
      .put(`/api/users/${targetUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '홍길동',
        bio: '백엔드 및 분산 시스템을 개발합니다.',
        department: '코어플랫폼개발팀',
        jobTitle: '시니어 엔지니어',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', '홍길동');
    expect(res.body).toHaveProperty('bio', '백엔드 및 분산 시스템을 개발합니다.');
    expect(res.body).toHaveProperty('department', '코어플랫폼개발팀');
    expect(res.body).toHaveProperty('jobTitle', '시니어 엔지니어');

    // Global DB에도 동기화되었는지 확인
    const syncedGlobalUser = await globalPrisma.user.findUnique({ where: { id: targetUserId } });
    expect(syncedGlobalUser?.bio).toBe('백엔드 및 분산 시스템을 개발합니다.');
    expect(syncedGlobalUser?.department).toBe('코어플랫폼개발팀');
    expect(syncedGlobalUser?.jobTitle).toBe('시니어 엔지니어');
  });

  it('TC-POS-02: getUser 및 getUsers 호출 시 확장 프로필 필드 포함 검증', async () => {
    // 1. 단일 조회
    const getRes = await request(app)
      .get(`/api/users/${targetUserId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty('bio', '백엔드 및 분산 시스템을 개발합니다.');
    expect(getRes.body).toHaveProperty('department', '코어플랫폼개발팀');
    expect(getRes.body).toHaveProperty('jobTitle', '시니어 엔지니어');

    // 2. 목록 조회
    const listRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    const found = listRes.body.find((u: any) => u.id === targetUserId);
    expect(found).toBeDefined();
    expect(found.department).toBe('코어플랫폼개발팀');
    expect(found.jobTitle).toBe('시니어 엔지니어');
  });

  it('TC-POS-03: 빈 문자열 입력 시 null로 정상 클리어 처리', async () => {
    const res = await request(app)
      .put(`/api/users/${targetUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bio: '',
        department: '',
        jobTitle: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.bio).toBeNull();
    expect(res.body.department).toBeNull();
    expect(res.body.jobTitle).toBeNull();
  });
});
