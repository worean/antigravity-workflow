/**
 * 🧪 [Domain: users / Service: updateUser]
 * - 기능: 사용자 정보(이름 등) 수정 REST API 단위 테스트
 * - 경우의 수: 사용자 정보 수정 성공 (200 OK), 존재하지 않는 유저 ID 수정 요청 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [users.updateUser] Service & REST API Unit Tests', () => {
  let targetUserId: number;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `update-user-${Date.now()}@example.com`,
        name: 'Before Update Name'
      }
    });
    targetUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: targetUserId } }).catch(() => {});
  });

  describe('Case 1: ✏️ 유저 정보 수정 기능', () => {
    it('유효한 유저 정보 수정 요청 시 업데이트된 유저 객체가 반환되어야 한다', async () => {
      const response = await request(app)
        .put(`/api/users/update/${targetUserId}`)
        .send({
          name: 'After Update Name'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'After Update Name');
    });

    it('존재하지 않는 유저 ID 수정 요청 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .put('/api/users/update/9999999')
        .send({
          name: 'Ghost Name'
        });

      expect(response.status).toBe(400);
    });
  });
});
