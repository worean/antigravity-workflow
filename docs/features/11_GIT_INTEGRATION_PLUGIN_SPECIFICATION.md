# 📋 Git 연동 플러그인 (GitHub & GitLab) 기능 기획 사양서

> **문서 상태**: In Review (기획 리뷰 중)  
> **기능 ID**: `FEAT-PLUGIN-GIT-01`  
> **대상 도메인**: `plugins/git` (GitHub & GitLab Integration)  
> **작성자 / 일자**: `spec-planner` / `2026-10-14`  
> **관련 문서**: [GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md) (AntiGravity 아키텍처 및 4-Phase 라이프사이클 준수)

---

## 1. 기능 개요 및 사용자 가치 (Feature Overview)

### 1.1 배경 및 목적 (Background & Objective)
- **배경**:
  - 소프트웨어 개발팀은 일감 관리 툴(AntiGravity)과 소스코드 형상관리(GitHub / GitLab) 사이를 번갈아 이동하며 커밋, PR/MR 생성, 코드 리뷰, CI/CD 파이프라인 모니터링을 개별적으로 수행하고 있습니다.
  - 모든 사용자에게 Git 기능이 필수는 아니므로(비개발 직군, 기획/디자인 등), 메인 코어의 무게를 가볍게 유지하면서 개발팀만 선택적으로 켜고 끌 수 있는 **플러그인(Plugin) 아키텍처**로 제공해야 합니다.
- **목적**:
  - GitHub와 GitLab의 핵심 기능(Webhook, PR/MR 관리, 커밋/브랜치 연동, CI/CD 빌드 상태 조회, Release 배포)을 AntiGravity 내에서 원스톱으로 처리할 수 있는 통합 개발 플러그인을 구축합니다.
  - 일감 번호(예: `#123`, `AG-123`) 기반의 자동 브랜치 생성, 커밋 링크, PR 머지 시 일감 상태 자동 완료 등의 스마트 자동화 워크플로우를 제공합니다.

### 1.2 핵심 사용자 시나리오 (User Journey & Core Value)
1. **플러그인 활성화 및 인증 연동**:
   - 워크스페이스 관리자가 `설정 > 플러그인 관리`에서 'Git Integration Plugin'을 활성화하고 GitHub 또는 GitLab Personal Access Token / OAuth를 등록합니다.
2. **프로젝트 - Git 저장소 매핑**:
   - AntiGravity 프로젝트 단위로 대상 GitHub/GitLab 리포지토리를 1:1 또는 1:N으로 연결합니다.
3. **일감 상세 내 Git 탭 원스톱 제어**:
   - 일감 상세 드로어에서 관련 브랜치 생성, 연결된 커밋 목록 확인, PR/MR 생성 및 머지 상태를 실시간 확인합니다.
4. **CI/CD 파이프라인 모니터링 & 트리거**:
   - GitHub Actions 또는 GitLab CI/CD 파이프라인 상태(성공, 실패, 진행 중)를 일감 및 프로젝트 화면에서 즉시 확인하고 재실행합니다.
5. **실시간 Webhook 이벤트 자동화**:
   - Git 리포지토리에서 Push, PR 개설, PR 머지 발생 시 Webhook을 수신하여 AntiGravity 일감의 진행 상태를 자동으로 변경하고 알림을 발송합니다.

### 1.3 사용자 권한 및 접근 제어 (Authorization & Scope)
- **적용 스코프**: 단일 워크스페이스(Workspace-Tenant 격리)
- **필요 권한**:
  - `ADMIN`: 플러그인 활성화/비활성화, 전역 토큰 및 Webhook 시크릿 설정, 저장소 매핑 관리.
  - `MEMBER`: 매핑된 저장소의 브랜치 생성, 커밋 조회, PR/MR 생성 및 리뷰 코멘트 작성, CI/CD 재실행.
  - `VIEWER`: Git 연동 현황(커밋, PR 상태, CI/CD 결과) 읽기 전용 조회.

---

## 2. 데이터 모델 및 비즈니스 규칙 (Data Model & Business Rules)

### 2.1 데이터베이스 스키마 요구사항 (Prisma Schema Target)
- **대상 DB**: `workflow_server/prisma/schema.workspace.prisma`
- **신규 모델 명세**:

```prisma
// 1. 워크스페이스별 Git 플러그인 활성화 및 인증 설정
model GitPluginConfig {
  id               Int       @id @default(autoincrement())
  workspaceId      Int       @unique
  isEnabled        Boolean   @default(false)
  provider         String    @default("GITHUB") // GITHUB | GITLAB
  serverUrl        String?   // GitLab Self-hosted용 (기본: https://gitlab.com 또는 https://api.github.com)
  encryptedToken   String?   // 암호화된 Access Token
  webhookSecret    String?   // Webhook 무결성 검증용 시크릿 키
  autoCloseIssueOnMerge Boolean @default(true) // PR/MR 머지 시 일감 자동 완료 처리 여부
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  repositories     GitRepositoryMapping[]

  @@index([workspaceId])
}

// 2. AntiGravity 프로젝트와 원격 Git 저장소 매핑
model GitRepositoryMapping {
  id              Int              @id @default(autoincrement())
  pluginConfigId  Int
  pluginConfig    GitPluginConfig  @relation(fields: [pluginConfigId], references: [id], onDelete: Cascade)
  projectId       Int              // AntiGravity Project ID
  project         Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  repoIdentifier  String           // "owner/repo" (GitHub) 또는 "group/project" (GitLab)
  defaultBranch   String           @default("main")
  isActive        Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  pullRequests    GitPullRequest[]
  commitLinks     GitCommitLink[]

  @@unique([projectId, repoIdentifier])
  @@index([pluginConfigId])
}

// 3. 일감과 연동된 Pull Request / Merge Request 캐시
model GitPullRequest {
  id               Int                  @id @default(autoincrement())
  repoMappingId    Int
  repoMapping      GitRepositoryMapping @relation(fields: [repoMappingId], references: [id], onDelete: Cascade)
  issueId          Int?                 // 매핑된 AntiGravity 일감 ID
  issue            Issue?               @relation(fields: [issueId], references: [id], onDelete: SetNull)
  prNumber         Int                  // PR 또는 MR 번호
  title            String
  sourceBranch     String
  targetBranch     String
  state            String               // OPEN | MERGED | CLOSED
  authorName       String
  url              String
  ciStatus         String?              // PENDING | RUNNING | SUCCESS | FAILED
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt

  @@unique([repoMappingId, prNumber])
  @@index([issueId])
}

// 4. 일감과 연결된 커밋 내역
model GitCommitLink {
  id              Int                  @id @default(autoincrement())
  repoMappingId   Int
  repoMapping     GitRepositoryMapping @relation(fields: [repoMappingId], references: [id], onDelete: Cascade)
  issueId         Int
  issue           Issue                @relation(fields: [issueId], references: [id], onDelete: Cascade)
  commitHash      String               @db.VarChar(40)
  message         String
  authorName      String
  authorEmail     String?
  committedAt     DateTime
  url             String?              // 원격 GitHub/GitLab 커밋 상세 웹 URL
  createdAt       DateTime             @default(now())

  @@unique([repoMappingId, commitHash, issueId])
  @@index([issueId])
}

// 5. 작업로그와 1:1 연결된 커밋 링크
model GitWorklogCommitLink {
  id              Int                  @id @default(autoincrement())
  worklogId       Int                  @unique // 작업로그 1개당 커밋 1개만 허용 (1:1 보장)
  worklog         Worklog              @relation(fields: [worklogId], references: [id], onDelete: Cascade)
  repoMappingId   Int
  repoMapping     GitRepositoryMapping @relation(fields: [repoMappingId], references: [id], onDelete: Cascade)
  commitHash      String               @db.VarChar(40)
  message         String
  authorName      String
  authorEmail     String?
  committedAt     DateTime
  url             String?              // 원격 커밋 상세 웹 URL
  createdAt       DateTime             @default(now())

  @@index([worklogId])
}

// 6. 웹훅 수신 감사 로그
model GitWebhookLog {
  id          Int      @id @default(autoincrement())
  workspaceId Int
  provider    String   // GITHUB | GITLAB
  eventType   String   // push, pull_request, pipeline 등
  payload     Json
  processed   Boolean  @default(false)
  errorMsg    String?
  createdAt   DateTime @default(now())

  @@index([workspaceId, eventType])
}
```

### 2.2 필드 상세 명세 및 제약조건 (Field Constraints)
| 필드명 | 타입 | 필수 여부 | 기본값 | 제약조건 / 유효성 검사 규칙 |
| :--- | :--- | :---: | :--- | :--- |
| `provider` | String | 필수 | `'GITHUB'` | `'GITHUB'`, `'GITLAB'` 중 하나 |
| `encryptedToken` | String | 선택 | null | 안전한 AES-256 대칭키 암호화 후 저장 |
| `repoIdentifier` | String | 필수 | - | 영문, 숫자, `/`, `-`, `_` 조합의 저장소 식별자 |
| `state` | String | 필수 | `'OPEN'` | `'OPEN'`, `'MERGED'`, `'CLOSED'` 상태 값 유지 |
| `commitHash` | String | 필수 | - | 40자 Git SHA-1 16진수 포맷 검증 |
| `url` | String | 선택 | null | 원격 저장소 커밋/PR 웹 링크 (GitHub/GitLab 브라우저 직접 이동) |

### 2.3 비즈니스 로직 & 엣지 케이스 (Business Logic & Edge Cases)
1. **플러그인 독립성**:
   - `GitPluginConfig.isEnabled === false`인 경우, Git 관련 UI(일감 상세의 Git 탭, 브랜치 생성 버튼 등)는 완전히 숨김 처리됩니다.
2. **토큰 보안**:
   - Personal Access Token은 서버 저장 시 암호화되며, 프론트엔드로 반환될 때는 `********` 마스킹 처리되어 유출을 차단합니다.
3. **Webhook 무결성 서명 검증**:
   - GitHub: `X-Hub-Signature-256` HMAC-SHA256 검증.
   - GitLab: `X-Gitlab-Token` 시크릿 일치 검증.
4. **일감 스마트 연동 규칙**:
   - 커밋 메시지 또는 PR 제목/본문에 `#123` 또는 `ISSUE-123`이 포함되어 있으면 해당 일감과 자동 바인딩.
   - PR 머지 시 `autoCloseIssueOnMerge === true`이면 해당 일감의 상태를 `DONE`으로 자동 변경.
5. **작업로그(Worklog) 커밋 연계 정책 (1:1 관계)**:
   - 작업로그는 엄격히 **1개의 커밋만 가질 수 있습니다 (1:1)**. 여러 개의 커밋을 작업로그로 기록하려면 각각 개별 작업로그를 작성해야 합니다.
   - 작업로그 생성(`POST /api/worklogs`) 또는 커밋 연결(`POST /api/plugins/git/worklogs/:worklogId/commit`) 시 `url`과 `commitHash`가 DB에 영구 저장됩니다.
   - 작업로그에 커밋이 연결되면, 해당 작업로그가 속한 상위 일감(`issueId`)의 커밋 링크(`GitCommitLink`)에도 동일한 커밋이 자동으로 귀속(Upsert)되어 일감 단위의 형상 추적성이 보장됩니다.
6. **이슈 상세화면 커밋 우선순위 및 PR 커밋 일괄 동기화 (커밋 기반 영구 보존 정책)**:
   - PR(Pull Request/Merge Request)은 브랜치 삭제나 외부 리포지토리 재구성 등으로 인해 유실될 수 있으므로, AntiGravity는 **커밋 단위 영구 관리**를 기본 원칙으로 합니다.
   - 일감 상세 화면(`IssueGitSection`) 진입 시 PR 대신 **커밋 히스토리(`commits`) 탭이 기본(우선)으로 표시**되며, 탭 순서도 커밋이 첫 번째, PR이 두 번째로 배치됩니다.
   - 일감에서 PR을 생성하거나 동기화할 때, **해당 PR에 포함된 모든 커밋이 해당 일감의 커밋 히스토리(`GitCommitLink`)로 자동 일괄 등록**됩니다.
7. **AI 및 Workflow 자동화를 위한 백엔드 REST API 지원**:
   - 향후 AI 에이전트 및 자동화 워크플로우 엔진이 백그라운드에서 직접 일감 및 작업로그의 커밋을 관리할 수 있도록 배치(Batch) 등록 및 PR 커밋 자동 동기화 REST API를 완비합니다.

---

## 3. 백엔드 REST API 명세 (Backend API Specifications)

### 3.1 엔드포인트 목록 (Endpoint Summary)
| Action | Method | URL Endpoint | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| 설정 조회 | `GET` | `/api/plugins/git/config` | 인증 사용자 | 현재 워크스페이스의 플러그인 활성화 및 설정 조회 |
| 설정 저장 | `POST` | `/api/plugins/git/config` | 관리자 | 플러그인 On/Off, Provider, 토큰 저장 |
| 연결 테스트 | `POST` | `/api/plugins/git/test-connection` | 관리자 | 입력된 토큰으로 GitHub/GitLab API 유효성 검증 |
| 저장소 매핑 목록 | `GET` | `/api/plugins/git/mappings` | 인증 사용자 | 프로젝트별 연결된 Git 저장소 매핑 목록 |
| 저장소 매핑 등록 | `POST` | `/api/plugins/git/mappings` | 관리자 | 특정 프로젝트에 Git 저장소 연결 매핑 추가 |
| 저장소 매핑 삭제 | `DELETE`| `/api/plugins/git/mappings/:id` | 관리자 | Git 저장소 연결 매핑 해제 |
| 일감 Git 정보 조회 | `GET` | `/api/plugins/git/issues/:issueId` | 인증 사용자 | 특정 일감에 연결된 PR/MR, 커밋 목록 조회 (커밋 탭 우선) |
| 이슈 커밋 수동 연결 | `POST` | `/api/plugins/git/issues/:issueId/commits` | 멤버/관리자 | 일감에 단일 커밋 수동 연결 (`url` 포함) |
| 이슈 커밋 일괄 연결 (AI/배치) | `POST` | `/api/plugins/git/issues/:issueId/commits/batch` | 멤버/관리자 | AI/워크플로우 자동화를 위한 다중 커밋 일괄 등록 |
| 이슈 커밋 연결 해제 | `DELETE`| `/api/plugins/git/issues/:issueId/commits/:commitLinkId` | 멤버/관리자 | 일감과 커밋의 연결 해제 |
| 작업로그 커밋 연결 (1:1) | `POST` | `/api/plugins/git/worklogs/:worklogId/commit` | 멤버/관리자 | 작업로그에 1개 커밋 연결 (상위 일감 커밋 링크 자동 반영) |
| 작업로그 커밋 연결 해제 | `DELETE`| `/api/plugins/git/worklogs/:worklogId/commit` | 멤버/관리자 | 작업로그에 연결된 커밋 해제 |
| PR 생성 (커밋 자동동기화) | `POST` | `/api/plugins/git/pull-requests` | 멤버/관리자 | PR/MR 생성 및 PR에 속한 전체 커밋 일감 자동 등록 |
| PR 커밋 수동/자동 동기화 | `POST` | `/api/plugins/git/pull-requests/:prId/sync-commits` | 멤버/관리자 | 원격 PR 커밋 전체를 일감 커밋 히스토리로 일괄 동기화 |
| CI/CD 파이프라인 | `GET` | `/api/plugins/git/pipelines/:repoId` | 인증 사용자 | 최신 파이프라인 실행 상태 조회 |
| Webhook 수신 | `POST` | `/api/plugins/git/webhook` | 퍼블릭(서명검증) | GitHub/GitLab 원격 웹훅 이벤트 수신 및 자동화 처리 |

### 3.2 상세 요청 및 응답 규격 샘플 (Detailed API DTOs)

#### 1) `POST /api/plugins/git/config` - 플러그인 활성화 및 설정
- **Request Body**:
```json
{
  "isEnabled": true,
  "provider": "GITHUB",
  "serverUrl": "https://api.github.com",
  "token": "ghp_xxxxxxxxxxxxxxxxxxxx",
  "webhookSecret": "sec_my_webhook_secret",
  "autoCloseIssueOnMerge": true
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "config": {
    "id": 1,
    "workspaceId": 10,
    "isEnabled": true,
    "provider": "GITHUB",
    "serverUrl": "https://api.github.com",
    "hasToken": true,
    "maskedToken": "ghp_************xxxx",
    "autoCloseIssueOnMerge": true,
    "webhookUrl": "https://api.antigravity.com/api/plugins/git/webhook?ws=10"
  }
}
```

#### 2) `GET /api/plugins/git/issues/:issueId` - 일감 연동 Git 상태 조회
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "pullRequests": [
      {
        "id": 101,
        "prNumber": 42,
        "title": "feat(core): implement git integration plugin",
        "sourceBranch": "feature/issue-123-git-plugin",
        "targetBranch": "main",
        "state": "OPEN",
        "authorName": "honggildong",
        "url": "https://github.com/myorg/myrepo/pull/42",
        "ciStatus": "SUCCESS"
      }
    ],
    "commits": [
      {
        "id": 201,
        "commitHash": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        "message": "feat: add git plugin data models and schemas (#123)",
        "authorName": "홍길동",
        "committedAt": "2026-10-14T09:30:00.000Z"
      }
    ]
  }
}
```

---

## 4. 프론트엔드 UI/UX 사양 (Frontend Architecture)

### 4.1 서브 컴포넌트 모듈화 계획 (400줄 제한 준수)
모든 컴포넌트는 `src/components/plugins/git/` 디렉토리에 위치하며, 단일 파일 400줄 제한을 엄격히 준수합니다.

| 서브 컴포넌트 파일명 | 역할 및 주요 책임 | 예상 라인수 |
| :--- | :--- | :---: |
| [`GitPluginSettingTab.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitPluginSettingTab.tsx) | 워크스페이스 설정 내 Git 플러그인 On/Off 토글, Provider 선택, 토큰 입력 | ~250줄 |
| [`GitRepoMappingModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitRepoMappingModal.tsx) | 프로젝트별 Git 저장소 매핑 등록/수정/삭제 Portal 모달 | ~200줄 |
| [`IssueGitSection.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/IssueGitSection.tsx) | 일감 상세 드로어에 삽입되는 Git 종합 탭 컨테이너 (커밋 탭 우선 배치) | ~270줄 |
| [`GitCommitList.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitCommitList.tsx) | 일감과 매핑된 커밋 SHA, 메시지, 작성자, 외부링크 및 Diff 팝업 연동 | ~180줄 |
| [`GitPullRequestList.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitPullRequestList.tsx) | 연결된 PR/MR 상태 칩, CI/CD 뱃지, 머지 버튼 및 외부 링크 | ~220줄 |
| [`GitCommitPickerModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitCommitPickerModal.tsx) | 저장소 매핑에서 최근 커밋을 검색하여 일감/작업로그에 수동 연결하는 모달 | ~220줄 |
| [`GitCommitDetailModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitCommitDetailModal.tsx) | 특정 커밋의 변경 파일 목록 및 Unified Diff 상세 팝업 (Single/All 뷰 지원) | ~250줄 |
| [`GitCommitDiffCard.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitCommitDiffCard.tsx) | 파일별 문법/라인별 Unified Diff 시각화 카드 (CRLF/줄바꿈 완벽 보정) | ~230줄 |
| [`CreateBranchModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/CreateBranchModal.tsx) | 일감 번호 및 제목 기반 자동 브랜치명 추천 및 원격 생성 모달 | ~180줄 |
| [`index.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/index.ts) | 외부 노출용 통합 배럴(Barrel) 익스포트 | ~40줄 |

### 4.2 일감 상세 화면 탭 노출 우선순위 규칙 (Tab Layout & Priority)
- **커밋 탭 기본 활성화**: 일감 상세 화면 열람 시, 외부 저장소의 브랜치 삭제나 변경에 영향받지 않는 확실한 코드 이력 확인을 위해 **[Commits] 탭이 기본 선택(Default Active)**되어 렌더링됩니다.
- **탭 정렬 순서**: 좌측부터 `[1. Commits (N개)]` -> `[2. Pull Requests (N개)]` 순서로 일관되게 정렬됩니다.
- **수정사항 뷰어 (Diff Viewer)**: 커밋 클릭 시 `GitCommitDetailModal`을 통해 변경된 파일들을 단일 파일 집중 보기(Single Focus)와 전체 연속 보기(All)로 자유롭게 전환하며 검토할 수 있습니다.

### 4.2 프론트엔드 Mock Data 코드 블록 (Mock Data for Pre-integration)
```typescript
export const MOCK_GIT_PLUGIN_CONFIG = {
  id: 1,
  workspaceId: 10,
  isEnabled: true,
  provider: 'GITHUB' as const,
  serverUrl: 'https://api.github.com',
  hasToken: true,
  maskedToken: 'ghp_************abcd',
  autoCloseIssueOnMerge: true,
  webhookUrl: 'https://api.antigravity.com/api/plugins/git/webhook?ws=10',
};

export const MOCK_GIT_PULL_REQUESTS = [
  {
    id: 101,
    prNumber: 42,
    title: 'feat(core): implement git integration plugin',
    sourceBranch: 'feature/issue-123-git-plugin',
    targetBranch: 'main',
    state: 'OPEN',
    authorName: 'honggildong',
    url: 'https://github.com/myorg/myrepo/pull/42',
    ciStatus: 'SUCCESS',
  },
  {
    id: 102,
    prNumber: 39,
    title: 'fix(auth): resolve oauth token refresh race condition',
    sourceBranch: 'bugfix/auth-race',
    targetBranch: 'main',
    state: 'MERGED',
    authorName: 'leesoonsin',
    url: 'https://github.com/myorg/myrepo/pull/39',
    ciStatus: 'SUCCESS',
  },
];

export const MOCK_GIT_COMMITS = [
  {
    id: 201,
    commitHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    message: 'feat: add git plugin data models and schemas (#123)',
    authorName: '홍길동',
    committedAt: '2026-10-14T09:30:00.000Z',
  },
  {
    id: 202,
    commitHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    message: 'refactor: split git sub-components into modular files (#123)',
    authorName: '이순신',
    committedAt: '2026-10-14T10:15:00.000Z',
  },
];
```

---

## 5. QA 및 통합 테스트 시나리오 (Verification & Test Cases)

### 5.1 Positive Test Cases
1. **TC-POS-01 (플러그인 설정 및 연결 성공)**:
   - 관리자가 GitHub Provider 선택 후 유효한 PAT 입력 후 '연결 테스트' 클릭 시 200 OK와 함께 사용자/조직 정보가 확인되어야 한다.
2. **TC-POS-02 (저장소 매핑 및 일감 바인딩)**:
   - 프로젝트에 `myorg/antigravity` 저장소를 매핑한 후, 커밋 메시지에 `#123`이 포함된 커밋을 푸시하면 일감 상세의 Git 탭에 해당 커밋이 즉시 표시되어야 한다.
3. **TC-POS-03 (PR 머지 및 일감 자동 완료)**:
   - PR이 머지(MERGED)되었을 때 웹훅이 수신되면 연결된 일감 상태가 자동으로 `DONE`으로 변경되고 히스토리에 기록되어야 한다.

### 5.2 Negative Test Cases
1. **TC-NEG-01 (유효하지 않은 토큰 등록 차단)**:
   - 만료되었거나 권한(repo scope)이 없는 토큰 입력 시 연결 테스트에서 400 Bad Request 에러 메시지를 표시하고 저장을 차단해야 한다.
2. **TC-NEG-02 (위조된 웹훅 요청 차단)**:
   - HMAC SHA-256 서명이 일치하지 않는 비정상 웹훅 요청 수신 시 401 Unauthorized로 거부하고 DB 상태를 변경하지 않아야 한다.
3. **TC-NEG-03 (비활성화 상태에서의 API 호출 차단)**:
   - 플러그인이 비활성화된 상태에서 Git API 엔드포인트 호출 시 403 Forbidden 응답을 반환해야 한다.

---

## 6. 개발 파이프라인 산출물 체크리스트 (Implementation Checklist)

- [ ] **Phase 0 (기획)**: `spec_validator.py` 통과 (`SPEC_APPROVED`)
- [ ] **Phase 1 (BE)**: Prisma 마이그레이션 및 Git Provider 어댑터(GitHub, GitLab) 구현, 단위 테스트 100% Pass
- [ ] **Phase 1 (FE)**: `src/components/plugins/git/` 서브 컴포넌트 6종 Mock UI 구현 (Max 400줄)
- [ ] **Phase 2 (연동)**: 백엔드 REST API와 프론트엔드 React Query 바인딩, Webhook 연동
- [ ] **Phase 3 (QA)**: `qa_runner.py` 회귀 테스트 및 Vite 프로덕션 빌드 100% Pass 검증
