# 📋 Git 리포지토리 소스 브라우저 및 커밋 Diff 뷰어 기능 기획 사양서

> **문서 상태**: Approved (기획 승인 완료)  
> **기능 ID**: `FEAT-PLUGIN-GIT-02`  
> **대상 도메인**: `plugins/git` (Repository Source & Commit Diff Viewer)  
> **작성자 / 일자**: `spec-planner` / 2026-10-15  
> **관련 문서**: [GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md), [11_GIT_INTEGRATION_PLUGIN_SPECIFICATION.md](file:///C:/Users/admin/antigravity-workflow/docs/features/11_GIT_INTEGRATION_PLUGIN_SPECIFICATION.md)

---

## 1. 기능 개요 및 사용자 가치 (Feature Overview)

### 1.1 배경 및 목적 (Background & Objective)
- **배경**:
  - 기존 Git 연동 플러그인(FEAT-PLUGIN-GIT-01)은 PR 목록, 브랜치 생성, Webhook 이벤트 처리 위주로 설계되어 있어, 개발자가 실제 소스코드를 확인하거나 커밋의 구체적인 변경 내역을 보려면 외부 GitLab이나 GitHub 웹 사이트로 이탈해야 하는 번거로움이 존재했습니다.
  - 개발팀은 GitLab/GitHub과 같은 직관적인 웹 코드 브라우저 경험을 AntiGravity 플랫폼 내에서 직접 제공받아, 일감 관리와 소스/커밋 탐색을 단일 워크스페이스에서 유기적으로 수행하기를 요구하고 있습니다.
- **목적 및 향후 확장 비전 (Future Vision)**:
  - **1단계 (현재 범위)**: 프로젝트에 매핑된 Git 리포지토리의 소스코드 트리 탐색, 문법 강조(Syntax Highlighting) 코드 뷰어, 커밋 히스토리 목록 및 파일별 라인 단위 Unified Diff 뷰어를 제공합니다.
  - **2단계 (확장 연계)**: 커밋 메시지와 Diff 분석 데이터를 기반으로 일감(#123) 자동 링크, Markdown 문서 내 코드 블록 연동, 그리고 **커밋만 올려도 AI가 변경사항을 분석하여 일감 활동 내역(Worklog)을 자동 작성하고 진척도(Progress %)를 자동 계산**하는 지능형 워크플로우의 기초 데이터 파이프라인으로 확장합니다.

### 1.2 핵심 사용자 시나리오 (User Journey & Core Value)
1. **프로젝트 내 '코드 저장소' 탭 진입**:
   - 프로젝트 상세 화면(`ProjectDetailPage`)에서 신규 탭인 **[코드 저장소(Repository)]**를 클릭하여 매핑된 Git 리포지토리(GitHub/GitLab) 화면으로 즉시 진입합니다.
2. **브랜치/태그 전환 및 소스 디렉토리 계층 탐색**:
   - 상단 브랜치 선택 셀렉터(`main`, `develop`, `feature/...`)를 통해 원하는 브랜치/태그의 최신 소스 트리를 탐색하고, 폴더를 클릭하여 하위 디렉토리로 부드럽게 이동합니다.
3. **고해상도 소스코드 뷰어 열람**:
   - 소스 파일(`*.ts`, `*.tsx`, `*.js`, `*.py`, `*.md`, `*.json` 등)을 클릭하면 줄 번호, 문법 강조, 파일 크기, 원문 복사 기능을 갖춘 전용 코드 뷰어로 소스코드를 한눈에 확인합니다.
4. **커밋 히스토리 및 Diff 변경사항 비교**:
   - [커밋 히스토리] 서브탭에서 커밋 목록(메시지, 작성자, SHA, 타임스탬프)을 확인하고, 특정 커밋 클릭 시 파일별 추가/삭제 라인이 시각적으로 구분된 **Unified Diff 뷰어**를 확인합니다.
5. **일감 상세 드로어(Issue Drawer) 연계**:
   - 일감 상세 화면의 Git 탭에서 연결된 커밋을 클릭하면 해당 커밋의 수정사항(Diff 팝업 모달)을 즉시 띄워 일감 맥락을 유지한 채 코드 변경점을 검토합니다.

### 1.3 사용자 권한 및 접근 제어 (Authorization & Scope)
- **적용 스코프**: 단일 워크스페이스(Workspace-Tenant 격리)
- **필요 권한**:
  - `ADMIN`: 저장소 매핑 추가/수정/삭제, 브랜치 보호 정책 설정.
  - `MEMBER`: 프로젝트에 매핑된 리포지토리의 소스 트리 조회, 파일 내용 열람, 커밋 히스토리 및 Diff 조회.
  - `VIEWER`: 읽기 전용으로 소스 트리, 파일 내용 및 커밋 Diff 열람 가능 (비공개 토큰 마스킹 유지).

---

## 2. 데이터 모델 및 비즈니스 규칙 (Data Model & Business Rules)

### 2.1 데이터베이스 스키마 요구사항 (Prisma Schema Target)
- **대상 DB**: `workflow_server/prisma/schema.workspace.prisma`
- **신규 및 연계 모델 명세**:

```prisma
// 기존 GitRepositoryMapping과의 관계 확장 및 커밋 상세/Diff 캐시 모델
model GitCommitDetail {
  id              Int                  @id @default(autoincrement())
  repoMappingId   Int
  repoMapping     GitRepositoryMapping @relation(fields: [repoMappingId], references: [id], onDelete: Cascade)
  commitHash      String               @db.VarChar(40)
  parentHash      String?              @db.VarChar(40)
  message         String               @db.Text
  authorName      String
  authorEmail     String?
  committedAt     DateTime
  statsAdditions  Int                  @default(0)
  statsDeletions  Int                  @default(0)
  statsTotal      Int                  @default(0)
  diffSummaryJson Json?                // 변경된 파일 목록 및 파일별 라인 변경 통계 캐시
  createdAt       DateTime             @default(now())

  @@unique([repoMappingId, commitHash])
  @@index([repoMappingId])
}
```

### 2.2 필드 상세 명세 및 제약조건 (Field Constraints)
| 필드명 | 타입 | 필수 여부 | 기본값 | 제약조건 / 유효성 검사 규칙 |
| :--- | :--- | :---: | :--- | :--- |
| `commitHash` | String | 필수 | - | 40자 Git SHA-1 16진수 해시 포맷 |
| `parentHash` | String | 선택 | null | 부모 커밋 해시 (루트 커밋일 경우 null) |
| `message` | String | 필수 | - | 커밋 제목 및 본문 (UTF-8 인코딩) |
| `statsAdditions` | Int | 필수 | 0 | 추가된 라인 수 (>= 0) |
| `statsDeletions` | Int | 필수 | 0 | 삭제된 라인 수 (>= 0) |
| `diffSummaryJson` | Json | 선택 | null | `[{ path: string, status: 'modified'|'added'|'deleted', additions: number, deletions: number }]` |

### 2.3 비즈니스 로직 & 엣지 케이스 (Business Logic & Edge Cases)
1. **온디맨드 원격 조회 및 지연 캐싱 (On-demand Fetching)**:
   - 전체 리포지토리의 소스 파일 내용 전체를 DB에 동기화하지 않고, 사용자가 클릭한 디렉토리 트리 및 파일에 대해서만 Git Provider API(GitHub / GitLab API)를 실시간 호출합니다.
   - 커밋 Diff 정보는 최초 조회 시 파싱하여 `GitCommitDetail`에 캐싱함으로써 반복 조회 시 응답 속도를 50ms 미만으로 극대화합니다.
2. **대용량 파일 및 바이너리 파일 처리 방어**:
   - 파일 크기가 1MB를 초과하는 소스 파일은 브라우저 렌더링 성능 저하를 방지하기 위해 상위 1,000줄까지만 표시하고 '전체 보기 / 다운로드' 링크를 제공합니다.
   - 이미지, 동영상, 압축파일 등 바이너리 파일은 코드 에디터 대신 미리보기(이미지) 또는 파일 정보 메타데이터 카드로 대체합니다.
3. **존재하지 않는 브랜치/태그 Fallback**:
   - 사용자가 URL 해시를 통해 지정한 `ref` 파라미터가 유효하지 않을 경우, 매핑에 등록된 `defaultBranch`(기본: `main` 또는 `master`)로 안전하게 자동 폴백(Fallback)합니다.
4. **AI 활동 내역 및 진척도 연계를 위한 확장 구조**:
   - Diff DTO에 파일별 변경 청크(`hunks`) 및 변경된 파일 확장자 정보를 정형화된 JSON 구조로 제공하여, 향후 백그라운드 AI 에이전트가 커밋을 파싱하여 일감 진척도를 자동 갱신할 수 있도록 호환성을 보장합니다.

---

## 3. 백엔드 REST API 명세 (Backend API Specifications)

### 3.1 엔드포인트 목록 (Endpoint Summary)
| Action | Method | URL Endpoint | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| 브랜치 목록 | `GET` | `/api/plugins/git/repos/:repoId/branches` | 인증 사용자 | 해당 저장소의 브랜치 목록 조회 |
| 소스 트리 조회 | `GET` | `/api/plugins/git/repos/:repoId/tree` | 인증 사용자 | 지정 브랜치/태그의 디렉토리 및 파일 목록 트리 조회 |
| 파일 원문 조회 | `GET` | `/api/plugins/git/repos/:repoId/blob` | 인증 사용자 | 특정 파일의 소스코드 내용, 크기, 언어 타입 조회 |
| 커밋 목록 조회 | `GET` | `/api/plugins/git/repos/:repoId/commits` | 인증 사용자 | 브랜치별 커밋 히스토리 페이징 목록 조회 |
| 커밋 Diff 조회 | `GET` | `/api/plugins/git/repos/:repoId/commits/:sha/diff` | 인증 사용자 | 특정 커밋의 상세 변경 파일 목록 및 라인별 Unified Diff 조회 |

### 3.2 상세 요청 및 응답 규격 (Detailed Request / Response)

#### 1) `GET /api/plugins/git/repos/:repoId/tree` - 소스 파일 트리 조회
- **Query Params**:
  - `ref`: 대상 브랜치 또는 커밋 해시 (선택, 기본: 저장소 defaultBranch)
  - `path`: 디렉토리 경로 (선택, 기본: 루트 `""`)
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "repoId": 1,
    "ref": "main",
    "path": "src/components",
    "entries": [
      {
        "id": "blob-1",
        "name": "App.tsx",
        "type": "blob",
        "path": "src/components/App.tsx",
        "size": 15420
      },
      {
        "id": "tree-1",
        "name": "plugins",
        "type": "tree",
        "path": "src/components/plugins",
        "size": 0
      }
    ]
  }
}
```

#### 2) `GET /api/plugins/git/repos/:repoId/blob` - 소스 파일 내용 조회
- **Query Params**:
  - `ref`: 브랜치 또는 커밋 해시
  - `path`: 파일 전체 경로 (예: `src/components/App.tsx`)
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "name": "App.tsx",
    "path": "src/components/App.tsx",
    "ref": "main",
    "size": 1250,
    "extension": "tsx",
    "language": "typescript",
    "isBinary": false,
    "content": "import React from 'react';\n\nexport const App = () => {\n  return <div>AntiGravity</div>;\n};\n",
    "lineCount": 5
  }
}
```

#### 3) `GET /api/plugins/git/repos/:repoId/commits/:sha/diff` - 커밋 상세 및 Unified Diff 조회
- **Params**:
  - `repoId`: 저장소 매핑 ID
  - `sha`: 40자 커밋 해시
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "commitHash": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    "message": "feat: add repository viewer and commit diff UI (#123)",
    "authorName": "홍길동",
    "authorEmail": "developer@antigravity.io",
    "committedAt": "2026-10-15T09:30:00.000Z",
    "stats": {
      "additions": 45,
      "deletions": 12,
      "total": 57
    },
    "files": [
      {
        "oldPath": "src/components/GitViewer.tsx",
        "newPath": "src/components/GitViewer.tsx",
        "status": "modified",
        "additions": 45,
        "deletions": 12,
        "diff": "@@ -10,6 +10,12 @@\n import React from 'react';\n+import { DiffViewer } from './DiffViewer';\n \n export const GitViewer = () => {\n+  return <DiffViewer />;\n };\n"
      }
    ]
  }
}
```

- **Error Codes**:
  - `400 Bad Request`: 필수 `path` 또는 유효하지 않은 `sha` 형식 (`VALIDATION_ERROR`)
  - `401 Unauthorized`: Git 토큰 누락 또는 인증 실패 (`INVALID_TOKEN`)
  - `403 Forbidden`: 워크스페이스 또는 플러그인 접근 권한 없음 (`FORBIDDEN`)
  - `404 Not Found`: 대상 저장소 매핑 또는 파일 경로 미존재 (`RESOURCE_NOT_FOUND`)
  - `502 Bad Gateway`: 원격 GitHub/GitLab API 통신 장애 (`REMOTE_GIT_ERROR`)

---

## 4. 프론트엔드 UI/UX 사양 (Frontend UI/UX Specifications)

### 4.1 서브 컴포넌트 모듈화 계획 (400줄 제한 엄격 준수)
모든 컴포넌트는 `src/components/plugins/git/` 디렉토리에 위치하며, 단일 파일 400줄 제한을 엄격히 준수합니다.

| 서브 컴포넌트 파일명 | 역할 및 주요 책임 | 예상 라인수 |
| :--- | :--- | :---: |
| [`GitCommitDetailModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitCommitDetailModal.tsx) | 커밋 상세 및 Diff 팝업 메인 컨테이너 (단일/전체 듀얼 뷰, 400줄 제한 엄격 준수) | ~230줄 |
| [`GitCommitSummaryHeader.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitCommitSummaryHeader.tsx) | 커밋 메시지, 작성자 아바타, SHA 복사, 변경 통계 상단 요약 바 | ~170줄 |
| [`GitCommitDiffToolbar.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitCommitDiffToolbar.tsx) | 파일 인덱스 네비게이션([<] N/M [>]) 및 단일/전체 뷰 모드 토글 서브 툴바 | ~130줄 |
| [`GitCommitFileTree.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitCommitFileTree.tsx) | 디렉토리 및 파일 트리 계층 탐색기, 검색 필터, 접기/펼치기 | ~310줄 |
| [`GitCommitDiffCard.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/GitCommitDiffCard.tsx) | 파일별 Unified Diff 시각화 카드 (세로/가로 스크롤, fillContainer 지원) | ~310줄 |
| [`index.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/plugins/git/index.ts) | 외부 노출용 통합 배럴(Barrel) 익스포트 | ~40줄 |

### 4.2 모달 및 팝업 정책 & 세로 스크롤 규격 (Modal & Scroll Policy)
- **커밋 Diff 모달 (`GitCommitDetailModal`) 및 Diff 뷰어 세로 스크롤**:
  - `GitRepoBrowserTab` 및 일감 상세 드로어(`IssueGitSection`)에서 독립적으로 호출할 수 있도록 `useState` Colocation 및 `ModalWrapper` Portal 구조를 채택합니다.
  - **세로 스크롤(Vertical Scroll) 지원 규격**:
    - **단일 파일 집중 뷰 (`viewMode === 'single'`)**: 모달 우측 영역 전체 높이에 맞춰 `GitCommitDiffCard`가 100% 채워지며(`fillContainer=true`), 헤더 고정 상태에서 **Diff 소스 본문 영역 자체가 `overflow-y: auto`, `overflow-x: auto`로 세로 및 가로 스크롤**됩니다.
    - **전체 모아보기 뷰 (`viewMode === 'all'`)**: 모든 파일의 카드가 순차적으로 나열되며, 우측 스크롤 컨테이너(`custom-scrollbar`)를 통해 전체 목록이 부드럽게 세로 스크롤됩니다. 개별 카드의 본문도 `maxHeight: '600px'`로 자체 세로 스크롤을 병행 지원합니다.
    - **모달 클리핑 방지**: 모달 높이를 뷰포트 내 안전 영역(`height: 'calc(86vh - 40px)'`)으로 제한하여, 스크롤바가 화면 밖으로 넘치거나 잘리지 않도록 보호합니다.
  - ESC 키 입력 및 외부 백드롭 클릭 시 닫기, 바디 스크롤 락을 기본 적용합니다.
  - Ghost State 금지: 모달 오픈 시 선택된 `commitHash`가 유효할 때만 내부 Diff Fetcher가 작동합니다.

### 4.3 상태 관리 및 스타일 토큰 정책
- **서버 상태**: TanStack Query v5 활용 (`['git', 'tree']`, `['git', 'blob']`, `['git', 'commits']`, `['git', 'diff']`).
- **클라이언트 상태**: 활성 브랜치는 로컬스토리지(`ag_git_active_ref`)에 저장하여 탭 전환 후 복귀 시에도 유지.
- **디자인 토큰**: `src/styles/theme.css`의 CSS 변수(`var(--bg-card)`, `var(--text-main)`, `var(--border-subtle)`, `var(--primary)`, `var(--success)`, `var(--danger)`)를 전면 활용하여 라이트/다크 테마를 완벽 지원.

### 4.4 프론트엔드 Mock Data 코드 블록 (Mock Data for Pre-integration)

```typescript
export const MOCK_GIT_REPO_TREE = {
  repoId: 1,
  ref: 'main',
  path: '',
  entries: [
    { id: '1', name: 'src', type: 'tree' as const, path: 'src', size: 0 },
    { id: '2', name: 'package.json', type: 'blob' as const, path: 'package.json', size: 1420 },
    { id: '3', name: 'README.md', type: 'blob' as const, path: 'README.md', size: 2850 },
    { id: '4', name: 'tsconfig.json', type: 'blob' as const, path: 'tsconfig.json', size: 520 },
  ],
};

export const MOCK_GIT_FILE_BLOB = {
  name: 'README.md',
  path: 'README.md',
  ref: 'main',
  size: 2850,
  extension: 'md',
  language: 'markdown',
  isBinary: false,
  content: '# AntiGravity Git Integration\n\nGitLab & GitHub 스타일의 웹 리포지토리 뷰어입니다.\n\n- 소스코드 트리 탐색\n- 커밋 히스토리 및 Diff 비교\n- 일감 자동 연동 지원',
  lineCount: 7,
};

export const MOCK_GIT_COMMITS_DETAILED = [
  {
    commitHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    shortHash: 'a1b2c3d',
    message: 'feat: implement git repository tree viewer and commit diff (#123)',
    authorName: '홍길동',
    authorEmail: 'hong@antigravity.io',
    committedAt: '2026-10-15T09:30:00.000Z',
    stats: { additions: 85, deletions: 12, total: 97 },
  },
  {
    commitHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    shortHash: 'b2c3d4e',
    message: 'refactor: modularize git sub-components into 400 lines limit (#123)',
    authorName: '이순신',
    authorEmail: 'lee@antigravity.io',
    committedAt: '2026-10-14T15:20:00.000Z',
    stats: { additions: 42, deletions: 8, total: 50 },
  },
];

export const MOCK_GIT_COMMIT_DIFF = {
  commitHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  message: 'feat: implement git repository tree viewer and commit diff (#123)',
  authorName: '홍길동',
  authorEmail: 'hong@antigravity.io',
  committedAt: '2026-10-15T09:30:00.000Z',
  stats: { additions: 85, deletions: 12, total: 97 },
  files: [
    {
      oldPath: 'src/components/plugins/git/GitRepoBrowserTab.tsx',
      newPath: 'src/components/plugins/git/GitRepoBrowserTab.tsx',
      status: 'modified' as const,
      additions: 45,
      deletions: 5,
      diff: '@@ -1,5 +1,10 @@\n import React from \'react\';\n+import { GitFileTreeExplorer } from \'./GitFileTreeExplorer\';\n+import { GitSourceCodeViewer } from \'./GitSourceCodeViewer\';\n \n export const GitRepoBrowserTab = () => {\n-  return <div>Loading</div>;\n+  return <GitFileTreeExplorer />;\n };',
    },
    {
      oldPath: 'src/components/plugins/git/GitDiffViewer.tsx',
      newPath: 'src/components/plugins/git/GitDiffViewer.tsx',
      status: 'added' as const,
      additions: 40,
      deletions: 0,
      diff: '@@ -0,0 +1,8 @@\n+export const GitDiffViewer = () => {\n+  return <div className="diff-box">Diff Render</div>;\n+};',
    },
  ],
};
```

---

## 5. QA 및 통합 테스트 시나리오 (Verification & Test Cases)

### 5.1 Positive Test Cases
1. **TC-POS-01 (리포지토리 소스 파일 트리 및 내용 탐색)**:
   - 사용자가 프로젝트 상세 화면의 [코드 저장소] 탭에서 `src` 폴더를 클릭했을 때, 하위 파일 목록이 즉시 전개되고 브레드크럼에 `src`가 반영되어야 한다. 소스 파일을 클릭하면 코드 뷰어에 문법 강조와 라인 번호가 정상 렌더링되어야 한다.
2. **TC-POS-02 (브랜치 전환 시 트리 실시간 갱신)**:
   - 상단 브랜치 드롭다운에서 `feature/new-api` 브랜치로 변경 시 해당 브랜치의 최신 트리 구조와 커밋이 로딩되고 로컬스토리지에 해당 브랜치가 유지되어야 한다.
3. **TC-POS-03 (커밋 목록 및 상세 Diff 팝업 검증)**:
   - 커밋 히스토리 탭에서 특정 커밋을 클릭하면 `GitCommitDiffModal`이 Portal로 열리고, 변경된 파일 목록과 각 파일별 라인 단위 추가(`+`)/삭제(`-`) 하이라이트 및 통계가 정상 표시되어야 한다.
4. **TC-POS-04 (일감 상세 드로어 내 커밋 Diff 연동)**:
   - 일감 상세 화면의 Git 연동 섹션에서 연결된 커밋 클릭 시 동일한 Diff 모달이 정상 호출되어 수정사항을 즉시 확인할 수 있어야 한다.

### 5.2 Negative Test Cases
1. **TC-NEG-01 (저장소 미매핑 프로젝트 접근 시 안내)**:
   - Git 저장소가 매핑되지 않은 프로젝트에서 [코드 저장소] 탭 진입 시 빈 화면 대신 "연결된 Git 저장소가 없습니다. 관리자에게 저장을 요청하세요" 빈 상태(Empty State) UI와 매핑 가이드 버튼이 표시되어야 한다.
2. **TC-NEG-02 (대용량/바이너리 파일 열람 차단 및 안전 안내)**:
   - 1MB를 초과하는 대용량 파일이나 바이너리 파일 선택 시 브라우저 멈춤 현상 없이 "바이너리 파일은 직접 텍스트로 표시할 수 없습니다" 경고 문구와 함께 안전한 메타정보만 표시되어야 한다.
3. **TC-NEG-03 (만료된 Git 토큰 및 네트워크 통신 실패 처리)**:
   - Git API 호출 시 401(토큰 만료) 또는 502(원격 서버 응답 없음) 발생 시 화면 크래시 없이 리트라이 버튼과 "Git 저장소 연결 상태를 확인해주세요" 에러 알림이 표시되어야 한다.

---

## 6. 개발 파이프라인 산출물 체크리스트 (Implementation Checklist)

- [x] **Phase 0 (기획)**: `spec_validator.py` 통과 (`SPEC_APPROVED`)
- [ ] **Phase 1 (BE)**: IGitProvider 확장 (`getTree`, `getBlob`, `getCommits`, `getCommitDiff`), GitLab/GitHub 어댑터 및 컨트롤러/서브서비스 구현, Vitest 단위 테스트 100% Pass
- [ ] **Phase 1 (FE)**: `src/components/plugins/git/` 서브 컴포넌트 6종 구현 (Max 400줄 준수, theme.css 토큰 준수, Mock UI 완료)
- [ ] **Phase 2 (연동)**: `api-viewer`를 통한 REST API 정합성 검증 및 TanStack Query 훅 바인딩
- [ ] **Phase 3 (QA)**: `qa_runner.py` 회귀 테스트, `component_reviewer.py` 정적 분석 및 Vite 프로덕션 빌드 100% Pass
