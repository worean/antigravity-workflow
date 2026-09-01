# 🏛️ AntiGravity Workflow System - Backend Server Architecture

## 1. System Overview & Technology Stack

본 문서는 **AntiGravity Workflow Backend Server (`workflow_server/`)**의 시스템 아키텍처 및 세부 설계 지침서입니다.

- **Runtime & Framework**: Node.js + Express + TypeScript
- **Database & ORM**: SQLite / PostgreSQL + Prisma ORM
- **Authentication**: JWT Bearer Token (Strict Verification)
- **Realtime**: Socket.IO Server & Smart Throttler
- **Testing**: Vitest (`src/tests/`)

```text
[AntiGravity Workflow Server Architecture]
 └── ⚙️ Server Layer (workflow_server/):
      ├── 🚦 Routes & Middlewares: Express 라우팅 및 JWT 인증 미들웨어
      ├── 🎮 Controllers: HTTP 요청 파싱 / 응답 직렬화 / 상태코드 매핑
      ├── 🧩 Workflows (Orchestration): 다중 도메인 복합 트랜잭션 (ACID)
      ├── 📦 Sub-Services (Domain Core): 단일 Use-Case 전담 DB 조작 (30~50줄)
      ├── 🗄️ Persistence Layer: Prisma ORM (schema.workspace.prisma)
      └── 🧪 Tests (src/tests/): Vitest 기반 도메인/서비스별 100% Use-Case 테스트
```

---

## 2. 3-Tier Layered Modular Architecture

모든 백엔드 기능 개발 및 추가 시 반드시 다음 3계층 아키텍처 규칙을 엄격히 준수합니다.

```text
[HTTP Request] 
      │
      ▼
┌──────────────────────────────────────────────┐
│ 1. Routes (`src/modules/{domain}/*.routes.ts`)│ ── HTTP Method / URI 매핑 & 미들웨어 체이닝
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 2. Controller (`*.controller.ts`)            │ ── req.body / req.params 파싱, 응답 JSON 반환, 에러 캡처
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 3. Workflows (`src/workflows/*.ts`) [선택]   │ ── 다중 도메인이 얽힌 복합 트랜잭션 조율 (ACID 원자성)
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 4. Sub-Services (`services/*.service.ts`)    │ ── 단일 비즈니스 로직 & Prisma DB 쿼리 전담 (Express 객체 금지)
└──────────────────────────────────────────────┘
```

### 2.1 계층별 책임 및 금지 규칙
1. **Routes**:
   - 비즈니스 로직 및 DB 쿼리 작성 절대 금지.
   - `requireAuth`, `requireProjectMember`, `requireProjectPM` 등의 미들웨어 체이닝만 수행.
2. **Controllers**:
   - Prisma DB 직접 호출 금지.
   - 순수 비즈니스 로직 계산 금지. 오직 HTTP DTO 변환과 상태 코드(`res.status(200).json(...)`) 반환만 담당.
3. **Sub-Services**:
   - `req`, `res`, `next` 등 Express 객체 참조 절대 금지.
   - 파일당 30~50줄 내외로 단일 Use-Case(Single Responsibility)만 전담.

---

## 3. Multi-Domain Transaction & Orchestration Architecture

여러 도메인(예: `Issue`, `ActivityLog`, `Tag`, `Project` 등)의 작업이 하나의 트랜잭션 안에서 **원자적(All-or-Nothing ACID)**으로 실행되어야 할 때 사용하는 표준 가이드라인입니다.

```text
                  ┌──────────────────────────────────────────────┐
                  │ Controller or Multi-Domain Workflow          │
                  └──────────────────────┬───────────────────────┘
                                         │ runTransaction(async (tx) => { ... })
                      ┌──────────────────┼──────────────────┐
                      ▼ tx               ▼ tx               ▼ tx
         ┌────────────────────────┐ ┌────────────────┐ ┌────────────────────────┐
         │ createIssueService     │ │createLogService│ │ syncIssueTagsService   │
         │ (db = tx ?? prisma)    │ │(db = tx ?? db) │ │ (db = tx ?? prisma)   │
         └────────────────────────┘ └────────────────┘ └────────────────────────┘
```

### 3.1 Client Injection Pattern (`tx?: PrismaTx`)
각 Sub-Service는 전역 `prisma` 싱글톤에 종속되지 않고, 선택적 트랜잭션 클라이언트(`tx?: PrismaTx`)를 전달받을 수 있도록 설계합니다.

```typescript
import { prisma, type PrismaTx } from '#lib/prisma.js';

export const someDomainService = async (data: InputData, tx?: PrismaTx) => {
  const db = tx ?? prisma;
  return await db.someEntity.create({ data });
};
```

### 3.2 트랜잭션 실행 헬퍼 (`runTransaction`)
[`workflow_server/src/lib/prisma.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/lib/prisma.ts)의 `runTransaction` 헬퍼를 사용하여 타임아웃과 락 대기 시간을 표준화합니다.

---

## 4. Directory Structure & Path Aliases

```text
workflow_server/
├── prisma/
│   ├── schema.workspace.prisma        # 멀티테넌트 DB 스키마 모델
│   └── migrations/                    # 마이그레이션 히스토리
├── src/
│   ├── common/                        # 공통 미들웨어 및 에러 핸들러
│   │   └── middlewares/               # authMiddleware.js, workspaceMiddleware.js
│   ├── lib/                           # 공통 인프라 (Prisma, Socket.IO, JWT)
│   ├── modules/                       # 도메인별 단위 모듈 (16개 도메인)
│   │   ├── auth/                      # 인증 & 세션
│   │   ├── users/                     # 사용자 관리
│   │   ├── projects/                  # 프로젝트 & 멤버/그룹
│   │   ├── issues/                    # 이슈 CRUD & 일괄 일정
│   │   ├── comments/                  # 댓글/대댓글 트리 & 리액션
│   │   ├── sprints/                   # 스프린트 & 백로그
│   │   ├── tags/                      # 해시태그 파싱 & 통계
│   │   ├── chat/                      # 실시간 채팅 & 메시징
│   │   ├── workspaces/                # 멀티테넌트 & 초대
│   │   └── ...                        # customFields, worklogs, attachments 등
│   ├── workflows/                     # 다중 도메인 트랜잭션 오케스트레이션
│   └── tests/                         # Vitest 단위/통합 테스트 슈트
└── package.json
```

---

## 5. Testing & Quality Standards (`src/tests/`)

1. **테스트 파일 명명 규칙**:
   - 단일 서비스: `src/tests/{domain}.{service}.test.ts` (예: `tags.getTags.test.ts`)
   - 복합 워크플로우: `src/tests/workflows.{workflow}.test.ts` (예: `workflows.createIssueWithAudit.test.ts`)
2. **테스트 DB 스냅샷 & 격리**:
   - 테스트 실행 시 `.tmp/test_workspace.db` 독립 DB로 라우팅되어 메인 DB를 100% 보존합니다.
3. **파일 인코딩 표준**:
   - 모든 소스 코드 및 문서는 `UTF-8 with BOM` (`utf-8-sig`)으로 저장합니다 (JSON 제외).
