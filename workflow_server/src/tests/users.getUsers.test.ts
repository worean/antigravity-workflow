/**
 * 🧪 [Domain: users / Service: getUsers]
 * - 기능: 전체 사용자 목록 조회 REST API 단위 테스트
 * - 경우의 수: 사용자 목록 배열 정상 반환 (200 OK)
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('🧪 [users.getUsers] Service & REST API Unit Tests', () => {
  describe('Case 1: 📋 전체 유저 목록 조회 기능', () => {
    it('전체 유저 목록 요청 시 성공적으로 목록 배열이 반환되어야 한다', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
