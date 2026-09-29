# 📋 [기능명] Feature Specification & Planning Document (기능 기획 사양서)

> **문서 상태**: [Draft / In Review / Approved / In Progress / Completed]  
> **기능 ID**: `FEAT-[도메인]-[순번]` (예: `FEAT-CALENDAR-01`, `FEAT-NOTIFICATION-01`)  
> **대상 도메인**: `[domain]` (예: `calendar`, `notifications`, `export`)  
> **작성자 / 일자**: `[작성자명]` / `YYYY-MM-DD`  
> **관련 문서**: [GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md) (개발 표준 파이프라인 준수)

---

## 1. 기능 개요 및 사용자 가치 (Feature Overview)

### 1.1 배경 및 목적 (Background & Objective)
- **배경**: *이 기능이 왜 필요한지, 현재 어떤 문제나 사용자 요구가 있는지 서술합니다.*
- **목적**: *본 기능을 통해 달성하고자 하는 비즈니스 및 기술적 목표를 기술합니다.*

### 1.2 핵심 사용자 시나리오 (User Journey & Core Value)
1. **[주요 가치 1]**: *사용자가 얻게 되는 핵심 경험 (예: 구글 캘린더와의 실시간 동기화로 모바일 알림 연동)*
2. **[주요 가치 2]**: *작업 효율성 향상 (예: 캘린더 드래그 앤 드롭으로 일정 즉각 재배치)*

### 1.3 사용자 권한 및 접근 제어 (Authorization & Scope)
- **적용 스코프**: [전역(Core) / 단일 워크스페이스(Workspace-Tenant)]
- **필요 권한**:
  - `ADMIN`: *모든 설정 및 CRUD 전체 권한*
  - `MEMBER`: *본인 관련 리소스 조회 및 생성/수정*
  - `VIEWER`: *단순 읽기 전용*

---

## 2. 데이터 모델 및 비즈니스 규칙 (Data Model & Business Rules)

### 2.1 데이터베이스 스키마 요구사항 (Prisma Schema Target)
- **대상 DB**: `prisma/schema.prisma` (또는 `prisma/schema.workspace.prisma`)
- **신규 / 변경 모델 명세**:

```prisma
// 모델 정의 예시
model ExampleEntity {
  id          Int       @id @default(autoincrement())
  workspaceId Int       // 워크스페이스 테넌트 격리 필수 필드 (Workspace 모델인 경우)
  name        String    @db.VarChar(100)
  status      String    @default("ACTIVE") // ACTIVE, INACTIVE, ARCHIVED
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([workspaceId])
}
```

### 2.2 필드 상세 명세 및 제약조건 (Field Constraints)
| 필드명 | 타입 | 필수 여부 | 기본값 | 제약조건 / 유효성 검사 규칙 |
| :--- | :--- | :---: | :--- | :--- |
| `name` | String | 필수 | - | 1자 이상 100자 이하, 빈 공백 불가 |
| `status` | Enum/String | 필수 | `'ACTIVE'` | `'ACTIVE'`, `'INACTIVE'`, `'ARCHIVED'` 중 하나 |
| `targetDate`| DateTime | 선택 | null | 오늘 이후 일자만 지정 가능 |

### 2.3 비즈니스 로직 & 엣지 케이스 (Business Logic & Edge Cases)
1. **중복 방지 규칙**: *동일 워크스페이스 내 동일 `name` 중복 생성 차단 (409 Conflict)*
2. **연쇄 동작(Cascade/Teardown)**: *상위 리소스 삭제 시 하위 데이터 삭제 또는 가상 부모 래핑 규칙*
3. **외부 연동 오류 처리**: *서드파티 API 실패 시 재시도 또는 Fallback 정책*

---

## 3. 백엔드 REST API 명세 (Backend API Specifications)

### 3.1 엔드포인트 목록 (Endpoint Summary)
| Action | Method | URL Endpoint | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| 목록 조회 | `GET` | `/api/[domain]` | 인증 사용자 | 조건별 필터링 목록 조회 |
| 단일 조회 | `GET` | `/api/[domain]/:id` | 멤버/관리자 | 단일 리소스 상세 조회 |
| 생성 | `POST` | `/api/[domain]` | 멤버/관리자 | 신규 리소스 생성 |
| 수정 | `PUT` | `/api/[domain]/:id` | 소유자/관리자 | 리소스 부분 또는 전체 수정 |
| 삭제 | `DELETE` | `/api/[domain]/:id` | 관리자 | 리소스 삭제 (Hard/Soft) |

### 3.2 상세 요청 및 응답 규격 (Detailed Request / Response)

#### 1) `[Method] /api/[domain]` - [기능명]
- **Headers**: `Authorization: Bearer <token>`, `x-workspace-id: <id>`
- **Query / Params**:
  - `status`: *필터링할 상태값 (선택)*
  - `page`: *페이지 번호 (기본 1)*
- **Request Body**:
```json
{
  "name": "새로운 항목",
  "status": "ACTIVE"
}
```
- **Success Response (`200 OK` 또는 `201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "새로운 항목",
    "status": "ACTIVE",
    "createdAt": "2026-09-21T00:00:00.000Z"
  }
}
```
- **Error Codes (Negative Responses)**:
  - `400 Bad Request`: 필수 입력값 누락 (`VALIDATION_ERROR`)
  - `401 Unauthorized`: 인증 토큰 누락 또는 유효하지 않음 (`UNAUTHORIZED`)
  - `403 Forbidden`: 대상 워크스페이스 또는 리소스 접근 권한 없음 (`FORBIDDEN`)
  - `404 Not Found`: 요청한 리소스 ID 미존재 (`NOT_FOUND`)
  - `409 Conflict`: 이미 존재하는 고유 데이터 (`ALREADY_EXISTS`)

---

## 4. 프론트엔드 UI/UX 사양 (Frontend UI/UX Specifications)

### 4.1 페이지 및 라우트 구조 (Page & Route)
- **페이지 경로**: `/src/pages/[Domain]Page.tsx`
- **URL 라우트**: `/[domain]` (예: `/calendar`, `/settings/[domain]`)
- **레이아웃 원칙**: `[Domain]Page.tsx`는 데이터를 페칭하고 서브 컴포넌트를 조합하는 **순수 오케스트레이터 역할**만 수행 (최대 400줄 미만 유지).

### 4.2 컴포넌트 모듈화 계획 (Sub-Component Breakdown)
> ⚠️ **원칙**: 모든 컴포넌트 파일은 **400줄 이하**로 분할하며, `src/components/[domain]/index.ts`를 통해 외부에 노출합니다.

```text
src/components/[domain]/
├── index.ts                     # Barrel export (외부 노출 단일 창구)
├── [Domain]Header.tsx           # 상단 헤더, 타이틀, 액션 버튼 (생성, 필터 등)
├── [Domain]List.tsx             # 메인 목록 컨테이너 및 무한스크롤/페이지네이션
├── [Domain]Card.tsx             # 단일 항목 카드/행 렌더링
├── [Domain]FilterBar.tsx        # 검색, 상태 필터링 툴바
└── [Domain]FormModal.tsx        # 생성/수정 팝업 모달 (Portal 기반)
```

### 4.3 모달 및 팝업 정책 (Modal & Overlay Policy)
- **전역 모달**: 다중 페이지 공통 사용 시 `useUIStore` 등록 ➔ `<GlobalModalManager />` (Portal)
- **단일 페이지 모달**: 해당 컴포넌트 내 `useState` + `<ModalWrapper>` (Portal) 사용. Ghost State 금지.
- **ESC 닫기, 바깥 영역 클릭 닫기, 스크롤 락 필수 적용**.

### 4.4 상태 관리 분리 계획 (State Management Architecture)
1. **Server State (TanStack Query v5)**:
   - 파일 위치: `src/api/[domain].ts`
   - `use[Domain]Query`, `useCreate[Domain]Mutation`, `useUpdate[Domain]Mutation`
   - 낙관적 업데이트(Optimistic Update) 또는 `queryClient.invalidateQueries` 무효화 전략 명시.
2. **Global Client State (Zustand 5.x - 필요 시)**:
   - 파일 위치: `src/stores/use[Domain]Store.ts`
   - UI 전역 상태(선택된 필터, 뷰 모드: Grid/List 등) 관리 (반드시 개별 셀렉터 또는 `useShallow` 사용).
3. **로컬 스토리지(LocalStorage)**:
   - 사용자 뷰 설정 등 로컬 저장이 필요한 경우 네임스페이스 접두사(`ag_[domain]_*`) 및 `safeStorage` 유틸 사용.

### 4.5 Phase 1 병렬 개발용 Mock Data 명세 (Mock Contract)
*백엔드 API가 완성되기 전 프론트엔드가 즉시 UI를 조립하고 상태를 검증할 수 있도록 Mock 데이터를 사전에 정의합니다.*

```typescript
// src/api/[domain].mock.ts
export const MOCK_[DOMAIN]_ITEMS = [
  {
    id: 1,
    name: "Mock 데이터 1",
    status: "ACTIVE",
    createdAt: "2026-09-21T00:00:00.000Z"
  },
  {
    id: 2,
    name: "Mock 데이터 2",
    status: "INACTIVE",
    createdAt: "2026-09-21T01:00:00.000Z"
  }
];
```

---

## 5. QA 및 통합 테스트 시나리오 (QA & Scenario Test Cases)

### 5.1 정상 시나리오 (Positive Test Cases)
| TC ID | 테스트 명칭 | 사전 조건 | 조작 단계 | 기대 결과 (UI 및 데이터) |
| :---: | :--- | :--- | :--- | :--- |
| `TC-POS-01` | 신규 항목 정상 등록 | 로그인 완료, 워크스페이스 선택 | 1. 생성 버튼 클릭<br>2. 필수값 입력 후 확인 클릭 | 모달 닫힘, 목록에 신규 항목 노출, DB 레코드 생성 완료 |
| `TC-POS-02` | 조건별 필터링 조회 | 목록에 5건 이상 데이터 존재 | 1. 상태 'ACTIVE' 필터 선택 | ACTIVE 상태인 항목만 필터링되어 화면에 표시 |
| `TC-POS-03` | 인라인/상세 수정 | 기존 항목 존재 | 1. 항목 수정 실행 후 저장 | 변경된 내용이 실시간 갱신되어 UI에 반영 |

### 5.2 예외 및 차단 시나리오 (Negative Test Cases)
| TC ID | 테스트 명칭 | 입력 및 상황 | 기대 에러 응답 | UI 처리 (Toast / 경고) |
| :---: | :--- | :--- | :---: | :--- |
| `TC-NEG-01` | 필수값 누락 생성 시도 | `name`을 공백 상태로 등록 요청 | `400 Bad Request` | "이름을 입력해주세요" 유효성 에러 텍스트 표시 |
| `TC-NEG-02` | 타 테넌트 리소스 접근 | 소속되지 않은 워크스페이스 ID로 요청 | `403 Forbidden` | "접근 권한이 없습니다" 경고 토스트 후 목록 이동 |
| `TC-NEG-03` | 중복 데이터 등록 시도 | 이미 존재하는 동일 `name`으로 등록 | `409 Conflict` | "이미 존재하는 항목입니다" 안내 토스트 출력 |

### 5.3 데이터 정합성 및 회귀 검증 (Data Integrity Points)
- 연관 하위 데이터의 Cascade 처리 검증
- 캐시 갱신 시 다른 브라우저 탭/컴포넌트 간 데이터 동기화 확인

---

## 6. 개발 파이프라인 산출물 체크리스트 (Deliverables Checklist)

[GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md)에 정의된 **Concurrent & API-Viewer Bridge Pipeline**에 따른 필수 산출물입니다.

### 🚩 Phase 1: 병렬 동시 착수 (Parallel Initiation)
- [ ] **Backend (`backend-developer`)**:
  - [ ] Prisma 스키마 반영 (`prisma/schema.prisma` 또는 `schema.workspace.prisma`)
  - [ ] API 스펙 산출물 문서 작성: `docs/api/[domain]/[action].md`
  - [ ] DTO 및 3-Tier 모듈 작성: `src/modules/[domain]/*` (Routes, Controllers, Sub-Services)
  - [ ] 단위 테스트 작성 및 통과: `src/tests/[domain].*.test.ts` (`npm test` 100% Pass)
- [ ] **Frontend (`frontend-developer`)**:
  - [ ] 컴포넌트 사양서 문서 작성: `docs/components/[Domain]_COMPONENTS.md`
  - [ ] 도메인 타입 정의: `src/types/[domain].ts`
  - [ ] UI 모듈러 서브 컴포넌트 구현: `src/components/[domain]/*` (Max 400줄 준수 + `index.ts`)
  - [ ] Mock 데이터 기반 UI 및 상태 바인딩 (`use[Domain]Store.ts` 등)

### 🚩 Phase 2: API 완성 및 브릿지 전달 (API Bridge)
- [ ] **Bridge Hub (`api-viewer`)**:
  - [ ] `api_inspector.py` 실행을 통한 `docs/api/[domain]/` 및 백엔드 실제 구현 소스 스캔
  - [ ] `frontend-developer`에게 실제 API DTO 및 엔드포인트 변경사항 인계
  - [ ] `qa-tester`에게 에러 코드 및 유효성 검증 규칙 인계

### 🚩 Phase 3: 실제 연동 및 풀스택 QA (Integration & QA)
- [ ] **Frontend 연동 & 품질 검증**:
  - [ ] 실제 API Call 바인딩: `src/api/[domain].ts` (TanStack Query 훅 연결)
  - [ ] 아키텍처 정적 분석 통과: `python .agents/skills/react-component-reviewer/scripts/component_reviewer.py` (0 errors)
  - [ ] 프로덕션 빌드 성공: `npm run build`
- [ ] **QA 테스터 (`qa-tester`)**:
  - [ ] 시나리오 테스트 문서 작성: `docs/qa/scenarios/[domain].md` (Positive & Negative TC)
  - [ ] 풀스택 회귀 검증 통과: `python .agents/skills/scenario-qa-runner/scripts/qa_runner.py --run-all`
- [ ] **마스터 문서 동기화**:
  - [ ] 백엔드 API 색인: `docs/api/README.md`
  - [ ] 프론트엔드 컴포넌트 색인: `docs/FRONTEND_SPECIFICATION.md`
  - [ ] QA 시나리오 색인: `docs/qa/README.md`
