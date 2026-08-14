import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

describe('🧪 Full E2E REST API CRUD Test Suite', () => {
  let authToken: string;
  let testUserId: number;
  let testProjectId: number;
  let testSprintId: number;
  let testIssueId: number;
  let testCommentId: number;
  let testWorklogId: number;
  let testCustomFieldId: number;

  const testUserEmail = `crud_user_${Date.now()}@example.com`;
  const testUserPassword = 'password123';
  const testUserName = 'API Test User';

  beforeAll(async () => {
    // 테스트 준비: 메타데이터 기본 데이터가 DB에 있는지 확인
    const issueType = await prisma.issueType.findFirst();
    if (!issueType) {
      await prisma.issueType.create({ data: { name: 'Task', isSystem: true } });
    }
    const issuePriority = await prisma.issuePriority.findFirst();
    if (!issuePriority) {
      await prisma.issuePriority.create({ data: { name: 'Medium', level: 2, isSystem: true } });
    }
    const issueStatus = await prisma.issueStatus.findFirst();
    if (!issueStatus) {
      await prisma.issueStatus.create({ data: { name: 'To Do', category: 'TODO', isSystem: true } });
    }
    const projectPriority = await prisma.projectPriority.findFirst();
    if (!projectPriority) {
      await prisma.projectPriority.create({ data: { name: 'Normal', level: 1, isSystem: true } });
    }
    const projectStatus = await prisma.projectStatus.findFirst();
    if (!projectStatus) {
      await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS', isSystem: true } });
    }
  });

  // 1️⃣ Auth & User CRUD
  it('1.1 [POST /api/users] 신규 회원 가입 (Create User)', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        email: testUserEmail,
        password: testUserPassword,
        name: testUserName,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(testUserEmail);
    testUserId = res.body.id;
  });

  it('1.2 [POST /api/auth/login] 이메일 로그인 및 JWT 발급', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testUserPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUserEmail);
    authToken = res.body.token;
  });

  it('1.3 [GET /api/auth/me] 본인 프로필 정보 조회', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(testUserId);
    expect(res.body.user.name).toBe(testUserName);
  });

  it('1.4 [GET /api/users] 유저 목록 조회', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('1.5 [PUT /api/users/:id] 유저 정보 수정 (Update User)', async () => {
    const updatedName = 'Updated Test User';
    const res = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: updatedName });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(updatedName);
  });

  // 2️⃣ Project CRUD
  it('2.1 [POST /api/projects] 프로젝트 생성 (Create Project)', async () => {
    const projectKey = `PRJ_${Date.now()}`;
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Full CRUD Test Project',
        key: projectKey,
        description: 'Testing full project CRUD workflow',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.key).toBe(projectKey);
    expect(res.body.ownerId).toBe(testUserId);
    testProjectId = res.body.id;
  });

  it('2.2 [GET /api/projects] 프로젝트 목록 조회', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((p: any) => p.id === testProjectId);
    expect(found).toBeDefined();
  });

  it('2.3 [GET /api/projects/:id] 프로젝트 상세 조회', async () => {
    const res = await request(app)
      .get(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testProjectId);
    expect(res.body).toHaveProperty('members');
    expect(res.body).toHaveProperty('owner');
  });

  it('2.4 [PUT /api/projects/:id] 프로젝트 수정 (Update Project)', async () => {
    const res = await request(app)
      .put(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Project Name',
        description: 'Updated Description',
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Project Name');
  });

  // 3️⃣ Sprint CRUD
  it('3.1 [POST /api/sprints] 스프린트 생성 (Create Sprint)', async () => {
    const res = await request(app)
      .post('/api/sprints')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Sprint 1 - Launch',
        goal: 'Complete initial release',
        projectId: testProjectId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 864000000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.projectId).toBe(testProjectId);
    testSprintId = res.body.id;
  });

  it('3.2 [GET /api/sprints] 프로젝트별 스프린트 목록 조회', async () => {
    const res = await request(app)
      .get(`/api/sprints?projectId=${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((s: any) => s.id === testSprintId)).toBe(true);
  });

  it('3.3 [PUT /api/sprints/:id] 스프린트 수정 (Update Sprint)', async () => {
    const res = await request(app)
      .put(`/api/sprints/${testSprintId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Sprint 1 - Updated',
        status: 'ACTIVE',
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Sprint 1 - Updated');
    expect(res.body.status).toBe('ACTIVE');
  });

  // 4️⃣ Issue CRUD & Interactions
  it('4.1 [POST /api/issues] 이슈 생성 (Create Issue)', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'API Integration Task Issue',
        description: 'Complete full REST API testing',
        projectId: testProjectId,
        sprintId: testSprintId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('API Integration Task Issue');
    expect(res.body.projectId).toBe(testProjectId);
    testIssueId = res.body.id;
  });

  it('4.2 [GET /api/issues] 프로젝트/스프린트 이슈 목록 조회', async () => {
    const res = await request(app)
      .get(`/api/issues?projectId=${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const issue = res.body.find((i: any) => i.id === testIssueId);
    expect(issue).toBeDefined();
    expect(issue).toHaveProperty('likesCount');
  });

  it('4.3 [GET /api/issues/:id] 이슈 상세 조회', async () => {
    const res = await request(app)
      .get(`/api/issues/${testIssueId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testIssueId);
    expect(res.body.title).toBe('API Integration Task Issue');
    expect(res.body).toHaveProperty('likesCount');
    expect(res.body).toHaveProperty('isLiked');
  });

  it('4.4 [PUT /api/issues/:id] 이슈 수정 (Update Issue)', async () => {
    const res = await request(app)
      .put(`/api/issues/${testIssueId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Issue Title',
        description: 'Updated issue description content',
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Issue Title');
  });

  it('4.5 [POST /api/issues/toggle-like] 이슈 좋아요 토글', async () => {
    const res = await request(app)
      .post('/api/issues/toggle-like')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ issueId: testIssueId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('isLiked');
    expect(res.body).toHaveProperty('likesCount');
  });

  // 5️⃣ Comments CRUD
  it('5.1 [POST /api/comments] 이슈 댓글 등록 (Create Comment)', async () => {
    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'This is a test comment for full API verification',
        issueId: testIssueId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.content).toBe('This is a test comment for full API verification');
    testCommentId = res.body.id;
  });

  it('5.2 [GET /api/comments/issue/:issueId] 이슈별 댓글 목록 조회', async () => {
    const res = await request(app)
      .get(`/api/comments/issue/${testIssueId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c: any) => c.id === testCommentId)).toBe(true);
  });

  it('5.3 [POST /api/comments/:id/reactions] 댓글에 이모지 반응 추가', async () => {
    const res = await request(app)
      .post(`/api/comments/${testCommentId}/reactions`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ emoji: '👍' });

    expect(res.status).toBe(201);
    expect(res.body.emoji).toBe('👍');
  });

  // 6️⃣ Worklog & Custom Fields CRUD
  it('6.1 [POST /api/worklogs] 작업 로그 작성 (Create Worklog)', async () => {
    const res = await request(app)
      .post('/api/worklogs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        issueId: testIssueId,
        timeSpent: 120, // 2시간
        comment: 'Worked on API testing script',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.timeSpent).toBe(120);
    testWorklogId = res.body.id;
  });

  it('6.2 [POST /api/custom-fields] 커스텀 필드 생성', async () => {
    const timestamp = Date.now();
    const res = await request(app)
      .post('/api/custom-fields')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        key: `risk_level_${timestamp}`,
        name: `Risk Level ${timestamp}`,
        fieldType: 'TEXT',
        projectId: testProjectId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    testCustomFieldId = res.body.id;
  });

  // 7️⃣ Delete Cleanup Test
  it('7.1 [DELETE /api/comments/:id] 댓글 삭제', async () => {
    const res = await request(app)
      .delete(`/api/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });

  it('7.2 [DELETE /api/issues/:id] 이슈 삭제 (PM 권한)', async () => {
    const res = await request(app)
      .delete(`/api/issues/${testIssueId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });

  it('7.3 [DELETE /api/projects/:id] 프로젝트 삭제 (PM 권한)', async () => {
    const res = await request(app)
      .delete(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });

  it('7.4 [DELETE /api/users/:id] 생성했던 테스트 유저 삭제', async () => {
    const res = await request(app)
      .delete(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });
});
