import { Router } from 'express';
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

// 8. 연결된 원격 Git 계정(GitHub/GitLab)의 전체 리포지토리 목록 조회
gitPluginRouter.get('/remote-repos', gitController.listRemoteRepositories);

// 9. 특정 저장소 매핑의 커밋 로그 목록 조회 (Git Log 뷰어)
gitPluginRouter.get('/repos/:repoMappingId/commits', gitController.listRepoCommits);

// 10. 특정 커밋 상세 정보 조회 (파일 변경 및 Unified Diff)
gitPluginRouter.get('/repos/:repoMappingId/commits/:sha', gitController.getCommitDetail);

// 11. 이슈에 커밋 수동 연결 및 해제 (1:N)
gitPluginRouter.post('/issues/:issueId/commits', gitController.linkCommitToIssue);
gitPluginRouter.post('/issues/:issueId/commits/batch', gitController.batchLinkCommitsToIssue);
gitPluginRouter.delete('/issues/:issueId/commits/:commitLinkId', gitController.unlinkCommitFromIssue);

// 12. 작업로그에 커밋 연결 및 해제 (1:1)
gitPluginRouter.post('/worklogs/:worklogId/commit', gitController.linkCommitToWorklog);
gitPluginRouter.delete('/worklogs/:worklogId/commit', gitController.unlinkCommitFromWorklog);

// 13. Pull Request 커밋 동기화 (PR 커밋을 이슈 커밋으로 일괄 등록)
gitPluginRouter.post('/pull-requests/:prId/sync-commits', gitController.syncPullRequestCommits);
gitPluginRouter.post('/pull-requests/sync-commits', gitController.syncPullRequestCommits);


