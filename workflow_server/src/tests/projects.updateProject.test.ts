/**
 * 🧪 [Domain: projects / Service: updateProject]
 * - 기능: 프로젝트 정보(이름, 설명 등) 수정 REST API 단위 테스트
 * - 경우의 수: 프로젝트 수정 성공 (200 OK), 존재하지 않는 프로젝트 ID 수정 요청 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [projects.updateProject] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let targetProjectId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'update-project-tester@example.com' },
      update: {},
      create: { email: 'update-project-tester@example.com', name: 'UpdateProj Tester' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    const proj = await prisma.project.create({
      data: {
        name: 'Project Before Update',
        key: `UP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });
    targetProjectId = proj.id;
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: targetProjectId } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: ✏️ 프로젝트 정보 수정 기능', () => {
    it('프로젝트 정보 수정 성공 시 업데이트된 프로젝트 정보가 반환되어야 한다', async () => {
      const response = await request(app)
        .put(`/api/projects/update/${targetProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Project After Update'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Project After Update');
    });

    it('존재하지 않는 프로젝트 ID 수정 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .put('/api/projects/update/9999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Ghost Project'
        });

      expect(response.status).toBe(400);
    });
  });
});
