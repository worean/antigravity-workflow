/**
 * 🧪 [Domain: users / Service: deleteUser]
 * - 기능: 사용자 계정 삭제 REST API 단위 테스트
 * - 경우의 수: 계정 삭제 성공 (200 OK), 존재하지 않는 유저 ID 삭제 요청 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [users.deleteUser] Service & REST API Unit Tests', () => {
  let targetUserId: number;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `delete-target-${Date.now()}@example.com`,
        name: 'User to Delete'
      }
    });
    targetUserId = user.id;
  });

  describe('Case 1: 🗑️ 유저 계정 삭제 기능', () => {
    it('유효한 유저 ID 삭제 요청 시 계정이 성공적으로 삭제되어야 한다 (200 OK)', async () => {
      const response = await request(app)
        .delete(`/api/users/delete/${targetUserId}`);

      expect(response.status).toBe(200);

      const checkUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(checkUser).toBeNull();
    });

    it('존재하지 않는 유저 ID 삭제 요청 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .delete('/api/users/delete/9999999');

      expect(response.status).toBe(400);
    });
  });
});
