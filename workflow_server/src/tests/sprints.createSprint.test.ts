/**
 * 🧪 [Domain: sprints / Service: createSprint]
 * - 기능: 애자일 스프린트 생성 REST API 단위 테스트
 * - 경우의 수: 스프린트 명칭과 프로젝트 ID로 생성 성공 (201 Created), 필수 파라미터 누락 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [sprints.createSprint] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let createdSprintId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'sprint-user@example.com' },
      update: {},
      create: { email: 'sprint-user@example.com', name: 'Sprint User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Sprint Test Project',
        key: `STP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });
  });

  afterAll(async () => {
    if (createdSprintId) await prisma.sprint.delete({ where: { id: createdSprintId } }).catch(() => {});
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 🏃‍♂️ 스프린트 신규 생성 기능', () => {
    it('유효한 스프린트 명칭과 프로젝트 ID 전송 시 스프린트 생성이 성공해야 한다', async () => {
      const response = await request(app)
        .post('/api/sprints/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Sprint 1',
          projectId: testProject.id,
          goal: 'Complete MVP Features'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Sprint 1');

      createdSprintId = response.body.id;
    });

    it('필수 데이터(name 또는 projectId) 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/sprints/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          goal: 'No Name Sprint'
        });

      expect(response.status).toBe(400);
    });
  });
});
