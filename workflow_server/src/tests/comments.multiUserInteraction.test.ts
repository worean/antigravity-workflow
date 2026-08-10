/**
 * 🧪 [Domain: comments & attachments / Service: multiUserInteraction]
 * - 기능: 다중 유저(User A ↔ User B) 간의 댓글 상호작용 종합 단위/통합 테스트
 * - 검증 시나리오:
 *   1. User A(Alice)가 댓글을 달며 User B(Bob)를 @Mention하고 파일(PDF)을 첨부
 *   2. User B(Bob)가 Alice의 댓글에 이모지 리액션(👍) 등록
 *   3. User B(Bob)가 Alice의 댓글에 대댓글(Reply)을 달고 Alice를 @Mention하며 이미지(PNG) 파일 첨부
 *   4. User A(Alice)가 Bob의 대댓글에 이모지 리액션(❤️) 등록
 *   5. GET /api/comments/list/:issueId 조회를 통해 대댓글 구조, 멘션 정보, 리액션 정보, 첨부파일 정보가 교차 매핑되어 정상 응답되는지 종합 검증
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';
import { createAttachmentService } from '../modules/attachments/services/createAttachment.service.js';

describe('🧪 [comments.multiUserInteraction] Multi-User Comment, Mention, Reaction & Attachment E2E Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  
  let userAlice: { id: number; email: string; name: string | null };
  let userBob: { id: number; email: string; name: string | null };
  let aliceToken: string;
  let bobToken: string;

  let testProject: any;
  let testIssue: any;

  let aliceCommentId: number;
  let bobCommentId: number;
  let aliceAttachmentId: number;
  let bobAttachmentId: number;

  beforeAll(async () => {
    // 1. User A (Alice) & User B (Bob) 생성
    userAlice = await prisma.user.upsert({
      where: { email: 'alice-comment@example.com' },
      update: {},
      create: { email: 'alice-comment@example.com', name: 'Alice Designer' }
    });

    userBob = await prisma.user.upsert({
      where: { email: 'bob-comment@example.com' },
      update: {},
      create: { email: 'bob-comment@example.com', name: 'Bob Developer' }
    });

    aliceToken = jwt.sign({ userId: userAlice.id, email: userAlice.email }, jwtSecret, { expiresIn: '1h' });
    bobToken = jwt.sign({ userId: userBob.id, email: userBob.email }, jwtSecret, { expiresIn: '1h' });

    // 2. 테스트 프로젝트 및 이슈 생성
    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Multi-User Interaction Test Project',
        key: `MUTP_${Date.now()}`,
        ownerId: userAlice.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    testIssue = await createIssueService({
      title: 'UI/UX Design Review Task',
      projectId: testProject.id,
      authorId: userAlice.id
    });
  });

  afterAll(async () => {
    // Cleanup
    if (aliceAttachmentId) await prisma.attachment.delete({ where: { id: aliceAttachmentId } }).catch(() => {});
    if (bobAttachmentId) await prisma.attachment.delete({ where: { id: bobAttachmentId } }).catch(() => {});

    if (bobCommentId) {
      await prisma.commentMention.deleteMany({ where: { commentId: bobCommentId } }).catch(() => {});
      await prisma.commentReaction.deleteMany({ where: { commentId: bobCommentId } }).catch(() => {});
      await prisma.comment.delete({ where: { id: bobCommentId } }).catch(() => {});
    }

    if (aliceCommentId) {
      await prisma.commentMention.deleteMany({ where: { commentId: aliceCommentId } }).catch(() => {});
      await prisma.commentReaction.deleteMany({ where: { commentId: aliceCommentId } }).catch(() => {});
      await prisma.comment.delete({ where: { id: aliceCommentId } }).catch(() => {});
    }

    if (testIssue) await prisma.issue.delete({ where: { id: testIssue.id } }).catch(() => {});
    if (testProject) await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    if (userAlice) await prisma.user.delete({ where: { id: userAlice.id } }).catch(() => {});
    if (userBob) await prisma.user.delete({ where: { id: userBob.id } }).catch(() => {});
  });

  describe('👥 다중 유저 상호작용 (Mention, Reaction, Attachment, Reply) 시나리오 검증', () => {
    it('Step 1: Alice가 댓글 작성 및 Bob @Mention + 파일(design_doc.pdf) 첨부', async () => {
      // 1-1. Alice가 댓글 작성 및 Bob 멘션
      const commentRes = await request(app)
        .post('/api/comments/create')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          issueId: testIssue.id,
          content: 'Hey @Bob, please check the attached design specification!',
          mentionedUserIds: [userBob.id]
        });

      expect(commentRes.status).toBe(201);
      expect(commentRes.body).toHaveProperty('id');
      aliceCommentId = commentRes.body.id;

      // 1-2. 해당 댓글에 Alice가 파일 첨부
      const attachment = await createAttachmentService({
        filename: 'design_doc.pdf',
        originalName: 'design_doc.pdf',
        url: 'https://cdn.antigravity.io/files/design_doc.pdf',
        size: 204800,
        mimeType: 'application/pdf',
        issueId: testIssue.id,
        commentId: aliceCommentId,
        uploaderId: userAlice.id
      });

      expect(attachment).toHaveProperty('id');
      aliceAttachmentId = attachment.id;
    });

    it('Step 2: Bob이 Alice의 댓글에 이모지 Reaction(👍) 등록', async () => {
      const reactionRes = await request(app)
        .post('/api/comments/addReaction')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          commentId: aliceCommentId,
          emoji: '👍'
        });

      expect(reactionRes.status).toBe(201);
      expect(reactionRes.body).toHaveProperty('emoji', '👍');
      expect(reactionRes.body).toHaveProperty('userId', userBob.id);
    });

    it('Step 3: Bob이 Alice의 댓글에 대댓글(Reply) 작성하며 Alice @Mention + 스크린샷 이미지 첨부', async () => {
      // 3-1. Bob이 Alice 댓글의 대댓글(parentId) 작성 및 Alice 멘션
      const replyRes = await request(app)
        .post('/api/comments/create')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          issueId: testIssue.id,
          parentId: aliceCommentId,
          content: 'Thanks @Alice! Looks great, I attached the implementation screenshot.',
          mentionedUserIds: [userAlice.id]
        });

      expect(replyRes.status).toBe(201);
      expect(replyRes.body).toHaveProperty('id');
      expect(replyRes.body.parentId).toBe(aliceCommentId);
      bobCommentId = replyRes.body.id;

      // 3-2. Bob이 대댓글에 이미지 첨부
      const attachment = await createAttachmentService({
        filename: 'screenshot.png',
        originalName: 'screenshot.png',
        url: 'https://cdn.antigravity.io/files/screenshot.png',
        size: 102400,
        mimeType: 'image/png',
        issueId: testIssue.id,
        commentId: bobCommentId,
        uploaderId: userBob.id
      });

      expect(attachment).toHaveProperty('id');
      bobAttachmentId = attachment.id;
    });

    it('Step 4: Alice가 Bob의 대댓글에 이모지 Reaction(❤️) 등록', async () => {
      const reactionRes = await request(app)
        .post('/api/comments/addReaction')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          commentId: bobCommentId,
          emoji: '❤️'
        });

      expect(reactionRes.status).toBe(201);
      expect(reactionRes.body).toHaveProperty('emoji', '❤️');
      expect(reactionRes.body).toHaveProperty('userId', userAlice.id);
    });

    it('Step 5: GET /api/comments/list/:issueId ➔ 댓글 계층, 멘션, 리액션, 첨부파일 전체 데이터 종합 검증', async () => {
      const listRes = await request(app)
        .get(`/api/comments/list/${testIssue.id}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBeGreaterThanOrEqual(1);

      // 루트 댓글 (Alice 작성)
      const rootComment = listRes.body.find((c: any) => c.id === aliceCommentId);
      expect(rootComment).toBeDefined();
      expect(rootComment.author.email).toBe(userAlice.email);

      // Alice 댓글의 멘션 (Bob 멘션 확인)
      expect(rootComment.mentions).toHaveLength(1);
      expect(rootComment.mentions[0].user.id).toBe(userBob.id);

      // Alice 댓글의 첨부파일 확인
      expect(rootComment.attachments).toHaveLength(1);
      expect(rootComment.attachments[0].filename).toBe('design_doc.pdf');

      // Alice 댓글의 리액션 (Bob의 👍 확인)
      expect(rootComment.reactions).toHaveLength(1);
      expect(rootComment.reactions[0].emoji).toBe('👍');
      expect(rootComment.reactions[0].userId).toBe(userBob.id);

      // Alice 댓글의 대댓글 (Bob 작성 확인)
      expect(rootComment.children).toHaveLength(1);
      const childComment = rootComment.children[0];
      expect(childComment.id).toBe(bobCommentId);
      expect(childComment.author.id).toBe(userBob.id);

      // Bob 대댓글의 리액션 (Alice의 ❤️ 확인)
      expect(childComment.reactions).toHaveLength(1);
      expect(childComment.reactions[0].emoji).toBe('❤️');
      expect(childComment.reactions[0].userId).toBe(userAlice.id);
    });
  });
});
