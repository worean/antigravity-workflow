// -*- coding: utf-8 -*-
/**
 * 🧪 [Domain: projects / Service: deleteProject]
 * - 기능: 프로젝트 삭제 REST API 단위 테스트
 * - 경우의 수: 프로젝트 삭제 성공 (200 OK), 존재하지 않는 프로젝트 ID 삭제 요청 예외 (404/400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [projects.deleteProject] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let targetProjectId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'delete-project-tester@example.com' },
      update: { role: 'ADMIN' },
      create: { email: 'delete-project-tester@example.com', name: 'DeleteProj Tester', role: 'ADMIN' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    const proj = await prisma.project.create({
      data: {
        name: 'Project to Delete',
        key: `DEL_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });
    targetProjectId = proj.id;

    await prisma.projectMember.create({
      data: {
        projectId: proj.id,
        userId: testUser.id,
        role: 'ADMIN'
      }
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 🗑️ 프로젝트 삭제 기능', () => {
    it('프로젝트 삭제 성공 시 200 OK 응답 및 DB 삭제가 완료되어야 한다', async () => {
      const response = await request(app)
        .delete(`/api/projects/${targetProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const checkProj = await prisma.project.findUnique({ where: { id: targetProjectId } });
      expect(checkProj).toBeNull();
    });

    it('존재하지 않는 프로젝트 ID 삭제 시 404/400 Error를 반환해야 한다', async () => {
      const response = await request(app)
        .delete('/api/projects/9999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 404]).toContain(response.status);
    });
  });
});
