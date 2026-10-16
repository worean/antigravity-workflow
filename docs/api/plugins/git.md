# 📌 Git 연동 플러그인 REST API 명세서 (Git Plugin REST APIs)

> **문서 상태**: Approved (완료)  
> **기준 버전**: AntiGravity Workflow v2.5 / Backend v1.1  
> **기본 경로**: `/api/plugins/git`  
> **인증 방식**: Bearer Access Token (`Authorization: Bearer <JWT>`)  
> **워크스페이스 컨텍스트**: 세션 사용자 소속 워크스페이스 격리  

---

## 1. 개요 및 설계 원칙

본 API는 GitHub 및 GitLab과의 형상관리 연동, 브랜치/PR 제어, 소스 및 커밋 브라우징, 그리고 **일감(Issue)과 작업로그(Worklog)의 커밋 영구 연동 및 AI/Workflow 자동화**를 지원하는 통합 REST API 규격입니다.

### 핵심 설계 규칙
1. **커밋 기반 영구 보존 원칙**:
   - PR은 외부 Git 서비스에서 브랜치 삭제나 저장소 변경에 의해 유실될 수 있으므로, 형상 이력 및 작업 진척은 **커밋 단위**로 영구 관리합니다.
   - 일감 상세 화면 조회 시 **커밋 목록이 PR보다 우선하여 제공**됩니다.
2. **작업로그(Worklog) 1:1 커밋 연결**:
   - 작업로그 1개당 정확히 1개의 커밋만 연결 가능합니다 (1:1 관계 보장).
   - 작업로그 생성/연결 시 DB 상에 `url` 및 `commitHash`가 영구 보존되며, 상위 일감(`issueId`)의 커밋 링크(`GitCommitLink`)로도 자동 귀속(Upsert)됩니다.
3. **AI 및 Workflow 자동화 지원**:
   - AI 에이전트 또는 자동화 파이프라인이 여러 커밋을 한 번에 등록하거나 PR에 속한 커밋 전체를 자동으로 이슈에 동기화할 수 있도록 일괄(Batch) API를 완비합니다.

---

## 2. API 엔드포인트 종합 요약

| 분류 | HTTP 메서드 | 엔드포인트 URL | 설명 |
| :--- | :---: | :--- | :--- |
| **플러그인 설정** | `GET` | `/api/plugins/git/config` | 워크스페이스 Git 플러그인 활성화 및 설정 조회 |
| | `POST` | `/api/plugins/git/config` | 플러그인 On/Off, 토큰 및 Webhook 시크릿 저장 |
| | `POST` | `/api/plugins/git/test-connection` | Personal Access Token 유효성 및 권한 검증 |
| **저장소 매핑** | `GET` | `/api/plugins/git/mappings` | 프로젝트와 연결된 Git 저장소 매핑 목록 |
| | `POST` | `/api/plugins/git/mappings` | 특정 프로젝트에 Git 저장소 매핑 등록 |
| | `DELETE`| `/api/plugins/git/mappings/:id` | Git 저장소 매핑 삭제 |
| **원격 탐색** | `GET` | `/api/plugins/git/remote-repos` | 연결된 Git 계정의 전체 원격 저장소 목록 |
| | `GET` | `/api/plugins/git/repos/:repoMappingId/commits` | 특정 저장소의 커밋 로그 페이징 조회 |
| | `GET` | `/api/plugins/git/repos/:repoMappingId/commits/:sha` | 특정 커밋 상세 정보 및 Unified Diff 조회 |
| **일감 커밋 연동** | `GET` | `/api/plugins/git/issues/:issueId` | 일감 연동 Git 데이터(커밋 목록 및 PR 목록) 조회 |
| | `POST` | `/api/plugins/git/issues/:issueId/commits` | 일감에 단일 커밋 수동 연결 (`url` 포함) |
| | `POST` | `/api/plugins/git/issues/:issueId/commits/batch` | **[신규/자동화]** 일감에 다중 커밋 일괄(배치) 등록 |
| | `DELETE`| `/api/plugins/git/issues/:issueId/commits/:commitLinkId` | 일감에서 커밋 링크 해제 |
| **작업로그 커밋** | `POST` | `/api/plugins/git/worklogs/:worklogId/commit` | **[신규/1:1]** 작업로그에 1개 커밋 연결 (상위 일감 커밋 자동 귀속) |
| | `DELETE`| `/api/plugins/git/worklogs/:worklogId/commit` | 작업로그에 연결된 커밋 링크 해제 |
| **브랜치 & PR** | `POST` | `/api/plugins/git/branches` | 일감 기반 신규 원격 브랜치 생성 |
| | `POST` | `/api/plugins/git/pull-requests` | PR/MR 생성 및 **PR 커밋 자동 일괄 등록** |
| | `POST` | `/api/plugins/git/pull-requests/:prId/sync-commits` | **[신규/자동화]** PR에 속한 전체 커밋 일감으로 동기화 |
| **CI/CD & 웹훅** | `GET` | `/api/plugins/git/pipelines/:repoMappingId` | 최신 CI/CD 파이프라인 상태 조회 |
| | `POST` | `/api/plugins/git/webhook` | GitHub / GitLab 원격 웹훅 이벤트 수신 (퍼블릭) |

---

## 3. 상세 API 규격

### 3.1 일감 커밋 일괄 등록 (AI/Workflow 자동화용)
- **URL**: `POST /api/plugins/git/issues/:issueId/commits/batch`
- **설명**: AI 에이전트 또는 자동화 워크플로우가 여러 커밋을 한 번의 API 호출로 일감에 일괄 등록합니다.

#### 요청 예시 (Request Body)
```json
{
  "repoMappingId": 1,
  "commits": [
    {
      "commitHash": "a1b2c3d4e5f678901234567890abcdef12345678",
      "message": "feat: implement issue commit diff card",
      "authorName": "worean",
      "authorEmail": "admin@example.com",
      "committedAt": "2026-10-16T14:30:00Z",
      "url": "https://github.com/worean/antigravity-workflow/commit/a1b2c3d"
    },
    {
      "commitHash": "b2c3d4e5f678901234567890abcdef1234567890",
      "message": "fix: resolve diff card gray line rendering",
      "authorName": "worean",
      "committedAt": "2026-10-16T15:00:00Z",
      "url": "https://github.com/worean/antigravity-workflow/commit/b2c3d4e"
    }
  ]
}
```

#### 응답 예시 (Response 201 Created)
```json
{
  "success": true,
  "totalRequested": 2,
  "totalLinked": 2,
  "commits": [
    {
      "id": 105,
      "repoMappingId": 1,
      "commitHash": "a1b2c3d4e5f678901234567890abcdef12345678",
      "message": "feat: implement issue commit diff card",
      "authorName": "worean",
      "url": "https://github.com/worean/antigravity-workflow/commit/a1b2c3d",
      "repoMapping": {
        "id": 1,
        "repoIdentifier": "worean/antigravity-workflow"
      }
    }
  ]
}
```

---

### 3.2 PR 커밋을 일감 커밋으로 일괄 동기화 (Sync PR Commits)
- **URL**: `POST /api/plugins/git/pull-requests/:prId/sync-commits`
  - 대안 엔드포인트: `POST /api/plugins/git/pull-requests/sync-commits` (Body: `{ "repoMappingId": 1, "prNumber": 42, "issueId": 123 }`)
- **설명**: GitHub/GitLab 원격 저장소로부터 PR에 포함된 모든 커밋을 조회하여, 해당 PR이 연결된 이슈의 커밋 히스토리(`GitCommitLink`)로 자동 등록합니다.

#### 응답 예시 (Response 200 OK)
```json
{
  "success": true,
  "count": 3,
  "commits": [
    {
      "id": 106,
      "repoMappingId": 1,
      "commitHash": "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      "message": "docs: update git integration plugin spec",
      "authorName": "worean",
      "url": "https://github.com/worean/antigravity-workflow/commit/c3d4e5f"
    }
  ]
}
```

---

### 3.3 작업로그 커밋 1:1 연결 (Link Commit to Worklog)
- **URL**: `POST /api/plugins/git/worklogs/:worklogId/commit`
- **설명**: 특정 작업로그에 정확히 1개의 커밋을 연결합니다. 이미 연결된 커밋이 있다면 새 커밋으로 덮어씁니다(Upsert). 동시에 해당 작업로그의 상위 일감(`issueId`)의 커밋 목록에도 자동 귀속됩니다.

#### 요청 예시 (Request Body)
```json
{
  "repoMappingId": 1,
  "commitHash": "a1b2c3d4e5f678901234567890abcdef12345678",
  "message": "refactor: modularize git commit diff viewer",
  "authorName": "worean",
  "authorEmail": "admin@example.com",
  "committedAt": "2026-10-16T15:10:00Z",
  "url": "https://github.com/worean/antigravity-workflow/commit/a1b2c3d"
}
```

#### 응답 예시 (Response 201 Created)
```json
{
  "success": true,
  "worklogCommit": {
    "id": 12,
    "worklogId": 45,
    "repoMappingId": 1,
    "commitHash": "a1b2c3d4e5f678901234567890abcdef12345678",
    "message": "refactor: modularize git commit diff viewer",
    "authorName": "worean",
    "url": "https://github.com/worean/antigravity-workflow/commit/a1b2c3d",
    "createdAt": "2026-10-16T15:10:05.123Z"
  }
}
```

---

### 3.4 작업로그 생성 시 Git 커밋 동시 등록
- **URL**: `POST /api/worklogs`
- **설명**: 작업로그 생성 시 `gitCommit` 객체를 함께 전송하면, 작업로그 저장과 동시에 커밋 링크 및 상위 일감 커밋 귀속이 원자적으로 수행됩니다.

#### 요청 예시 (Request Body)
```json
{
  "issueId": 123,
  "timeSpent": 60,
  "startedAt": "2026-10-16T14:00:00Z",
  "description": "커밋 상세 수정사항 모달 버그 픽스 및 테마 토큰 적용",
  "gitCommit": {
    "repoMappingId": 1,
    "commitHash": "a1b2c3d4e5f678901234567890abcdef12345678",
    "message": "fix(git): fix gray line rendering in commit diff viewer",
    "authorName": "worean",
    "url": "https://github.com/worean/antigravity-workflow/commit/a1b2c3d"
  }
}
```

---

### 3.5 일감 연동 Git 데이터 조회 (커밋 탭 우선)
- **URL**: `GET /api/plugins/git/issues/:issueId`
- **설명**: 일감에 연결된 커밋 목록(`commits`)과 PR 목록(`pullRequests`), 그리고 해당 프로젝트에 매핑된 Git 저장소 목록을 반환합니다.

#### 응답 예시 (Response 200 OK)
```json
{
  "success": true,
  "data": {
    "availableRepositories": [
      {
        "id": 1,
        "repoIdentifier": "worean/antigravity-workflow",
        "defaultBranch": "main"
      }
    ],
    "commits": [
      {
        "id": 101,
        "repoMappingId": 1,
        "commitHash": "a1b2c3d4e5f678901234567890abcdef12345678",
        "message": "feat: git commit diff viewer improvements",
        "authorName": "worean",
        "url": "https://github.com/worean/antigravity-workflow/commit/a1b2c3d",
        "committedAt": "2026-10-16T14:30:00.000Z",
        "repoMapping": {
          "id": 1,
          "repoIdentifier": "worean/antigravity-workflow"
        }
      }
    ],
    "pullRequests": [
      {
        "id": 50,
        "prNumber": 12,
        "title": "feat: git integration plugin enhancement",
        "sourceBranch": "feature/git-worklog-sync",
        "targetBranch": "main",
        "state": "OPEN",
        "authorName": "worean",
        "url": "https://github.com/worean/antigravity-workflow/pull/12",
        "ciStatus": "SUCCESS"
      }
    ]
  }
}
```
