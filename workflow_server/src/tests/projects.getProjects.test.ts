// -*- coding: utf-8 -*-
/**
 * 🧪 [Domain: projects / Service: getProjects]
 * - 기능: 전체 프로젝트 목록 조회 REST API 단위 테스트
 * - 경우의 수: 전체 프로젝트 목록 배열 정상 반환 (200 OK)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [projects.getProjects] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'get-projects-user@example.com' },
      update: {},
      create: { email: 'get-projects-user@example.com', name: 'GetProjects User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 📋 프로젝트 목록 조회 기능', () => {
    it('프로젝트 목록 요청 시 성공적으로 목록 배열이 반환되어야 한다', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Case 2: ⚡ 개수 제한(limit/take), 건너뛰기(skip/offset), 검색 및 정렬(sortBy/order)', () => {
    let createdProjects: any[] = [];

    beforeAll(async () => {
      // 고유 키를 가진 프로젝트 3개 생성
      for (let i = 1; i <= 3; i++) {
        const p = await prisma.project.create({
          data: {
            name: `GetProjects Searchable Test Project ${i}`,
            key: `GPTP${i}`,
            ownerId: testUser.id,
          }
        });
        createdProjects.push(p);
      }
    });

    afterAll(async () => {
      const ids = createdProjects.map(p => p.id);
      await prisma.project.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
    });

    it('limit 파라미터 적용 시 지정된 개수만큼만 반환되어야 한다', async () => {
      const response = await request(app)
        .get('/api/projects?limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(2);
    });

    it('search 파라미터 적용 시 해당 키워드가 포함된 프로젝트만 필터링되어야 한다', async () => {
      const response = await request(app)
        .get('/api/projects?search=Searchable')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
      expect(response.body.every((p: any) => p.name.includes('Searchable'))).toBe(true);
    });

    it('ownerId=my 파라미터 적용 시 내가 생성한 프로젝트만 반환되어야 한다', async () => {
      const response = await request(app)
        .get('/api/projects?ownerId=my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((p: any) => p.ownerId === testUser.id)).toBe(true);
    });

    it('sortBy 및 order 파라미터로 정렬이 정상 작동해야 한다', async () => {
      const resDesc = await request(app)
        .get('/api/projects?search=Searchable&sortBy=id&order=desc')
        .set('Authorization', `Bearer ${authToken}`);

      const resAsc = await request(app)
        .get('/api/projects?search=Searchable&sortBy=id&order=asc')
        .set('Authorization', `Bearer ${authToken}`);

      expect(resDesc.status).toBe(200);
      expect(resAsc.status).toBe(200);
      expect(resDesc.body[0].id).toBeGreaterThan(resAsc.body[0].id);
    });
  });
});
