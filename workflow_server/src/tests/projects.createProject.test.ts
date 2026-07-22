/**
 * 🧪 [Domain: projects / Service: createProject]
 * - 기능: 신규 프로젝트 생성 및 소유자(ownerId) 동적 할당 REST API 단위 테스트
 * - 경우의 수: User A/B 토큰 신원에 따라 ownerId 및 ADMIN 멤버 자동 등록 (201 Created), 토큰 미포함 401, 필수값 누락 400
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [projects.createProject] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';

  let userA: { id: number; email: string; name: string | null };
  let userB: { id: number; email: string; name: string | null };
  let tokenA: string;
  let tokenB: string;

  let createdProjectIds: number[] = [];

  beforeAll(async () => {
    // 테스트용 유저 A, B 준비
    userA = await prisma.user.upsert({
      where: { email: 'unittest-proj-user-a@example.com' },
      update: {},
      create: { email: 'unittest-proj-user-a@example.com', name: 'Project Tester A' }
    });

    userB = await prisma.user.upsert({
      where: { email: 'unittest-proj-user-b@example.com' },
      update: {},
      create: { email: 'unittest-proj-user-b@example.com', name: 'Project Tester B' }
    });

    // JWT Access Token 발급 (서버 암호서명)
    tokenA = jwt.sign({ userId: userA.id, email: userA.email }, jwtSecret, { expiresIn: '1h' });
    tokenB = jwt.sign({ userId: userB.id, email: userB.email }, jwtSecret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    // DB 데이터 cleanup
    if (createdProjectIds.length > 0) {
      await prisma.projectMember.deleteMany({
        where: { projectId: { in: createdProjectIds } }
      });
      await prisma.project.deleteMany({
        where: { id: { in: createdProjectIds } }
      });
    }

    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } }
    });
  });

  describe('Case 1: 🔒 JWT 인증 미들웨어 인가 검증 (Auth & Security Use-Cases)', () => {
    it('Authorization Bearer 헤더 토큰 없이 요청 시 401 Unauthorized 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/projects/create')
        .send({
          name: 'Unauthorized Project',
          key: 'UNAUTH'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Unauthorized');
    });

    it('유효하지 않은 JWT 서명 토큰 전송 시 401 Unauthorized 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/projects/create')
        .set('Authorization', 'Bearer invalid.fake.jwttoken')
        .send({
          name: 'Invalid Token Project',
          key: 'INVTOKEN'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Case 2: 🏗️ 정상 프로젝트 생성 및 소유자(ownerId) 동적 연동 검증 (Success Use-Cases)', () => {
    it('User A가 요청 시, ownerId가 User A의 ID로 정확히 지정되고 ADMIN 멤버로 등록되어야 한다', async () => {
      const projKey = `PROJ_A_${Date.now()}`;
      const response = await request(app)
        .post('/api/projects/create')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'User A Test Project',
          key: projKey,
          description: 'Project created by User A'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('ownerId', userA.id);
      expect(response.body.key).toBe(projKey);

      createdProjectIds.push(response.body.id);

      // DB 상의 ProjectMember 등록 여부 검증
      const member = await prisma.projectMember.findFirst({
        where: { projectId: response.body.id, userId: userA.id }
      });
      expect(member).not.toBeNull();
      expect(member?.role).toBe('ADMIN');
    });

    it('User B가 요청 시, ownerId가 User B의 ID로 정확히 지정되어야 한다 (신원 구분)', async () => {
      const projKey = `PROJ_B_${Date.now()}`;
      const response = await request(app)
        .post('/api/projects/create')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          name: 'User B Test Project',
          key: projKey,
          description: 'Project created by User B'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('ownerId', userB.id);
      expect(response.body.ownerId).not.toBe(userA.id);

      createdProjectIds.push(response.body.id);
    });
  });

  describe('Case 3: ⚠️ 파라미터 유효성 검증 실패 (Validation Failure Use-Cases)', () => {
    it('프로젝트 필수 키(key) 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/projects/create')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'No Key Project'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('프로젝트 필수 이름(name) 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/projects/create')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          key: 'NO_NAME'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
