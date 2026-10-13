# 📋 커스터마이징 대시보드 (Customizable Dashboard) Feature Specification & Planning Document

> **문서 상태**: Approved (기획 완료)  
> **기능 ID**: `FEAT-DASHBOARD-01`  
> **대상 도메인**: `dashboard`  
> **작성자 / 일자**: AntiGravity Orchestrator / 2026-10-12  
> **관련 문서**: [GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md) (개발 표준 파이프라인 준수)

---

## 1. 기능 개요 및 사용자 가치 (Feature Overview)

### 1.1 배경 및 목적 (Background & Objective)
- **배경**: 기존 대시보드는 정적인 섹션으로 고정되어 있어 사용자가 본인의 워크플로우에 따라 필요한 뷰를 배치하기 어려웠습니다. 초기에는 메인 페이지의 대형 컴포넌트(칸반 보드, WBS 메인 분할 뷰 등)를 그대로 대시보드에서 재활용하려 했으나, 툴바 의존성, 페이지 단위 라우트 결합, 높이 제약 등 상호 간섭 요소가 많아 효율적이지 않았습니다.
- **아키텍처 혁신 (Widgetable 인터페이스 도입)**:
  - **기존 통째 컴포넌트 재활용 방안 폐기**: 각 도메인의 대형 페이지 컴포넌트를 억지로 재활용하지 않고, 각 컴포넌트/도메인이 대시보드 전용 Widget을 독립적으로 제공합니다.
  - **`Widgetable` 인터페이스 표준화**: 대시보드에 위젯을 제공하는 컴포넌트는 `Widgetable` 인터페이스 규격을 구현합니다.
  - **플러그인형 `WidgetRegistry`**: 대시보드 애플리케이션은 `WidgetRegistry`를 통해 `Widgetable` 규격을 준수하는 위젯들을 로드하여 동적으로 추가/배치/렌더링합니다.
  - **칸반 보드 위젯 필터링**: 칸반 위젯은 Status(상태) 및 Type(유형) 필터링 인터페이스를 탑재하여 원하는 카드만 모니터링합니다.
  - **최근 등록된 이슈 접근 통제**: 로그인 사용자가 관여한(보고자 `reporterId`/`authorId`, 담당자 `assigneeId`) 이슈 및 참여 프로젝트(`owner`/`member`) 이슈만 노출합니다.
  - **캘린더 일정 상시 리스트**: 캘린더 위젯 하단에 이달의 일정을 항상 노출하고 스크롤뷰로 탐색할 수 있습니다.
  - **대시보드 전용 메모장(MemoWidget)**: 대시보드 상에서 독립적으로 작동하는 빠른 메모장 위젯을 탑재합니다.

### 1.2 핵심 사용자 시나리오 (User Journey & Core Value)
1. **위젯 카탈로그 탐색 및 동적 추가**: `WidgetRegistry`에 등록된 `Widgetable` 목록을 기반으로 위젯 추가 모달에서 원하는 위젯을 자유롭게 선택하여 대시보드에 추가합니다.
2. **반응형 12컬럼 그리드 크기 및 위치 조정**: 각 위젯의 너비(3~12 cols), 높이(compact, normal, tall), 순서를 자유롭게 조정합니다.
3. **칸반 위젯 정밀 필터링**: 칸반 위젯 우측 상단 설정 아이콘을 눌러 원하는 상태 및 이슈 유형을 필터링합니다.
4. **관여 이슈 중심의 최근 이슈 위젯**: 내가 관여했거나 참여한 프로젝트의 이슈만 노출되어 외부 프로젝트의 일감 노출을 원천 방지합니다.
5. **캘린더 하단 상시 리스트**: 미니 캘린더 하단에 이달의 일정 리스트가 상시 노출되며, 늘어난 항목은 세로 스크롤로 확인합니다.
6. **대시보드 빠른 메모 관리**: 메모장 위젯에서 대시보드 전용 작업 노트를 등록/관리합니다.
7. **하이브리드 영속화 (LocalStorage + Cloud DB)**: 위젯 레이아웃과 필터 설정은 LocalStorage에 보존되고 로그인 시 백엔드 `User.preferences`로 실시간 동기화됩니다.

### 1.3 사용자 권한 및 접근 제어 (Authorization & Scope)
- **적용 스코프**: 전역(Core) 및 워크스페이스(Workspace) 연동 하이브리드
- **필요 권한**:
  - `GUEST` (비로그인): LocalStorage 기반으로 자유롭게 위젯 구성 가능 (최근 이슈 위젯은 로그인 안내 메시지 표시)
  - `MEMBER` / `ADMIN`: LocalStorage + 백엔드 DB 사용자 환경설정(`User.preferences`) 클라우드 동기화 지원

---

## 2. 데이터 모델 및 비즈니스 규칙 (Data Model & Business Rules)

### 2.1 데이터베이스 스키마 요구사항 (Prisma Schema Target)
- **대상 DB**: `workflow_server/prisma/schema.global.prisma` (`User` 모델의 `preferences` JSON 활용)
- **설정 데이터 구조**: `User.preferences` 내 `dashboardConfig` JSON 객체에 저장

```prisma
// workflow_server/prisma/schema.global.prisma
model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  name         String?
  role         String    @default("MEMBER")
  preferences  String?   @default("{}") // 전역 UI 설정 JSON (dashboardConfig 포함)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### 2.2 필드 상세 명세 및 제약조건 (Field Constraints)
위젯 설정 JSON DTO 구조:

| 필드명 | 타입 | 필수 여부 | 기본값 | 제약조건 / 유효성 검사 규칙 |
| :--- | :--- | :---: | :--- | :--- |
| `id` | String | 필수 | UUID | 위젯 인스턴스 고유 식별자 |
| `type` | String | 필수 | - | `'kanban'`, `'wbs'`, `'calendar'`, `'stats'`, `'sprints'`, `'recent-issues'`, `'memo'` 등 `Widgetable` 등록 타입 |
| `title` | String | 필수 | 기본 위젯명 | 1자 이상 50자 이하 |
| `colSpan` | Number | 필수 | 6 | 12컬럼 그리드 너비 (최소 3, 최대 12) |
| `height` | String | 필수 | `'normal'` | `'compact'` (280px), `'normal'` (420px), `'tall'` (600px) |
| `order` | Number | 필수 | 0 | 그리드 정렬 인덱스 (0부터 증가) |
| `config` | Object | 선택 | `{}` | 위젯별 세부 설정 (statusCategories, typeIds, projectId 등) |

### 2.3 비즈니스 로직 & 엣지 케이스 (Business Logic & Edge Cases)
1. **Widgetable 인터페이스 계약 (Contract)**:
   - 각 도메인 컴포넌트가 대시보드 위젯을 제공하려면 `Widgetable` 규격(`type`, `title`, `description`, `defaultColSpan`, `defaultHeight`, `Component`, `ConfigModal`)을 온전히 갖추어야 합니다.
   - `WidgetRegistry`에 등록되지 않은 위젯 타입이 저장 데이터에 포함되어 있을 경우 에러 없이 '지원되지 않는 위젯' 플레이스홀더를 렌더링하고 안전하게 삭제할 수 있도록 지원합니다.
2. **최근 등록된 이슈 필터링 규칙**:
   - 조건: `((iss.reporterId === user.id || iss.authorId === user.id) || iss.assigneeId === user.id || myProjectIds.includes(iss.projectId))`
   - 비로그인 사용자에게는 타인의 이슈를 일절 보여주지 않고 "로그인 후 관여된 이슈가 표시됩니다" 안전 뷰를 제공합니다.
3. **캘린더 일정 리스트 상시 노출 및 스크롤 규칙**:
   - 날짜를 클릭하지 않아도 이달의 일정 리스트가 하단에 항상 노출되며, `maxHeight: 130px` 세로 스크롤바로 원활하게 이동할 수 있습니다.
4. **메모장 위젯 비즈니스 규칙**:
   - 로그인 사용자는 백엔드 `/api/memos` API와 동기화되며, 비로그인 시 로컬스토리지 `ag_dashboard_quick_memos`에 보존됩니다.

---

## 3. 백엔드 REST API 명세 (Backend API Specifications)

### 3.1 엔드포인트 목록 (Endpoint Summary)

| Action | Method | URL Endpoint | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| 환경설정 조회 | `GET` | `/api/users/me` | 인증 사용자 | 대시보드 레이아웃 포함 내 계정 환경설정 조회 |
| 환경설정 갱신 | `PUT` | `/api/users/profile` | 인증 사용자 | 대시보드 위젯 구성 JSON 저장 및 동기화 |
| 메모 목록 조회 | `GET` | `/api/memos` | 인증 사용자 | 대시보드 메모장 위젯용 메모 목록 조회 |
| 메모 작성 | `POST` | `/api/memos` | 인증 사용자 | 신규 메모 등록 |
| 메모 삭제 | `DELETE` | `/api/memos/:id` | 인증 사용자 | 메모 삭제 |

### 3.2 상세 요청 및 응답 규격 (Detailed Request / Response)

#### 1) `PUT /api/users/profile` - 사용자 대시보드 환경설정 저장
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
```json
{
  "preferences": "{"dashboardConfig":{"version":1,"widgets":[{"id":"w-kanban-1","type":"kanban","title":"내 이슈 칸반","colSpan":6,"height":"normal","order":0,"config":{"statusCategories":["IN_PROGRESS"],"typeIds":[1]}}]}}"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "preferences": "{"dashboardConfig":{"version":1,"widgets":[...]}}",
    "updatedAt": "2026-10-12T14:00:00.000Z"
  }
}
```
- **Error Codes (Negative Responses)**:
  - `400 Bad Request`: JSON 형식 오류 또는 파싱 실패 (`VALIDATION_ERROR`)
  - `401 Unauthorized`: 인증 토큰 누락 또는 만료 (`UNAUTHORIZED`)

---

## 4. 프론트엔드 UI/UX 사양 (Frontend UI/UX Specifications)

### 4.1 페이지 및 라우트 구조 (Page & Route)
- **페이지 경로**: `src/pages/DashboardPage.tsx`
- **URL 라우트**: `/` (기본 대시보드 해시 `#dashboard`)
- **역할 분담**: `DashboardPage.tsx`는 상단 툴바와 위젯 오케스트레이터 역할만 수행하며 `WidgetRegistry`를 통해 모든 위젯을 동적으로 결합합니다.

### 4.2 컴포넌트 모듈화 계획 (Sub-Component & Widgetable Architecture)

```text
src/
├── types/
│   ├── widget.ts                    # Widgetable<TConfig> 표준 인터페이스 및 위젯 타입 규격
│   └── dashboard.ts                 # DashboardWidgetItem, DashboardLayoutData 데이터 모델
├── components/
│   ├── kanban/
│   │   ├── KanbanWidget.tsx         # kanbanWidgetDefinition (Widgetable 구현)
│   │   └── KanbanWidgetConfigModal.tsx
│   ├── wbs/
│   │   └── WBSWidget.tsx            # wbsWidgetDefinition (Widgetable 구현)
│   ├── calendar/
│   │   └── CalendarWidget.tsx       # calendarWidgetDefinition (Widgetable 구현)
│   ├── memos/
│   │   └── MemoWidget.tsx           # memoWidgetDefinition (Widgetable 구현)
│   └── dashboard/
│       ├── index.ts
│       ├── widgetRegistry.ts        # Widgetable 중앙 레지스트리 (get, getAll, register)
│       ├── DashboardSummaryToolbar.tsx
│       ├── DashboardWidgetGrid.tsx  # WidgetRegistry 기반 동적 렌더러
│       ├── DashboardWidgetCard.tsx
│       ├── DashboardWidgetAddModal.tsx # WidgetRegistry 기반 동적 위젯 추가 모달
│       └── widgets/                 # Core 대시보드 전용 위젯 (Stats, Sprints, RecentIssues)
│           ├── StatCardsWidget.tsx
│           ├── FocusSprintsWidget.tsx
│           └── RecentIssuesWidget.tsx
```

### 4.3 모달 및 팝업 정책 (Modal & Overlay Policy)
- `DashboardWidgetAddModal.tsx`: 위젯 추가 팝업 (`<ModalWrapper zIndex={1500}>` Portal 사용)
- `KanbanWidgetConfigModal.tsx`: 칸반 필터 설정 팝업 (`<ModalWrapper zIndex={1600}>` Portal 사용)
- 모든 모달은 마우스 down(mousedown) 이벤트 기반으로만 외부 클릭 닫기 처리.

### 4.4 상태 관리 분리 계획 (State Management Architecture)
1. **Client & Local Storage State (`src/stores/useDashboardStore.ts`)**:
   - `widgets: DashboardWidgetItem[]`
   - `isEditMode: boolean`
   - `addWidget(type: DashboardWidgetType)`
   - `removeWidget(id: string)`
   - `updateWidgetLayout(id: string, colSpan: number, height: string)`
   - `updateWidgetConfig(id: string, config: any)`
   - `reorderWidgets(sourceIdx: number, targetIdx: number)`
   - `resetToDefaultLayout()`
   - 네임스페이스 키: `ag_dashboard_widgets_v1`
2. **Server State (TanStack Query v5)**:
   - 로그인 시 `useUser`를 통해 `preferences.dashboardConfig`를 불러와 초기 로컬스토리지와 병합.
   - 레이아웃 수정 완료 시 디바운스(800ms)로 백엔드 `updateProfile` 호출.

### 4.5 Phase 1 병렬 개발용 Mock Data 명세 (Mock Contract)

```typescript
// src/components/dashboard/dashboard.mock.ts
export const MOCK_DASHBOARD_WIDGETS = [
  {
    id: 'mock-stat-1',
    type: 'stats',
    title: '작업 및 프로젝트 현황 요약',
    colSpan: 12,
    height: 'compact',
    order: 0,
    config: {},
  },
  {
    id: 'mock-kanban-1',
    type: 'kanban',
    title: '이슈 칸반 보드',
    colSpan: 6,
    height: 'normal',
    order: 1,
    config: {
      statusCategories: ['IN_PROGRESS', 'IN_REVIEW'],
      typeIds: [],
    },
  },
  {
    id: 'mock-calendar-1',
    type: 'calendar',
    title: '캘린더 일정',
    colSpan: 6,
    height: 'normal',
    order: 2,
    config: {},
  },
  {
    id: 'mock-memo-1',
    type: 'memo',
    title: '대시보드 메모장',
    colSpan: 6,
    height: 'normal',
    order: 3,
    config: {},
  },
];
```

---

## 5. QA 및 통합 테스트 시나리오 (QA & Scenario Test Cases)

### 5.1 정상 시나리오 (Positive Test Cases)

| TC ID | 테스트 명칭 | 사전 조건 | 조작 단계 | 기대 결과 (UI 및 데이터) |
| :---: | :--- | :--- | :--- | :--- |
| `TC-POS-01` | Widgetable 등록 기반 위젯 추가 | 대시보드 페이지 진입 | 1. '위젯 추가' 버튼 클릭<br>2. 레지스트리 위젯(칸반/WBS/메모 등) 선택 및 추가 | `WidgetRegistry`에서 정의를 가져와 최하단에 신규 위젯이 즉시 동적 렌더링됨 |
| `TC-POS-02` | 위젯 크기 및 컬럼 폭 조절 | 대시보드 위젯 존재 | 1. 위젯 헤더의 폭 셀렉트박스에서 '12칸 (100%)' 선택<br>2. 높이를 'tall'로 선택 | 위젯이 전체 폭(12cols)과 600px 높이로 즉시 확장되며 반응형 그리드 정렬됨 |
| `TC-POS-03` | 칸반 위젯 Status/Type 필터링 | 칸반 위젯 렌더링됨 | 1. 칸반 위젯 설정 아이콘 클릭<br>2. Status를 'IN_PROGRESS'만 선택<br>3. Type을 'BUG'만 선택 후 적용 | 칸반 보드에 오직 진행 중인 버그 일감 카드만 필터링되어 출력됨 |
| `TC-POS-04` | 최근 등록 이슈 관여자/참여 프로젝트 필터링 | 사용자 로그인 완료 | 최근 등록된 이슈 위젯 확인 | 보고자, 담당자, 또는 참여 프로젝트에 속한 이슈만 표시되고 무관한 타 프로젝트 이슈는 은닉됨 |
| `TC-POS-05` | 캘린더 하단 상시 리스트 및 스크롤 | 캘린더 위젯 렌더링됨 | 캘린더 하단 리스트 영역 확인 및 스크롤 조작 | 날짜 미선택 시에도 이달의 일감이 항상 목록으로 노출되며 늘어난 항목이 세로 스크롤됨 |
| `TC-POS-06` | 대시보드 메모장 작성 및 관리 | 메모장 위젯 렌더링됨 | 1. 메모 입력창에 내용 작성 후 등록<br>2. 삭제 버튼 클릭 | 작성된 메모가 실시간 목록에 추가되고 삭제 시 즉시 제거됨 |

### 5.2 예외 및 차단 시나리오 (Negative Test Cases)

| TC ID | 테스트 명칭 | 입력 및 상황 | 기대 에러 응답 | UI 처리 (Toast / 경고) |
| :---: | :--- | :--- | :--- | :--- |
| `TC-NEG-01` | 마지막 남은 위젯 삭제 시도 | 대시보드에 위젯 1개만 남음 | 삭제 버튼 비활성화 또는 차단 | "최소 1개 이상의 위젯이 유지되어야 합니다" 안내 표시 |
| `TC-NEG-02` | 최대 위젯 개수(20개) 초과 추가 시도 | 이미 20개 위젯이 등록됨 | `VALIDATION_LIMIT` | 위젯 추가 버튼 비활성화 및 "최대 20개까지 추가 가능합니다" 안내 출력 |
| `TC-NEG-03` | 비로그인 시 최근 이슈 위젯 조회 | 비로그인 상태로 대시보드 접근 | - | 타인의 프라이빗 이슈 유출 없이 "로그인 후 관여된 이슈가 표시됩니다" 안전 뷰 제공 |
| `TC-NEG-04` | 칸반 필터 전체 해제 시도 | Status/Type 모든 체크박스 해제 | - | 에러 없이 "선택된 필터에 해당하는 일감이 없습니다" 빈 상태 뷰 렌더링 |

### 5.3 데이터 정합성 및 회귀 검증 (Data Integrity Points)
- 브라우저 새로고침(F5) 후에도 직전 조정한 너비(colSpan), 높이(height), 순서(order), 칸반 필터, 메모장 데이터가 100% 동일하게 복원되는지 검증
- 다른 탭(프로젝트, 칸반, WBS 등)으로 이동했다가 대시보드로 돌아왔을 때 상태 유지 확인

---

## 6. 개발 파이프라인 산출물 체크리스트 (Deliverables Checklist)

[GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md)에 정의된 **Concurrent & API-Viewer Bridge Pipeline**에 따른 필수 산출물입니다.

### 🚩 Phase 1: 병렬 동시 착수 (Parallel Initiation)
- [x] **Backend (`backend-developer`)**:
  - [x] `User.preferences` 내 `dashboardConfig` JSON 유효성 검증 로직 점검
  - [x] 단위 테스트 작성 및 통과 (`users.preferences.test.ts` 연동)
- [x] **Frontend (`frontend-developer`)**:
  - [x] 도메인 타입 정의: `src/types/dashboard.ts` (`Widgetable<TConfig>` 인터페이스 정의)
  - [x] 위젯 레지스트리: `src/components/dashboard/widgetRegistry.ts` (Widgetable 등록 및 조회)
  - [x] 각 도메인별 Widgetable 컴포넌트 제공:
    - [x] Kanban: `KanbanWidget.tsx` (kanbanWidgetDefinition)
    - [x] WBS: `WBSWidget.tsx` (wbsWidgetDefinition)
    - [x] Calendar: `CalendarWidget.tsx` (calendarWidgetDefinition)
    - [x] Memo: `MemoWidget.tsx` (memoWidgetDefinition)
    - [x] Core 위젯: StatCards, FocusSprints, RecentIssues
  - [x] Zustand 스토어: `src/stores/useDashboardStore.ts` (레지스트리 기반 기본값 동기화)
  - [x] 그리드 컨테이너 & 위젯 카드: `DashboardWidgetGrid.tsx`, `DashboardWidgetCard.tsx`
  - [x] 위젯 추가 팝업: `DashboardWidgetAddModal.tsx` (WidgetRegistry 기반 동적 목록)
  - [x] 메인 대시보드 통합: `src/pages/DashboardPage.tsx` (400줄 이하 준수)

### 🚩 Phase 2: API 완성 및 브릿지 전달 (API Bridge)
- [x] **Bridge Hub (`api-viewer`)**:
  - [x] 백엔드 `PUT /api/users/profile` DTO 정합성 확인
  - [x] FE 연동 규격 점검

### 🚩 Phase 3: 실제 연동 및 풀스택 QA (Integration & QA)
- [x] **Frontend 연동 & 품질 검증**:
  - [x] 백엔드 사용자 설정 동기화 연동
  - [x] 프로덕션 빌드 성공: `npm run build`
  - [x] Linter 검사 통과: `npm run lint`
- [x] **QA 테스터 (`qa-tester`)**:
  - [x] 시나리오 테스트(TC-POS-01~06, TC-NEG-01~04) 검증 완료
