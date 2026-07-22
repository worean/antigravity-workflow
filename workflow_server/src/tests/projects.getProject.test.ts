/**
 * 🧪 [Domain: projects / Service: getProject]
 * - 기능: 단일 프로젝트 상세 정보 조회 REST API 단위 테스트
 * - 경우의 수: 존재하는 프로젝트 ID로 조회 성공 (200 OK), 존재하지 않는 프로젝트 ID 404 Not Found 예외
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [projects.getProject] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'get-single-proj-user@example.com' },
      update: {},
      create: { email: 'get-single-proj-user@example.com', name: 'GetSingleProj User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Single Proj Test',
        key: `SPT_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 🔍 단일 프로젝트 상세 조회 기능', () => {
    it('존재하는 프로젝트 ID로 조회 시 상세 정보를 반환해야 한다', async () => {
      const response = await request(app)
        .get(`/api/projects/get/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testProject.id);
      expect(response.body.name).toBe('Single Proj Test');
    });

    it('존재하지 않는 프로젝트 ID로 조회 시 404 Not Found 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/projects/get/9999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
