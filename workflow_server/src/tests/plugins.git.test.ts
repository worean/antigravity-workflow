import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [plugins.git] Git Integration Plugin REST API & Services Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: any;
  let authToken: string;
  let testProject: any;
  let testIssue: any;
  let testWorklog: any;
  let createdMappingId: number;


  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'git-plugin-test-user@example.com' },
      update: {},
      create: {
        email: 'git-plugin-test-user@example.com',
        name: 'Git Tester',
        role: 'ADMIN',
      },
    });

    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Git Plugin Project',
        key: 'GIT_' + Date.now(),
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id,
      },
    });

    let issueStatus = await prisma.issueStatus.findFirst({ where: { category: 'IN_PROGRESS' } });
    if (!issueStatus) issueStatus = await prisma.issueStatus.create({ data: { name: 'In Progress', category: 'IN_PROGRESS' } });
    let doneStatus = await prisma.issueStatus.findFirst({ where: { category: 'DONE' } });
    if (!doneStatus) await prisma.issueStatus.create({ data: { name: 'Done', category: 'DONE' } });

    testIssue = await prisma.issue.create({
      data: {
        title: 'Git Plugin Implementation Task',
        issueNumber: 101,
        projectId: testProject.id,
        authorId: testUser.id,
        statusId: issueStatus.id,
        priorityId: priority.id,
      },
    });

    testWorklog = await prisma.worklog.create({
      data: {
        issueId: testIssue.id,
        userId: testUser.id,
        timeSpent: 60,
        description: 'Implementing Git plugin features',
      },
    });
  });

  afterAll(async () => {
    if (createdMappingId) {
      await prisma.gitRepositoryMapping.delete({ where: { id: createdMappingId } }).catch(() => {});
    }
    if (testWorklog) {
      await prisma.gitWorklogCommitLink.deleteMany({ where: { worklogId: testWorklog.id } }).catch(() => {});
      await prisma.worklog.delete({ where: { id: testWorklog.id } }).catch(() => {});
    }
    if (testIssue) {
      await prisma.gitPullRequest.deleteMany({ where: { issueId: testIssue.id } }).catch(() => {});
      await prisma.gitCommitLink.deleteMany({ where: { issueId: testIssue.id } }).catch(() => {});
      await prisma.issue.delete({ where: { id: testIssue.id } }).catch(() => {});
    }

    if (testProject) {
      await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    }
    if (testUser) {
      await prisma.gitPluginConfig.deleteMany({ where: { workspaceId: 1 } }).catch(() => {});
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
  });

  describe('1. Git 플러그인 설정 및 인증 (Config & Auth)', () => {
    it('TC-POS-01: GET /api/plugins/git/config - 플러그인 설정 기본값 조회', async () => {
      const res = await request(app)
        .get('/api/plugins/git/config')
        .set('Authorization', 'Bearer ' + authToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.config).toBeDefined();
      expect(res.body.config.provider).toBeDefined();
      expect(res.body.config.webhookUrl).toContain('/api/plugins/git/webhook');
    });

    it('TC-POS-02: POST /api/plugins/git/config - 플러그인 활성화 및 PAT 암호화 저장', async () => {
      const res = await request(app)
        .post('/api/plugins/git/config')
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          isEnabled: true,
          provider: 'GITHUB',
          serverUrl: 'https://api.github.com',
          token: 'ghp_secret_access_token_12345678',
          webhookSecret: 'my_webhook_secret_key',
          autoCloseIssueOnMerge: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.config.isEnabled).toBe(true);
      expect(res.body.config.hasToken).toBe(true);
      expect(res.body.config.maskedToken).toContain('************');
      expect(res.body.config.maskedToken).not.toBe('ghp_secret_access_token_12345678');
    });

    it('TC-NEG-01: POST /api/plugins/git/test-connection - 빈 토큰 검증 시 400 반환', async () => {
      const res = await request(app)
        .post('/api/plugins/git/test-connection')
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          provider: 'GITHUB',
          token: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Token');
    });

    it('TC-POS-02-B: POST /api/plugins/git/test-connection - __SAVED_TOKEN__ 전송 시 저장된 토큰 복호화 사용', async () => {
      // TC-POS-02에서 저장된 토큰이 있으므로 __SAVED_TOKEN__으로 연결 테스트를 호출하면 복호화된 토큰으로 verifyToken 시도
      const res = await request(app)
        .post('/api/plugins/git/test-connection')
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          provider: 'GITHUB',
          token: '__SAVED_TOKEN__',
        });

      // 모의 또는 실제 호출 시 400(가짜 토큰이므로 GitHub Auth Failed)이더라도 메시지에 __SAVED_TOKEN__이 아닌 실제 검증 결과가 와야 함
      expect(res.body.message).not.toContain('__SAVED_TOKEN__');
      expect(res.body.message).toContain('GitHub Auth Failed');
    });
  });

  describe('2. 프로젝트 - Git 저장소 매핑 (Repository Mapping)', () => {
    it('TC-POS-03: POST /api/plugins/git/mappings - 프로젝트에 Git 리포지토리 매핑 등록', async () => {
      const res = await request(app)
        .post('/api/plugins/git/mappings')
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          projectId: testProject.id,
          repoIdentifier: 'antigravity-org/core-service',
          defaultBranch: 'main',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.mapping.repoIdentifier).toBe('antigravity-org/core-service');
      createdMappingId = res.body.mapping.id;
    });

    it('TC-NEG-02: POST /api/plugins/git/mappings - 중복 매핑 시도 시 400 차단', async () => {
      const res = await request(app)
        .post('/api/plugins/git/mappings')
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          projectId: testProject.id,
          repoIdentifier: 'antigravity-org/core-service',
          defaultBranch: 'main',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('TC-POS-04: GET /api/plugins/git/mappings - 매핑 목록 조회', async () => {
      const res = await request(app)
        .get('/api/plugins/git/mappings?projectId=' + testProject.id)
        .set('Authorization', 'Bearer ' + authToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mappings)).toBe(true);
      expect(res.body.mappings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mappings[0].repoIdentifier).toBe('antigravity-org/core-service');
    });

    it('TC-POS-04-B: GET /api/plugins/git/remote-repos - 원격 저장소 목록 조회 API 응답 확인', async () => {
      const res = await request(app)
        .get(`/api/plugins/git/remote-repos?projectId=${testProject.id}`)
        .set('Authorization', 'Bearer ' + authToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.repositories)).toBe(true);
    });
  });

  describe('3. 일감 상세 연동 Git 데이터 (Issue Git Integration)', () => {
    it('TC-POS-05: GET /api/plugins/git/issues/:issueId - 일감 연동 Git 정보 조회', async () => {
      const res = await request(app)
        .get('/api/plugins/git/issues/' + testIssue.id)
        .set('Authorization', 'Bearer ' + authToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issueId).toBe(testIssue.id);
      expect(res.body.data.availableRepositories).toBeDefined();
      expect(Array.isArray(res.body.data.pullRequests)).toBe(true);
      expect(Array.isArray(res.body.data.commits)).toBe(true);
    });
  });

  describe('4. 웹훅 수신 및 자동화 처리 (Webhook Automation)', () => {
    it('TC-POS-06: POST /api/plugins/git/webhook - Push 웹훅 이벤트 수신 시 일감 커밋 자동 바인딩', async () => {
      const pushPayload = {
        repository: {
          full_name: 'antigravity-org/core-service',
          name: 'core-service',
        },
        commits: [
          {
            id: 'd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
            message: 'feat(git): add commit parser for issue #' + testIssue.issueNumber,
            author: {
              name: 'Git Tester',
              email: 'tester@example.com',
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const res = await request(app)
        .post('/api/plugins/git/webhook?ws=1')
        .set('x-github-event', 'push')
        .send(pushPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.processedCount).toBeGreaterThanOrEqual(1);

      const issueGitRes = await request(app)
        .get('/api/plugins/git/issues/' + testIssue.id)
        .set('Authorization', 'Bearer ' + authToken);

      expect(issueGitRes.body.data.commits.length).toBeGreaterThanOrEqual(1);
      expect(issueGitRes.body.data.commits[0].commitHash).toBe('d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0');
    });

    it('TC-POS-07: POST /api/plugins/git/webhook - PR Merged 웹훅 수신 시 일감 상태 자동 DONE 완료', async () => {
      const prPayload = {
        action: 'closed',
        repository: {
          full_name: 'antigravity-org/core-service',
        },
        pull_request: {
          number: 55,
          title: 'Resolve issue #' + testIssue.issueNumber + ' with git plugin',
          body: 'This PR resolves #' + testIssue.issueNumber,
          merged: true,
          state: 'closed',
          head: { ref: 'feat/plugin-git' },
          base: { ref: 'main' },
          user: { login: 'git-contributor' },
          html_url: 'https://github.com/antigravity-org/core-service/pull/55',
        },
      };

      const res = await request(app)
        .post('/api/plugins/git/webhook?ws=1')
        .set('x-github-event', 'pull_request')
        .send(prPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedIssue = await prisma.issue.findUnique({
        where: { id: testIssue.id },
        include: { status: true },
      });

      expect(updatedIssue?.status.category).toBe('DONE');
    });
  });

  describe('5. 이슈 및 작업로그 커밋 수동 연결/해제 (Commit Linking)', () => {
    let createdCommitLinkId: number;

    it('TC-POS-09: POST /api/plugins/git/issues/:issueId/commits - 이슈에 커밋 수동 연결 (1:N)', async () => {
      const res = await request(app)
        .post(`/api/plugins/git/issues/${testIssue.id}/commits`)
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          repoMappingId: createdMappingId,
          commitHash: 'a1b2c3d4e5f678901234567890abcdef12345678',
          message: 'feat: add manual commit link to issue',
          authorName: 'Developer Kim',
          authorEmail: 'dev.kim@example.com',
          committedAt: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.commitLink).toBeDefined();
      expect(res.body.commitLink.commitHash).toBe('a1b2c3d4e5f678901234567890abcdef12345678');
      createdCommitLinkId = res.body.commitLink.id;
    });

    it('TC-POS-10: POST /api/plugins/git/worklogs/:worklogId/commit - 작업로그에 1개 커밋 연결 (1:1)', async () => {
      const res = await request(app)
        .post(`/api/plugins/git/worklogs/${testWorklog.id}/commit`)
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          repoMappingId: createdMappingId,
          commitHash: 'b2c3d4e5f6a178901234567890abcdef12345678',
          message: 'refactor: worklog linked commit implementation',
          authorName: 'Developer Park',
          authorEmail: 'dev.park@example.com',
          committedAt: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.worklogCommit).toBeDefined();
      expect(res.body.worklogCommit.commitHash).toBe('b2c3d4e5f6a178901234567890abcdef12345678');
      expect(res.body.worklogCommit.worklogId).toBe(testWorklog.id);
    });

    it('TC-POS-11: GET /api/worklogs - 작업로그 조회 시 연결된 Git 커밋 정보 함께 반환 확인', async () => {
      const res = await request(app)
        .get(`/api/worklogs?issueId=${testIssue.id}`)
        .set('Authorization', 'Bearer ' + authToken);

      expect(res.status).toBe(200);
      const found = res.body.find((w: any) => w.id === testWorklog.id);
      expect(found).toBeDefined();
      expect(found.gitCommit).toBeDefined();
      expect(found.gitCommit.commitHash).toBe('b2c3d4e5f6a178901234567890abcdef12345678');
      expect(found.gitCommit.repoMapping.repoIdentifier).toBe('antigravity-org/core-service');
    });

    it('TC-POS-12: DELETE /api/plugins/git/worklogs/:worklogId/commit - 작업로그 커밋 연결 해제', async () => {
      const res = await request(app)
        .delete(`/api/plugins/git/worklogs/${testWorklog.id}/commit`)
        .set('Authorization', 'Bearer ' + authToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.gitWorklogCommitLink.findUnique({
        where: { worklogId: testWorklog.id },
      });
      expect(check).toBeNull();
    });

    it('TC-POS-13: DELETE /api/plugins/git/issues/:issueId/commits/:commitLinkId - 이슈 커밋 연결 해제', async () => {
      const res = await request(app)
        .delete(`/api/plugins/git/issues/${testIssue.id}/commits/${createdCommitLinkId}`)
        .set('Authorization', 'Bearer ' + authToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.gitCommitLink.findUnique({
        where: { id: createdCommitLinkId },
      });
      expect(check).toBeNull();
    });
  });

  describe('6. 저장소 매핑 삭제 (Clean up Mapping)', () => {

    it('TC-POS-08: DELETE /api/plugins/git/mappings/:id - 저장소 매핑 정상 해제', async () => {
      const res = await request(app)
        .delete('/api/plugins/git/mappings/' + createdMappingId)
        .set('Authorization', 'Bearer ' + authToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
