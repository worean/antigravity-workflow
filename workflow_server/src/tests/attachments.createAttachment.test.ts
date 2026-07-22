/**
 * 🧪 [Domain: attachments / Service: createAttachment]
 * - 기능: 첨부파일 메타데이터(파일명, URL, 파일크기, 업로더 등) 등록 REST API 단위 테스트
 * - 경우의 수: 유효한 파일 정보 등록 성공 (201 Created) / 필수 파라미터 누락 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [attachments.createAttachment] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let testIssue: any;
  let createdAttachmentId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'attachment-user@example.com' },
      update: {},
      create: { email: 'attachment-user@example.com', name: 'Attachment User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Attachment Project',
        key: `AP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    testIssue = await createIssueService({ title: 'Attachment Issue', projectId: testProject.id, authorId: testUser.id });
  });

  afterAll(async () => {
    if (createdAttachmentId) await prisma.attachment.delete({ where: { id: createdAttachmentId } }).catch(() => {});
    await prisma.issue.delete({ where: { id: testIssue.id } }).catch(() => {});
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 📎 첨부파일 메타데이터 추가 기능', () => {
    it('유효한 첨부파일 정보 제출 시 성공적으로 등록되어야 한다', async () => {
      const response = await request(app)
        .post('/api/attachments/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: 'report.pdf',
          originalName: 'report.pdf',
          url: 'https://example.com/files/report.pdf',
          size: 2048576,
          mimeType: 'application/pdf',
          issueId: testIssue.id,
          uploaderId: testUser.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.filename).toBe('report.pdf');

      createdAttachmentId = response.body.id;
    });

    it('필수 파일 정보 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/attachments/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com/files/report.pdf'
        });

      expect(response.status).toBe(400);
    });
  });
});
