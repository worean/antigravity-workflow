/**
 * 🧪 [Domain: calendar / Service: syncGoogleCalendar & getGoogleCalendarStatus]
 * - 기능: 구글 캘린더 연동 자격 확인 및 동기화 API 테스트
 * - 핵심 요구사항:
 *   - Google 계정으로 로그인한 유저만 Google Calendar 연동/동기화 가능
 *   - 비Google 로그인 유저는 403 Forbidden 차단 및 상태 isGoogleLinked: false 반환
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import jwt from 'jsonwebtoken';

describe('🧪 [Google Calendar Sync API] 연동 및 접근 제어 테스트', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';

  let normalUser: any;
  let normalToken: string;

  let googleUser: any;
  let googleSocialAccount: any;
  let googleToken: string;

  let testProject: any;
  let testIssue: any;

  beforeAll(async () => {
    // 1. 일반 이메일 유저 생성 (Google 미연동)
    const normalEmail = `normal_${Date.now()}@example.com`;
    normalUser = await prisma.user.create({
      data: {
        email: normalEmail,
        name: 'Normal User',
        password: 'hashedPassword123',
      },
    });
    await globalPrisma.user.create({
      data: {
        id: normalUser.id,
        email: normalEmail,
        name: 'Normal User',
        password: 'hashedPassword123',
      },
    }).catch(() => {});
    normalToken = jwt.sign(
      { userId: normalUser.id, email: normalUser.email, name: normalUser.name },
      jwtSecret,
      { expiresIn: '1d' }
    );

    // 2. Google 연동 유저 생성 (SocialAccount 보유)
    const googleEmail = `google_${Date.now()}@gmail.com`;
    googleUser = await prisma.user.create({
      data: {
        email: googleEmail,
        name: 'Google User',
        password: null,
      },
    });
    await globalPrisma.user.create({
      data: {
        id: googleUser.id,
        email: googleEmail,
        name: 'Google User',
        password: null,
      },
    }).catch(() => {});

    googleSocialAccount = await globalPrisma.socialAccount.create({
      data: {
        provider: 'GOOGLE',
        providerId: `google_sub_${googleUser.id}`,
        email: googleEmail,
        accessToken: 'mock_google_oauth_access_token',
        userId: googleUser.id,
      },
    });

    googleToken = jwt.sign(
      { userId: googleUser.id, email: googleUser.email, name: googleUser.name },
      jwtSecret,
      { expiresIn: '1d' }
    );

    // 3. 테스트 프로젝트 및 일정 이슈 생성
    testProject = await prisma.project.create({
      data: {
        name: 'Sync Test Project',
        key: `SYNC_${Date.now()}`.slice(0, 10),
        ownerId: googleUser.id,
      },
    });

    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${googleToken}`)
      .send({
        title: 'Sync Target Issue',
        projectId: testProject.id,
        plannedStartDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
    testIssue = issueRes.body;
  });

  afterAll(async () => {
    // 데이터 정리
    if (testIssue) await prisma.issue.delete({ where: { id: testIssue.id } }).catch(() => {});
    if (testProject) await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    if (googleSocialAccount) {
      await globalPrisma.socialAccount.delete({ where: { id: googleSocialAccount.id } }).catch(() => {});
    }
    if (googleUser) {
      await prisma.user.delete({ where: { id: googleUser.id } }).catch(() => {});
      await globalPrisma.user.delete({ where: { id: googleUser.id } }).catch(() => {});
    }
    if (normalUser) {
      await prisma.user.delete({ where: { id: normalUser.id } }).catch(() => {});
      await globalPrisma.user.delete({ where: { id: normalUser.id } }).catch(() => {});
    }
  });

  it('1️⃣ 비Google 로그인 유저의 상태 조회 시 isGoogleLinked: false 반환', async () => {
    const res = await request(app)
      .get('/api/calendar/google/status')
      .set('Authorization', `Bearer ${normalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.isGoogleLinked).toBe(false);
    expect(res.body.googleEmail).toBeNull();
  });

  it('2️⃣ 🔒 비Google 로그인 유저가 Google 동기화 시도 시 403 Forbidden 차단', async () => {
    const res = await request(app)
      .post('/api/calendar/sync/google')
      .set('Authorization', `Bearer ${normalToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Google 계정으로 로그인한 사용자만');
  });

  it('3️⃣ Google 로그인 유저의 상태 조회 시 isGoogleLinked: true 및 이메일 반환', async () => {
    const res = await request(app)
      .get('/api/calendar/google/status')
      .set('Authorization', `Bearer ${googleToken}`);

    expect(res.status).toBe(200);
    expect(res.body.isGoogleLinked).toBe(true);
    expect(res.body.googleEmail).toBe(googleUser.email);
  });

  it('4️⃣ ✅ Google 로그인 유저가 Google 동기화 시도 시 200 OK 성공 및 동기화 건수 반환', async () => {
    const res = await request(app)
      .post('/api/calendar/sync/google')
      .set('Authorization', `Bearer ${googleToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('syncedCount');
    expect(res.body.syncedCount).toBeGreaterThanOrEqual(1);
    expect(res.body).toHaveProperty('lastSyncedAt');
    expect(res.body.googleEmail).toBe(googleUser.email);
  });
});
