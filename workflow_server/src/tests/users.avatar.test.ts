import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import jwt from 'jsonwebtoken';

describe('👤 [Users: Avatar & Random Color] 유저 아바타 및 랜덤 배경색상 단위 테스트', () => {
  let testUser: any;
  let testToken: string;

  // 1x1 투명 PNG Base64 Mock
  const mockPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeAll(async () => {
    const uniqueEmail = `avatar_test_${Date.now()}@example.com`;
    testUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: '아바타 테스트 사용자',
        role: 'MEMBER',
      },
    });

    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    testToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
  });

  it('1️⃣ 256x256 이하 크롭 PNG 아바타 이미지 저장 및 업데이트 성공', async () => {
    const res = await request(app)
      .put(`/api/users/${testUser.id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        avatar: mockPngBase64,
        avatarColor: '#3b82f6',
      });

    expect(res.status).toBe(200);
    expect(res.body.avatar).toBe(mockPngBase64);
    expect(res.body.avatarColor).toBe('#3b82f6');
  });

  it('2️⃣ getMe 호출 시 저장된 avatar 및 avatarColor 가 반환되어야 한다', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.avatar).toBe(mockPngBase64);
    expect(res.body.user.avatarColor).toBe('#3b82f6');
  });

  it('3️⃣ 기본 아바타 랜덤 색상(avatarColor) 변경 및 단독 업데이트 성공', async () => {
    const randomHexColor = '#10b981';
    const res = await request(app)
      .put(`/api/users/${testUser.id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        avatarColor: randomHexColor,
      });

    expect(res.status).toBe(200);
    expect(res.body.avatarColor).toBe(randomHexColor);
    expect(res.body.avatar).toBe(mockPngBase64); // 기존 avatar 유지
  });

  it('4️⃣ 아바타 이미지 삭제 (null) 시 기본 이니셜 아바타 모드로 전환 가능해야 한다', async () => {
    const res = await request(app)
      .put(`/api/users/${testUser.id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        avatar: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.avatar).toBeNull();
    expect(res.body.avatarColor).toBe('#10b981'); // 색상은 유지
  });
});
