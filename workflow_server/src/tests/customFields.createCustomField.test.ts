/**
 * 🧪 [Domain: customFields / Service: createCustomField]
 * - 기능: 계층형/동적 커스텀 필드 메타데이터 정의 생성 REST API 단위 테스트
 * - 경우의 수: 필수 식별 키(key)와 이름(name)으로 생성 성공 (201 Created), 필수 파라미터 누락 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [customFields.createCustomField] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let createdFieldId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'cf-user@example.com' },
      update: {},
      create: { email: 'cf-user@example.com', name: 'CustomField User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    if (createdFieldId) await prisma.customFieldDefinition.delete({ where: { id: createdFieldId } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: ⚙️ 커스텀 필드 생성 기능', () => {
    it('유효한 데이터(key, name)로 커스텀 필드 생성 요청 시 성공해야 한다', async () => {
      const response = await request(app)
        .post('/api/custom-fields/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: `key_${Date.now()}`,
          name: `Severity_${Date.now()}`,
          fieldType: 'TEXT',
          description: 'Bug Severity Field'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.fieldType).toBe('TEXT');

      createdFieldId = response.body.id;
    });

    it('필수 데이터(key 또는 name) 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/custom-fields/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'No key and name field'
        });

      expect(response.status).toBe(400);
    });
  });
});
