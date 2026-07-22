# 🏛️ AntiGravity Workflow Backend Architecture Specification

## 1. Overview
본 백엔드 시스템은 **Node.js, Express, TypeScript, Prisma ORM**을 기반으로 하며, 확장성과 유지보수성, 가독성을 최대로 높이기 위해 **도메인 중심 모듈화(Modular Feature-based) & 세분화 서비스(Use-Case Sub-Services) 아키텍처**를 채택합니다.

---

## 2. Layered Architecture (3-Tier Layering)

각 모듈은 다음 3개의 계층으로 명확하게 역할이 분리됩니다:

```text
  [HTTP Request]
        │
        ▼
 ┌──────────────┐
 │   Routes     │  (URL 엔드포인트 선언 & 미들웨어 매핑)
 └──────┬───────┘
        │
        ▼
 ┌──────────────┐
 │ Controllers  │  (HTTP req/res 파싱, status 반환 & Service 호출)
 └──────┬───────┘
        │
        ▼
 ┌──────────────┐
 │ Sub-Services │  (단일 책임 Use-Case 전담 비즈니스 로직 & Prisma DB 조작)
 └──────────────┘
```

1. **Routes (`*.routes.ts`)**:
   - 외부 공개 REST URL 및 HTTP 메서드 (GET, POST, PUT, DELETE) 선언
   - 인증, 검증 미들웨어 바인딩만 수행

2. **Controllers (`*.controller.ts`)**:
   - `req.body`, `req.params`, `req.query` 추출 및 기본 파싱
   - 세분화된 Service 함수를 호출하고 `res.status(code).json(data)` 응답 전달
   - 에러 발생 시 Catch하여 HTTP Status 에러 반환

3. **Sub-Services (`services/*.service.ts`)**:
   - **단일 책임 원칙 (SRP)**에 따라 기능 단위별 세부 파일로 분할 (각 파일 30~50줄 내외)
   - Express HTTP 객체(`req`, `res`)에 독립적으로 순수 비즈니스 연산 및 Prisma DB Query 전담
   - 계층형 Custom Field JSON stringify/parse, 이슈 번호(`issueNumber`) 자동 채번, Audit History 및 마크다운 Revision 생성 로직 처리

---

## 3. Directory & File Naming Conventions

```text
src/
├── modules/                         # 📦 도메인 모듈 디렉터리
│   ├── issues/
│   │   ├── issues.routes.ts         # URL 라우팅 바인딩
│   │   ├── issues.controller.ts     # HTTP 요청/응답 컨트롤러
│   │   └── services/                # ⚡ 기능/Use-Case 단위 세분화 서비스
│   │       ├── createIssue.service.ts
│   │       ├── getIssues.service.ts
│   │       ├── getIssue.service.ts
│   │       ├── updateIssue.service.ts
│   │       ├── deleteIssue.service.ts
│   │       ├── likeIssue.service.ts
│   │       └── unlikeIssue.service.ts
│   │
│   ├── users/
│   │   ├── users.routes.ts
│   │   ├── users.controller.ts
│   │   └── services/
│   │       ├── createUser.service.ts
│   │       ├── getUsers.service.ts
│   │       ├── getUser.service.ts
│   │       ├── updateUser.service.ts
│   │       └── deleteUser.service.ts
│   │
│   ├── projects/
│   │   ├── projects.routes.ts
│   │   ├── projects.controller.ts
│   │   └── services/
│   │       ├── createProject.service.ts
│   │       ├── getProjects.service.ts
│   │       ├── getProject.service.ts
│   │       ├── updateProject.service.ts
│   │       ├── deleteProject.ts
│   │       └── addMember.service.ts
│   │
│   ├── comments/
│   │   ├── comments.routes.ts
│   │   ├── comments.controller.ts
│   │   └── services/
│   │       ├── createComment.service.ts
│   │       ├── getComments.service.ts
│   │       ├── deleteComment.service.ts
│   │       └── addReaction.service.ts
│   │
│   ├── sprints/
│   ├── customFields/
│   ├── attachments/
│   ├── linkPreviews/
│   └── worklogs/
│
├── common/                          # 🛠️ 공통 미들웨어 & 에러 유틸
├── lib/                             # ⚙️ Prisma Singleton (lib/prisma.ts)
├── app.ts                           # Express App 구성 및 라우터 등록
└── server.ts                        # HTTP 서버 론칭 진입점
```

---

## 4. API Endpoints Specification

### 4.1 Users Module (`/api/users`)
- `GET /api/users` / `GET /api/users/list` ➔ `getUsers.service.ts`
- `GET /api/users/:id` ➔ `getUser.service.ts`
- `POST /api/users/create` ➔ `createUser.service.ts`
- `PUT /api/users/update/:id` ➔ `updateUser.service.ts`
- `DELETE /api/users/delete/:id` ➔ `deleteUser.service.ts`

### 4.2 Issues Module (`/api/issues`)
- `GET /api/issues` / `GET /api/issues/list` ➔ `getIssues.service.ts` (검색 및 필터링)
- `GET /api/issues/:id` ➔ `getIssue.service.ts` (계층 customFields JSON 파싱, 하위 일감, 이력 포함)
- `POST /api/issues/create` ➔ `createIssue.service.ts` (issueNumber 채번, customFields stringify)
- `PUT /api/issues/update/:id` ➔ `updateIssue.service.ts` (Audit History 및 IssueRevision 생성)
- `DELETE /api/issues/delete/:id` ➔ `deleteIssue.service.ts`
- `POST /api/issues/like` ➔ `likeIssue.service.ts` (좋아요)
- `POST /api/issues/unlike` ➔ `unlikeIssue.service.ts` (좋아요 취소)

### 4.3 Projects Module (`/api/projects`)
- `GET /api/projects` ➔ `getProjects.service.ts`
- `GET /api/projects/:id` ➔ `getProject.service.ts`
- `POST /api/projects/create` ➔ `createProject.service.ts`
- `PUT /api/projects/update/:id` ➔ `updateProject.service.ts`
- `DELETE /api/projects/delete/:id` ➔ `deleteProject.service.ts`
- `POST /api/projects/addMember` ➔ `addMember.service.ts`

### 4.4 Comments Module (`/api/comments`)
- `GET /api/comments/list/:issueId` ➔ `getComments.service.ts` (대댓글, @멘션, 이모지 반응)
- `POST /api/comments/create` ➔ `createComment.service.ts`
- `POST /api/comments/addReaction` ➔ `addReaction.service.ts`
- `DELETE /api/comments/delete/:id` ➔ `deleteComment.service.ts`

---

## 5. Coding & Database Guidelines
1. **SQLite JSON Handling**: SQLite 호환성을 위해 `customFields` 등의 JSON 데이터는 DB에 `String`으로 저장하되, Service 레이어 응답 전달 시 `JSON.parse`로 파싱하여 객체로 반환합니다.
2. **File Encoding**: 프로젝트의 모든 소스 및 문서 파일은 `UTF-8 with BOM`으로 작성합니다.
3. **Type Safety**: TypeScript 타입을 준수하고 `any` 사용을 최소화합니다.
