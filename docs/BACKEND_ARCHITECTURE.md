# 🏛️ AntiGravity Workflow System - Comprehensive Architecture Guide

## 1. System Overview & Technology Stack

본 문서는 **이슈 및 일감 관리 시스템 (AntiGravity Workflow System)**의 백엔드 및 전체 아키텍처 설계 지침서입니다.
시스템은 높은 확장성, 도메인 간 낮은 결합도, 그리고 안전한 다중 도메인 트랜잭션 처리를 위해 **3계층 모듈형 아키텍처 (3-Tier Layered Architecture)**와 **Prisma Client 주입 기반 트랜잭션 오케스트레이션(Transaction Client Injection)**을 준수합니다.

```
[AntiGravity Workflow High-Level Architecture]
 ├── 🌐 Client Layer (workflow_react): React 19 + TypeScript + TanStack Query + Socket.IO Client
 └── ⚙️ Server Layer (workflow_server):
      ├── 🚦 Routes & Middlewares: Express 라우팅 및 JWT 인증 미들웨어
      ├── 🎮 Controllers: HTTP 요청 파싱 / 응답 직렬화 / 상태코드 매핑
      ├── 🧩 Workflows (Orchestration): 다중 도메인 복합 트랜잭션 (ACID)
      ├── 📦 Sub-Services (Domain Core): 단일 Use-Case 전담 DB 조작 (30~50줄)
      └── 🗄️ Persistence Layer: Prisma ORM + SQLite / PostgreSQL
```

---

## 2. 3-Tier Layered Modular Architecture

모든 백엔드 기능 개발 시 다음 3계층 역할을 엄격히 분리합니다.

```
[HTTP Request] 
      │
      ▼
┌──────────────────────────────────────────────┐
│ 1. Routes (`src/modules/{domain}/*.routes.ts`)│ ── HTTP Method / URI 매핑 & JWT 인증 미들웨어 바인딩
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

### 2.1 계층별 책임과 금지 규칙
1. **Routes**:
   * 비즈니스 로직 및 DB 쿼리 작성 절대 금지.
   * `authenticateToken`, `requireAdmin` 등의 미들웨어 체이닝만 수행.
2. **Controllers**:
   * Prisma DB 직접 호출 금지.
   * 순수 비즈니스 로직 계산 금지. 오직 HTTP DTO 변환과 상태 코드(`res.status(200).json(...)`) 반환만 담당.
3. **Sub-Services**:
   * `req`, `res`, `next` 등 Express 객체 참조 절대 금지.
   * 파일당 30~50줄 내외로 단일 기능(Single Responsibility)만 전담.

---

## 3. Multi-Domain Transaction & Orchestration Architecture

여러 도메인(예: `Issue`, `ActivityLog`, `Project`, `Notification` 등)의 작업이 하나의 트랜잭션 안에서 **원자적(All-or-Nothing ACID)**으로 실행되어야 할 때 사용하는 표준 가이드라인입니다.

```
                  ┌──────────────────────────────────────────────┐
                  │ Controller or Multi-Domain Workflow          │
                  └──────────────────────┬───────────────────────┘
                                         │ runTransaction(async (tx) => { ... })
                      ┌──────────────────┼──────────────────┐
                      ▼ tx               ▼ tx               ▼ tx
         ┌────────────────────────┐ ┌────────────────┐ ┌────────────────────────┐
         │ createIssueService     │ │createLogService│ │ syncProjectDatesService│
         │ (db = tx ?? prisma)    │ │(db = tx ?? prisma)│(db = tx ?? prisma)   │
         └────────────────────────┘ └────────────────┘ └────────────────────────┘
```

### 3.1 Core Rule: Client Injection Pattern (`tx?: PrismaTx`)

각 Sub-Service는 전역 `prisma` 싱글톤에 종속되지 않고, 선택적 트랜잭션 클라이언트(`tx?: PrismaTx`)를 전달받을 수 있도록 설계합니다.

```typescript
import { prisma, type PrismaTx } from '#lib/prisma.js';

export const someDomainService = async (data: InputData, tx?: PrismaTx) => {
  // tx가 있으면 상위 트랜잭션에 참여, 없으면 기본 prisma 싱글톤으로 독립 실행
  const db = tx ?? prisma;

  return await db.someEntity.create({ data });
};
```

### 3.2 트랜잭션 실행 헬퍼 (`runTransaction`)

[`src/lib/prisma.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/lib/prisma.ts)에 정의된 `runTransaction` 헬퍼를 사용하여 타임아웃과 락 대기 시간을 표준화합니다.

```typescript
import { runTransaction } from '#lib/prisma.js';

// 기본 10초 타임아웃, 5초 락 대기 적용
const result = await runTransaction(async (tx) => {
  const issue = await createIssueService(data, authorId, tx);
  await createActivityLogService(logData, tx);
  return issue;
});
```

---

## 4. 다중 도메인 관리 3대 패턴 (Use-Case Management)

| 상황 | 권장 패턴 | 구현 위치 | 특징 |
|---|---|---|---|
| **간단한 연동 (2개 도메인)** | **패턴 1: Host Domain 단방향 조율** | `src/modules/{mainDomain}/services/` | 주체 도메인의 서비스에서 부가 서비스에 `tx` 전달 |
| **복합 비즈니스 (3개 이상 도메인)** | **패턴 2: Workflow 오케스트레이션** | `src/workflows/*.workflow.ts` | 도메인 상위 계층에서 트랜잭션 열고 각 모듈 조합 |
| **알림/로깅 등 비원자적 부가작업** | **패턴 3: Event-Driven 비동기 분리** | `src/lib/events.ts` (EventEmitter) | DB 커밋 완료 후 트랜잭션 외부에서 이벤트 처리 |

### 4.1 도메인 간 결합도 및 순환 참조 방지 3대 수칙
1. **단방향 의존성 (One-Way Dependency)**:
   * `Issues` $\rightarrow$ `ActivityLogs` (O)
   * `ActivityLogs` $\rightarrow$ `Issues` (X, 절대 금지)
2. **공통 부가 도메인은 항상 수동적(Passive)**:
   * `ActivityLogs`, `Notifications` 같은 로깅/알림 도메인은 비즈니스 도메인을 직접 import하지 않고 항상 호출당하거나 이벤트를 수신하기만 합니다.
3. **외부 I/O (소켓, 푸시, 외부 API)의 트랜잭션 외부 격리**:
   * Socket.IO 브로드캐스트나 메일 발송 등은 트랜잭션 블록(`$transaction`) 내부가 아닌 **커밋 완료 후 블록 바깥**에서 실행하여 롤백 시 유령 알림을 원천 방지합니다.

---

## 5. Directory Structure & Path Aliases

```
workflow_server/
 ├── src/
 │    ├── lib/                          # 공통 인프라 (Prisma, Socket.IO, JWT)
 │    │    ├── prisma.ts                # PrismaClient, PrismaTx, runTransaction
 │    │    └── socket.ts                # Socket.IO 실시간 서버 및 인증/브로드캐스트
 │    ├── modules/                      # 도메인별 단위 모듈 (Core Modules)
 │    │    ├── auth/                    # 인증 & 사용자 관리
 │    │    ├── issues/                  # 이슈 & 하위 일감 관리
 │    │    │    ├── services/           # 단일 Use-Case Sub-Services
 │    │    │    ├── issues.controller.ts
 │    │    │    └── issues.routes.ts
 │    │    ├── projects/                # 프로젝트 도메인
 │    │    ├── sprints/                 # 스프린트 도메인
 │    │    ├── activityLogs/            # 비관계형 활동 감사 로그
 │    │    └── chat/                    # 실시간 채팅 & 스마트 스로틀러
 │    ├── workflows/                    # 다중 도메인 복합 트랜잭션 워크플로우
 │    │    └── createIssueWithAudit.workflow.ts
 │    └── tests/                        # Vitest 단위/통합 테스트 슈트
 └── schema.prisma                      # Prisma DB 스키마 모델
```

* **Subpath Imports**: 모든 모듈 참조 시 `#lib/prisma.js`, `#modules/issues/services/...` 형태의 Path Alias를 사용합니다.

---

## 6. Testing & Quality Standards

1. **테스트 파일 명명 규칙**:
   * 단일 서비스 테스트: `src/tests/{domain}.{service}.test.ts` (예: `issues.createIssue.test.ts`)
   * 복합 워크플로우 테스트: `src/tests/workflows.{workflow}.test.ts` (예: `workflows.createIssueWithAudit.test.ts`)
2. **테스트 데이터 격리**:
   * 테스트 실행 시 `.tmp/test_task_board.db` 독립 DB로 라우팅되어 메인 DB를 100% 보존합니다.
3. **파일 인코딩 표준**:
   * 모든 소스 코드 및 마크다운 문서는 `UTF-8 with BOM` (`utf-8-sig`)으로 저장합니다. (JSON 제외)

