﻿﻿import { Router } from 'express';
import * as gitController from './gitPlugin.controller.js';
import { requireAuth } from '../../../common/middlewares/authMiddleware.js';
import { requireWorkspaceAccess } from '../../../common/middlewares/workspaceMiddleware.js';

export const gitPluginRouter = Router();

// 1. Webhook 수신 엔드포인트 (외부 GitHub/GitLab에서 직접 호출 - 퍼블릭)
gitPluginRouter.post('/webhook', gitController.handleWebhook);

// 아래 모든 API는 인증 및 워크스페이스 컨텍스트 필요
gitPluginRouter.use(requireAuth);
gitPluginRouter.use(requireWorkspaceAccess);

// 2. 플러그인 설정 조회 및 저장
gitPluginRouter.get('/config', gitController.getGitConfig);
gitPluginRouter.post('/config', gitController.updateGitConfig);

// 3. 연결 테스트 (PAT 토큰 유효성 검증)
gitPluginRouter.post('/test-connection', gitController.testGitConnection);

// 4. 프로젝트-저장소 매핑
gitPluginRouter.get('/mappings', gitController.getRepoMappings);
gitPluginRouter.post('/mappings', gitController.createRepoMapping);
gitPluginRouter.delete('/mappings/:id', gitController.deleteRepoMapping);

// 5. 일감 상세 연동 Git 데이터 조회
gitPluginRouter.get('/issues/:issueId', gitController.getIssueGitData);

// 6. 브랜치 생성 및 PR/MR 생성
gitPluginRouter.post('/branches', gitController.createBranch);
gitPluginRouter.post('/pull-requests', gitController.createPullRequest);

// 7. CI/CD 파이프라인 상태 조회
gitPluginRouter.get('/pipelines/:repoMappingId', gitController.getPipelines);
