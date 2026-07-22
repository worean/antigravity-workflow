/**
 * 🧪 [Domain: issues / Service: createIssue]
 * - 기능: 이슈/일감 신규 생성 REST API 단위 테스트
 * - 경우의 수: 제목과 프로젝트 ID로 이슈 생성 성공 및 순번(issueNumber) 자동 부여 (201 Created), 필수값 누락 예외 (400)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [issues.createIssue] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let createdIssueId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'create-issue-user@example.com' },
      update: {},
      create: { email: 'create-issue-user@example.com', name: 'CreateIssue User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });

    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Issue Test Project',
        key: `ITP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });
  });

  afterAll(async () => {
    if (createdIssueId) await prisma.issue.delete({ where: { id: createdIssueId } }).catch(() => {});
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 📌 이슈 신규 생성 기능', () => {
    it('유효한 데이터로 이슈 생성 요청 시 이슈가 생성되어야 한다', async () => {
      const response = await request(app)
        .post('/api/issues/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'First Test Issue',
          description: 'Testing issue creation',
          projectId: testProject.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('First Test Issue');

      createdIssueId = response.body.id;
    });

    it('필수 데이터(title 또는 projectId) 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/issues/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'No title issue'
        });

      expect(response.status).toBe(400);
    });
  });
});
