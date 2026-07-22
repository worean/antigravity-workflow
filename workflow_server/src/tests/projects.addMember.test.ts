/**
 * 🧪 [Domain: projects / Service: addMember]
 * - 기능: 프로젝트에 신규 멤버(역할 지정) 추가 REST API 단위 테스트
 * - 경우의 수: 프로젝트 멤버(MEMBER) 정상 추가 (201 Created), 필수 파라미터 누락 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [projects.addMember] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let ownerUser: { id: number; email: string };
  let targetUser: { id: number; email: string };
  let ownerAuthToken: string;
  let testProject: any;

  beforeAll(async () => {
    ownerUser = await prisma.user.upsert({
      where: { email: 'add-member-owner@example.com' },
      update: {},
      create: { email: 'add-member-owner@example.com', name: 'AddMember Owner' }
    });
    targetUser = await prisma.user.upsert({
      where: { email: 'add-member-target@example.com' },
      update: {},
      create: { email: 'add-member-target@example.com', name: 'AddMember Target' }
    });

    ownerAuthToken = jwt.sign({ userId: ownerUser.id, email: ownerUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Member Add Project',
        key: `MAP_${Date.now()}`,
        ownerId: ownerUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });
  });

  afterAll(async () => {
    await prisma.projectMember.deleteMany({ where: { projectId: testProject.id } });
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: ownerUser.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: targetUser.id } }).catch(() => {});
  });

  describe('Case 1: 👥 프로젝트 멤버 추가 기능', () => {
    it('프로젝트에 신규 멤버를 MEMBER 역할로 추가 성공 시 멤버 객체가 반환되어야 한다 (201 Created)', async () => {
      const response = await request(app)
        .post('/api/projects/addMember')
        .set('Authorization', `Bearer ${ownerAuthToken}`)
        .send({
          projectId: testProject.id,
          userId: targetUser.id,
          role: 'MEMBER'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('role', 'MEMBER');
    });

    it('필수 데이터(projectId 또는 userId) 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/projects/addMember')
        .set('Authorization', `Bearer ${ownerAuthToken}`)
        .send({
          projectId: testProject.id
        });

      expect(response.status).toBe(400);
    });
  });
});
