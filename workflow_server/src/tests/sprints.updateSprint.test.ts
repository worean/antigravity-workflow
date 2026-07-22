/**
 * 🧪 [Domain: sprints / Service: updateSprint]
 * - 기능: 스프린트 정보 수정 및 상태(PLANNED ➔ ACTIVE) 변경 REST API 단위 테스트
 * - 경우의 수: 스프린트 상태 변경 성공 (200 OK), 존재하지 않는 스프린트 ID 수정 요청 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [sprints.updateSprint] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let targetSprintId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'up-sprint-user@example.com' },
      update: {},
      create: { email: 'up-sprint-user@example.com', name: 'UpSprint User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'UpSprint Project',
        key: `USP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    const sprint = await prisma.sprint.create({
      data: {
        name: 'Sprint Before Update',
        projectId: testProject.id,
        status: 'PLANNED'
      }
    });
    targetSprintId = sprint.id;
  });

  afterAll(async () => {
    await prisma.sprint.delete({ where: { id: targetSprintId } }).catch(() => {});
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: ✏️ 스프린트 정보 수정 기능', () => {
    it('스프린트 상태 변경(PLANNED ➔ ACTIVE) 성공 시 수정된 정보가 반환되어야 한다', async () => {
      const response = await request(app)
        .put(`/api/sprints/update/${targetSprintId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'ACTIVE'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ACTIVE');
    });

    it('존재하지 않는 스프린트 ID 수정 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .put('/api/sprints/update/9999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'COMPLETED'
        });

      expect(response.status).toBe(400);
    });
  });
});
