/**
 * 🧪 [Domain: issues / Service: getIssue]
 * - 기능: 단일 이슈 상세 정보 조회 REST API 단위 테스트
 * - 경우의 수: 존재하는 이슈 ID로 상세 정보 조회 성공 (200 OK), 존재하지 않는 이슈 ID 404 Not Found 예외
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [issues.getIssue] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let targetIssueId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'get-single-issue-user@example.com' },
      update: {},
      create: { email: 'get-single-issue-user@example.com', name: 'GetSingleIssue User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Single Issue Test Project',
        key: `SITP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    const issue = await createIssueService({ title: 'Single Test Issue', projectId: testProject.id, authorId: testUser.id });
    targetIssueId = issue.id;
  });

  afterAll(async () => {
    await prisma.issue.delete({ where: { id: targetIssueId } }).catch(() => {});
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 🔍 단일 이슈 상세 조회 기능', () => {
    it('존재하는 이슈 ID로 조회 시 이슈 상세 정보가 반환되어야 한다', async () => {
      const response = await request(app)
        .get(`/api/issues/get/${targetIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', targetIssueId);
      expect(response.body).toHaveProperty('title', 'Single Test Issue');
    });

    it('존재하지 않는 이슈 ID로 조회 시 404 Not Found 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/issues/get/9999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
