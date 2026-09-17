/**
 * 🧪 [Domain: comments / Service: deletedParentReplies]
 * - 기능: 상위 댓글이 삭제되었을 때 대댓글 보존 및 가상 부모 표현 단위 및 REST API 테스트
 * - 경우의 수:
 *   1) 상위 댓글 삭제 후 대댓글들이 '삭제된 댓글' 가상 부모 하위에 유지되는지 검증
 *   2) 동일한 삭제된 상위 댓글에 달린 여러 대댓글이 하나의 가상 부모 아래 함께 묶이는지 검증
 *   3) 대댓글 개별 삭제 시 남은 대댓글이 계속 유지되는지 검증
 *   4) 모든 대댓글 삭제 시 가상 부모도 완전히 정리되는지 검증
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [comments.deletedParentReplies] Orphan Replies Under Deleted Parent Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let userAlice: any;
  let userBob: any;
  let aliceToken: string;
  let bobToken: string;
  let testProject: any;
  let testIssue: any;
  let parentCommentId: number;
  let childComment1Id: number;
  let childComment2Id: number;

  beforeAll(async () => {
    userAlice = await prisma.user.upsert({
      where: { email: 'orphan-test-alice@example.com' },
      update: {},
      create: { email: 'orphan-test-alice@example.com', name: 'Alice Parent' }
    });
    aliceToken = jwt.sign({ userId: userAlice.id, email: userAlice.email }, jwtSecret, { expiresIn: '1h' });

    userBob = await prisma.user.upsert({
      where: { email: 'orphan-test-bob@example.com' },
      update: {},
      create: { email: 'orphan-test-bob@example.com', name: 'Bob Replier' }
    });
    bobToken = jwt.sign({ userId: userBob.id, email: userBob.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Orphan Comments Test Project',
        key: `OCTP_${Date.now()}`,
        ownerId: userAlice.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    testIssue = await createIssueService({
      title: 'Orphan Replies Test Issue',
      projectId: testProject.id,
      authorId: userAlice.id
    });
  });

  afterAll(async () => {
    await prisma.comment.deleteMany({ where: { issueId: testIssue?.id } }).catch(() => {});
    if (testIssue) await prisma.issue.delete({ where: { id: testIssue.id } }).catch(() => {});
    if (testProject) await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    if (userAlice) await prisma.user.delete({ where: { id: userAlice.id } }).catch(() => {});
    if (userBob) await prisma.user.delete({ where: { id: userBob.id } }).catch(() => {});
  });

  it('Step 1: Alice가 상위 댓글을 작성하고, Bob이 2개의 대댓글을 작성한다', async () => {
    // 1. 상위 댓글 생성
    const parentRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        issueId: testIssue.id,
        content: 'Alice의 원본 상위 댓글입니다.'
      });
    expect(parentRes.status).toBe(201);
    parentCommentId = parentRes.body.id;

    // 2. Bob 대댓글 1 작성
    const child1Res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        issueId: testIssue.id,
        parentId: parentCommentId,
        content: 'Bob의 첫 번째 대댓글입니다.'
      });
    expect(child1Res.status).toBe(201);
    childComment1Id = child1Res.body.id;

    // 3. Bob 대댓글 2 작성
    const child2Res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        issueId: testIssue.id,
        parentId: parentCommentId,
        content: 'Bob의 두 번째 대댓글입니다.'
      });
    expect(child2Res.status).toBe(201);
    childComment2Id = child2Res.body.id;
  });

  it('Step 2: 상위 댓글 삭제 시 대댓글들은 사라지지 않고 가상 부모(삭제된 댓글) 아래에 묶여 유지된다', async () => {
    // 1. 상위 댓글 삭제
    const delRes = await request(app)
      .delete(`/api/comments/delete/${parentCommentId}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(delRes.status).toBe(200);

    // 2. 댓글 목록 조회
    const listRes = await request(app)
      .get(`/api/comments/list/${testIssue.id}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    const virtualParent = listRes.body[0];
    expect(virtualParent.isDeletedParent).toBe(true);
    expect(virtualParent.content).toBe('삭제된 댓글입니다.');
    expect(virtualParent.children).toHaveLength(2);

    expect(virtualParent.children[0].id).toBe(childComment1Id);
    expect(virtualParent.children[0].content).toBe('Bob의 첫 번째 대댓글입니다.');
    expect(virtualParent.children[0].author.name).toBe('Bob Replier');

    expect(virtualParent.children[1].id).toBe(childComment2Id);
    expect(virtualParent.children[1].content).toBe('Bob의 두 번째 대댓글입니다.');
    expect(virtualParent.children[1].author.name).toBe('Bob Replier');
  });

  it('Step 3: 가상 부모에 속한 대댓글 중 1개를 삭제해도 나머지 대댓글은 정상 유지된다', async () => {
    // 1. Bob의 첫 번째 대댓글 삭제
    const delChild1Res = await request(app)
      .delete(`/api/comments/delete/${childComment1Id}`)
      .set('Authorization', `Bearer ${bobToken}`);
    expect(delChild1Res.status).toBe(200);

    // 2. 댓글 목록 조회
    const listRes = await request(app)
      .get(`/api/comments/list/${testIssue.id}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].isDeletedParent).toBe(true);
    expect(listRes.body[0].children).toHaveLength(1);
    expect(listRes.body[0].children[0].id).toBe(childComment2Id);
  });

  it('Step 4: 마지막 남은 대댓글까지 모두 삭제되면 가상 부모 댓글도 목록에서 제거된다', async () => {
    // 1. Bob의 두 번째 대댓글 삭제
    const delChild2Res = await request(app)
      .delete(`/api/comments/delete/${childComment2Id}`)
      .set('Authorization', `Bearer ${bobToken}`);
    expect(delChild2Res.status).toBe(200);

    // 2. 댓글 목록 조회
    const listRes = await request(app)
      .get(`/api/comments/list/${testIssue.id}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(0);
  });
});