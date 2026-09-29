# 📋 개인 메모(Personal Memo) Feature Specification & Planning Document

> **문서 상태**: Approved  
> **기능 ID**: `FEAT-MEMO-01`  
> **대상 도메인**: `memo`  
> **작성자 / 일자**: AntiGravity Spec Planner / 2026-09-21  
> **관련 문서**: [GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md) (개발 표준 파이프라인 준수)

---

## 1. 기능 개요 및 사용자 가치 (Feature Overview)

### 1.1 배경 및 목적 (Background & Objective)
- **배경**: 프로젝트 협업 과정에서 이슈의 댓글이나 설명란은 모든 팀원에게 공개되므로, 작업자 개인이 일시적으로 기억해야 할 작업 힌트, 미완성 아이디어, 체크리스트, 개인적 리마인더를 기록하기에 부적합합니다. 사용자가 이슈 및 전역 환경에서 다른 팀원에게 노출되지 않는 포스트잇 형태의 비공개 노트를 안전하고 빠르게 남길 수 있는 수단이 필요합니다.
- **목적**: 마크다운(Markdown) 문법을 완벽히 지원하며 실시간으로 자동 저장되는 **개인 사용자 전용 메모(Personal Post-it Memo)** 기능을 제공합니다. 이슈 칸반보드, 스프린트 뷰, **WBS(Work Breakdown Structure) 계층 트리 및 간트 뷰**에서는 직관적인 시각 인디케이터(좌측 상단 붉은색 삼각형)와 마우스 호버 툴팁으로 즉시 확인하고, 좌측 네비게이션의 전용 "메모" 페이지에서는 카드 그리드 뷰 및 화면 중앙 확대 인플레이스 에디터를 통해 생산성을 극대화합니다. 초기 단계는 데이터베이스 스키마 수정 없이 **Zustand + LocalStorage(`safeStorage`)** 기반으로 기동하며, 향후 백엔드 DB 연동 시 대역폭을 고려한 비동기 디바운스 설계를 수립합니다.

### 1.2 핵심 사용자 시나리오 (User Journey & Core Value)
1. **이슈별 개인 포스트잇 부착 및 인디케이터 확인 (칸반 / 스프린트 / WBS 공통)**:
   - 사용자는 칸반보드, 스프린트 목록, **WBS 트리 테이블 및 간트 타임라인**의 이슈에 대해 본인만의 메모를 작성할 수 있습니다.
   - 메모가 존재하는 이슈 카드/행 좌측 상단에는 **붉은색 삼각형 뱃지(Corner Ribbon Badge)**가 일관되게 렌더링됩니다.
   - 마우스를 해당 이슈 카드나 WBS 항목 위에 호버(Hover)하면, 렌더링된 마크다운 메모 내용이 최상단 툴팁/팝오버로 즉시 노출됩니다.
2. **전용 메모 페이지 탐색 및 인플레이스 확대 편집**:
   - 좌측 메뉴의 "메모" 탭을 선택하면 사용자가 작성한 모든 메모(이슈 연동 메모 및 단독 메모)가 프로젝트 목록과 유사한 **카드 컴포넌트 그리드**로 출력됩니다.
   - 텍스트 길이가 긴 메모는 세로로 유연하게 늘어납니다.
   - 카드를 클릭하면 그 자리에서 오른쪽 페이지 화면 중앙으로 대형 확대되어 표시되며, 가로/세로 스크롤을 지원하여 긴 문서도 편안하게 편집할 수 있습니다.
   - 확대된 에디터 바깥 영역(Outside Backdrop)을 클릭하면 모달이 부드럽게 닫힙니다.
3. **무중단 실시간 자동 저장(Autosave)**:
   - 별도의 저장 버튼 클릭 없이 텍스트 입력 및 포커스 아웃 시 자동으로 저장됩니다.
   - 디바운스(Debounce) 알고리즘을 적용하여 불필요한 스토리지 쓰기 및 향후 네트워크 API 호출 빈도를 최적화합니다.
4. **철저한 개인 프라이버시 보장**:
   - 오직 작성자 본인만 열람 및 수정할 수 있으며, 프로젝트 관리자나 다른 팀원에게는 메모의 존재 여부조차 노출되지 않습니다.

### 1.3 사용자 권한 및 접근 제어 (Authorization & Scope)
- **적용 스코프**: 사용자 개인 격리 스코프 (Personal User Scope)
- **접근 및 제어 규칙**:
  - `인증된 사용자 (Authenticated User)`: 본인 계정의 메모에 대해서만 완전한 CRUD 권한 보유.
  - `타 사용자 (Other Users)`: 어떠한 권한 등급(프로젝트 관리자, 워크스페이스 오너 포함)이어도 타인의 메모 데이터에 접근 불가.
  - `비인증 게스트 (Guest)`: 메모 기능 사용 불가 (로그인 안내 모달 출력).

---

## 2. 데이터 모델 및 비즈니스 규칙 (Data Model & Business Rules)

### 2.1 데이터베이스 스키마 요구사항 (Prisma Schema Target)
현재 단계는 클라이언트 로컬스토리지(Zustand)로 검증을 진행하지만, 향후 백엔드 서버 DB(`workflow_server/prisma/schema.workspace.prisma`) 이관 시 아래 스키마 모델을 준수하여 구현합니다.

```prisma
// workflow_server/prisma/schema.workspace.prisma
// 향후 백엔드 데이터베이스 이관 대상 모델
model UserMemo {
  id          Int       @id @default(autoincrement())
  userId      Int       // 메모 작성자 고유 ID (인증 토큰의 payload.userId)
  issueId     Int?      // 연계된 이슈 ID (독립 메모인 경우 null)
  content     String    @db.Text // Markdown 원문 텍스트
  color       String    @default("yellow") @db.VarChar(20) // 포스트잇 테마 컬러: yellow, blue, green, pink, purple
  isPinned    Boolean   @default(false) // 상단 고정 여부
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  issue       Issue?    @relation(fields: [issueId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([userId, issueId])
  @@map("user_memos")
}
```

### 2.2 클라이언트 스토리지 모델 (Current Zustand & safeStorage Model)
현재 검토 단계에서 사용되는 브라우저 로컬스토리지 구조입니다.

```typescript
// workflow_react/src/types/memo.ts
export type MemoColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export interface UserMemoItem {
  id: string;              // 클라이언트 생성 고유 식별자 (UUID v4)
  userId: number;          // 로그인 사용자 ID
  issueId: number | null;  // 연계된 이슈 ID (독립 메모인 경우 null)
  content: string;         // Markdown 텍스트 내용
  color: MemoColor;        // 포스트잇 색상
  isPinned: boolean;       // 즐겨찾기/상단 고정 여부
  createdAt: string;       // ISO 8601 일시
  updatedAt: string;       // ISO 8601 일시
}
```

### 2.3 필드 상세 명세 및 제약조건 (Field Constraints)
| 필드명 | 타입 | 필수 여부 | 기본값 | 제약조건 / 유효성 검사 규칙 |
| :--- | :--- | :---: | :--- | :--- |
| `id` | String / Int | 필수 | UUID | 클라이언트는 UUID 문자열, DB는 Auto-increment Int |
| `userId` | Int | 필수 | - | 현재 로그인된 사용자의 고유 ID (변조 차단) |
| `issueId` | Int | 선택 | `null` | 양의 정수 (존재하지 않는 이슈 번호 방지) |
| `content` | String (Text)| 필수 | `""` | 최대 50,000자 이내의 Markdown 텍스트 |
| `color` | Enum / String | 필수 | `'yellow'` | `'yellow'`, `'blue'`, `'green'`, `'pink'`, `'purple'` 중 하나 |
| `isPinned` | Boolean | 필수 | `false` | 상단 고정 여부 |
| `createdAt` | DateTime/ISO | 필수 | `now()` | 생성 일시 |
| `updatedAt` | DateTime/ISO | 필수 | `now()` | 마지막 수정 일시 |

### 2.4 비즈니스 로직 & 엣지 케이스 (Business Logic & Edge Cases)
1. **계정별 데이터 격리**:
   - 로컬스토리지 키는 `ag_user_memos_{userId}` 네임스페이스를 사용하여 다중 사용자가 동일 PC/브라우저를 교대 사용하더라도 상호 데이터가 섞이지 않도록 격리합니다.
2. **자동 저장 디바운스(Debounce) 및 대역폭 최적화**:
   - 타이핑 입력 중에는 600ms 동안 디바운스를 적용하여 로컬스토리지 I/O 부하를 줄입니다.
   - 향후 서버 연동 시에도 응답(Response) 본문을 받아 전체 목록을 재조회(refetch)하지 않고, 로컬 상태를 선반영(Optimistic Update)한 뒤 백그라운드에서 동기화합니다 (Fire-and-Forget 동기화).
3. **연계 이슈 삭제 시 동작 (Cascade SetNull)**:
   - 연계된 Issue가 삭제되거나 아카이빙된 경우, 해당 메모는 삭제되지 않고 `issueId`가 `null`로 안전하게 전환되어 독립 메모로 영구 보존됩니다.
4. **마크다운 렌더링 보안**:
   - `react-markdown` 렌더링 시 XSS 위험을 방지하기 위해 기본 HTML 태그 삽입을 무력화하고 표준 마크다운(GFM) 컴포넌트만 지원합니다.

---

## 3. 백엔드 REST API 명세 (Backend API Specifications)

향후 DB 반영 및 서버 연동 시 사용할 규격입니다.

### 3.1 엔드포인트 목록 (Endpoint Summary)
| Action | Method | URL Endpoint | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| 목록 조회 | `GET` | `/api/memos` | 인증 사용자 | 본인이 작성한 메모 전체 목록 조회 |
| 이슈 메모 조회 | `GET` | `/api/memos/issue/:issueId` | 인증 사용자 | 특정 이슈에 등록된 본인의 메모 조회 |
| 단일 조회 | `GET` | `/api/memos/:id` | 소유자 | 특정 메모 상세 조회 |
| 메모 생성 | `POST` | `/api/memos` | 인증 사용자 | 신규 메모 생성 (이슈 연동 또는 단독) |
| 메모 수정 | `PUT` | `/api/memos/:id` | 소유자 | 메모 내용, 색상, 고정 상태 수정 |
| 메모 삭제 | `DELETE` | `/api/memos/:id` | 소유자 | 메모 영구 삭제 |

### 3.2 상세 요청 및 응답 규격 (Detailed Request / Response)

#### 1) `POST /api/memos` - 신규 메모 생성
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
  "issueId": 1042,
  "content": "# 긴급 확인 사항\n- [ ] 내일 오전 배포 전 캐시 무효화 테스트 필수",
  "color": "yellow",
  "isPinned": false
}
```
- **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": 15,
    "userId": 7,
    "issueId": 1042,
    "content": "# 긴급 확인 사항\n- [ ] 내일 오전 배포 전 캐시 무효화 테스트 필수",
    "color": "yellow",
    "isPinned": false,
    "createdAt": "2026-09-21T07:15:00.000Z",
    "updatedAt": "2026-09-21T07:15:00.000Z"
  }
}
```

#### 2) `PUT /api/memos/:id` - 메모 수정 (자동 저장 대상)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
  "content": "# 긴급 확인 사항\n- [x] 캐시 무효화 테스트 완료\n- [ ] 롤백 시나리오 점검",
  "color": "pink",
  "isPinned": true
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 15,
    "userId": 7,
    "issueId": 1042,
    "content": "# 긴급 확인 사항\n- [x] 캐시 무효화 테스트 완료\n- [ ] 롤백 시나리오 점검",
    "color": "pink",
    "isPinned": true,
    "updatedAt": "2026-09-21T07:16:30.000Z"
  }
}
```
- **Error Codes (Negative Responses)**:
  - `400 Bad Request`: 필수 내용 누락 또는 유효하지 않은 색상 코드 (`VALIDATION_ERROR`)
  - `401 Unauthorized`: 유효하지 않거나 만료된 토큰 (`UNAUTHORIZED`)
  - `403 Forbidden`: 타인이 작성한 메모를 수정/삭제하려는 시도 (`FORBIDDEN_RESOURCE`)
  - `404 Not Found`: 대상 메모 ID 미존재 (`MEMO_NOT_FOUND`)

---

## 4. 프론트엔드 UI/UX 사양 (Frontend UI/UX Specifications)

### 4.1 페이지 및 라우트 구조 (Page & Route)
- **페이지 컴포넌트**: `src/pages/MemosPage.tsx`
- **URL 라우트**: `/memo` (사이드바 메뉴 클릭 시 `activeTab === 'memo'`)
- **칸반 / 스프린트 / WBS 침투 컴포넌트**:
  - `KanbanCard.tsx`: 카드 좌측 상단 모서리에 `MemoIndicator` 삽입
  - `SprintIssuesTab.tsx` / `SprintCard.tsx`: 이슈 행 좌측 상단 모서리에 `MemoIndicator` 삽입
  - `WBSTreeRow.tsx`: WBS 트리 테이블 행의 좌측 상단 모서리(인덱스/아이콘 영역)에 `MemoIndicator` 삽입
  - `WBSGanttBar.tsx`: 간트 타임라인 바의 좌측 상단 모서리에 `MemoIndicator` 삽입 (호버 시 타임라인 상에서도 팝오버 즉시 확인)
- **모달 및 인플레이스 확장**:
  - `MemoEditorModal.tsx`: 화면 중앙에 오버레이 형태로 확장되어 가로/세로 스크롤 및 마크다운 에디터 제공

### 4.2 컴포넌트 모듈화 계획 (Sub-Component Breakdown)
> ⚠️ **원칙**: 모든 컴포넌트 파일은 **400줄 이하**로 분할하며, `src/components/memos/index.ts`를 통해 외부로 노출합니다.

```text
src/components/memos/
├── index.ts                     # Barrel export 단일 노출 창구
├── MemoIndicator.tsx            # 칸반/스프린트/WBS 카드·행 좌측 상단 붉은색 삼각형 뱃지 & 호버 팝오버 (150줄 이하)
├── MemoCard.tsx                 # 단일 메모 카드 (프로젝트 카드 스타일, 포스트잇 테마, 250줄 이하)
├── MemoEditorModal.tsx          # 화면 중앙 확장 인플레이스 에디터 (가로/세로 스크롤, 바깥 클릭 닫기, 300줄 이하)
├── MemoFilterBar.tsx            # 검색, 이슈 연동 필터(전체/이슈연계/단독), 색상 필터링 바 (180줄 이하)
├── MemoGrid.tsx                 # 반응형 카드 그리드 및 무한 확장 레이아웃 (200줄 이하)
└── MemoQuickAdd.tsx             # 이슈 상세/헤더 등에서 바로 메모를 작성할 수 있는 퀵 팝업 (180줄 이하)
```

### 4.3 모달 및 팝업 정책 (Modal & Overlay Policy)
1. **화면 중앙 확대 뷰 (`MemoEditorModal`)**:
   - 카드 클릭 시 오른쪽 페이지 중앙으로 부드럽게 확장(`transform: scale(1)`, `opacity: 1`)되며 렌더링됩니다.
   - **가로/세로 스크롤 지원**: 내용이 길거나 너비가 넓은 경우 내부 컨테이너에서 `overflow-x: auto; overflow-y: auto;`를 지원합니다.
   - **바깥 영역 클릭 시 자동 닫힘 (Click Outside to Close)**: 백드롭 또는 모달 외곽 영역 클릭 감지 시 변경사항을 즉시 커밋하고 모달을 닫습니다.
   - **접근성 및 제어**: `role="dialog"`, `aria-modal="true"`, ESC 키 입력 시 자동 닫힘, 배경 스크롤 락(`overflow: hidden`)을 기본 적용합니다.
2. **칸반 / 스프린트 / WBS 모서리 인디케이터 (`MemoIndicator`)**:
   - CSS 삼각형 클립패스(`clip-path: polygon(0 0, 100% 0, 0 100%)`)를 이용한 **붉은색 삼각형(Red Triangle Corner Badge)** 렌더링.
   - 위치: 부모 컨테이너(`position: relative; overflow: hidden`)의 `top: 0; left: 0`에 고정 배치.
   - 마우스 호버(`mouseenter`) 시 지연 없이 최상위 레이어(`z-index: 9999`)에 마크다운 파싱된 메모 내용 팝오버를 표시합니다.
   - 호버 팝오버 내에서도 더블 클릭 또는 편집 아이콘 클릭 시 즉시 `MemoEditorModal`로 진입 가능합니다.

### 4.4 상태 관리 분리 계획 (State Management Architecture)
1. **Global Client State (Zustand 5.x + safeStorage)**:
   - 파일 위치: `src/stores/useMemoStore.ts`
   - 스토리지 키: `ag_user_memos_${userId}`
   - 제공 상태 및 액션:
     - `memos`: `UserMemoItem[]`
     - `activeMemoId`: `string | null` (현재 확대 편집 중인 메모 ID)
     - `filter`: `{ search: string; issueFilter: 'ALL' | 'ISSUE_ONLY' | 'STANDALONE'; color: string | 'ALL' }`
     - `createMemo(data)`: 메모 생성 및 즉시 저장
     - `updateMemo(id, data)`: 메모 내용 갱신 (600ms 디바운스 자동 커밋)
     - `deleteMemo(id)`: 메모 삭제
     - `getMemoByIssueId(issueId)`: 특정 이슈의 메모 빠른 검색 (칸반, 스프린트, WBS에서 공통 호출)
     - `setActiveMemo(id)`: 확대 편집 모달 열기/닫기
2. **네트워크 통신 최적화 전략 (향후 Phase 3 연동 시)**:
   - `TanStack Query` 사용 시 `staleTime: Infinity` 설정 및 Optimistic Mutation 적용.
   - 수정 시 서버의 응답 데이터를 기다리지 않고 로컬 스토리지와 스토어 상태를 선반영하여 체감 속도 0ms 유지.
   - 너무 잦은 API 호출을 방지하기 위해 디바운스된 최종 상태만 서버로 전송.

### 4.5 Phase 1 병렬 개발용 Mock Data 명세 (Mock Contract)

```typescript
// src/api/memos.mock.ts
import type { UserMemoItem } from '@/types/memo';

export const MOCK_USER_MEMOS: UserMemoItem[] = [
  {
    id: 'memo-uuid-001',
    userId: 1,
    issueId: 101,
    content: '### 배포 전 체크리스트\n- [x] Redis 캐시 클러스터 웜업\n- [ ] DB 인덱스 마이그레이션 점검\n- [ ] 웹소켓 커넥션 풀 확인',
    color: 'yellow',
    isPinned: true,
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-21T02:30:00.000Z'
  },
  {
    id: 'memo-uuid-002',
    userId: 1,
    issueId: 105,
    content: '**디자인팀 피드백 반영 사항**\n> 모달 바깥 클릭 시 애니메이션 끊김 현상 개선 필요.',
    color: 'pink',
    isPinned: false,
    createdAt: '2026-09-21T03:00:00.000Z',
    updatedAt: '2026-09-21T04:15:00.000Z'
  },
  {
    id: 'memo-uuid-003',
    userId: 1,
    issueId: null,
    content: '# 개인 아이디어 메모\n- 향후 AI 기반 자동 이슈 요약 기능 추가 검토\n- Electron 데스크톱 단축키(Alt+M) 지원 계획',
    color: 'green',
    isPinned: false,
    createdAt: '2026-09-21T05:20:00.000Z',
    updatedAt: '2026-09-21T05:20:00.000Z'
  }
];
```

---

## 5. QA 및 통합 테스트 시나리오 (QA & Scenario Test Cases)

### 5.1 정상 시나리오 (Positive Test Cases)
| TC ID | 테스트 명칭 | 사전 조건 | 조작 단계 | 기대 결과 (UI 및 데이터) |
| :---: | :--- | :--- | :--- | :--- |
| `TC-POS-01` | 단독 메모 생성 및 자동 저장 | 로그인 완료, 메모 페이지(`/memo`) 진입 | 1. '새 메모 작성' 버튼 클릭<br>2. 마크다운 텍스트 입력 후 대기 | 별도 저장 버튼 없이 600ms 후 자동 저장, 카드 그리드에 포스트잇 형태로 즉시 반영 |
| `TC-POS-02` | 이슈 연동 메모 등록 및 칸반보드 붉은 삼각형 표시 | 칸반보드에 이슈 #101 존재 | 1. 이슈 상세에서 '내 메모 작성' 클릭<br>2. 메모 입력 후 닫기<br>3. 칸반보드로 이동 | 이슈 #101 카드 좌측 상단 모서리에 붉은색 삼각형 인디케이터가 표시됨 |
| `TC-POS-03` | 마우스 호버 시 메모 내용 최우선 노출 | 이슈 카드에 붉은색 삼각형 표시 상태 | 1. 해당 이슈 카드 위로 마우스 커서 호버 | 툴팁/팝오버로 마크다운 파싱된 메모 내용이 다른 메타데이터보다 최우선으로 선명하게 노출됨 |
| `TC-POS-04` | 스프린트 뷰 내 이슈 메모 인디케이터 및 호버 연동 | 스프린트 내 할당된 이슈에 메모 존재 | 1. 스프린트 상세 페이지 진입<br>2. 이슈 목록 확인 및 호버 | 스프린트 이슈 요소 좌측 상단에 붉은 삼각형 표시 및 마우스 호버 시 메모 팝오버 확인 |
| `TC-POS-05` | WBS 트리 및 간트 뷰 내 이슈 메모 인디케이터 연동 | WBS 프로젝트에 할당된 이슈에 메모 존재 | 1. WBS 페이지 진입<br>2. 좌측 트리 행 및 우측 간트 바 확인<br>3. 해당 항목 위에 마우스 호버 | WBS 트리 행 좌측 상단 및 간트 바 좌측 상단에 붉은 삼각형 뱃지 표시, 마우스 호버 시 메모 팝오버 최우선 노출 |
| `TC-POS-06` | 인플레이스 확대 뷰 및 바깥 클릭 자동 닫힘 | 메모 페이지에 카드 존재 | 1. 임의의 메모 카드 클릭<br>2. 화면 중앙에 확대된 에디터에서 내용 수정<br>3. 에디터 외부(바깥) 영역 클릭 | 화면 중앙에 가로/세로 스크롤이 지원되는 대형 에디터가 열리며, 바깥 클릭 시 내용이 자동 저장되고 부드럽게 닫힘 |
| `TC-POS-07` | 브라우저 새로고침 시 영속성 유지 | 메모 3건 작성 완료 상태 | 1. 브라우저 F5 새로고침 수행 | `safeStorage`에 의해 로컬스토리지에 저장된 메모 3건이 유실 없이 그대로 복원됨 |

### 5.2 예외 및 차단 시나리오 (Negative Test Cases)
| TC ID | 테스트 명칭 | 입력 및 상황 | 기대 에러 응답 | UI 처리 (Toast / 경고) |
| :---: | :--- | :--- | :---: | :--- |
| `TC-NEG-01` | 타 사용자 메모 조회 차단 (계정 전환) | User A로 메모 작성 후 로그아웃, User B로 로그인 | 데이터 조회 격리 | User A가 작성한 메모는 일체 조회되지 않으며, 칸반/스프린트/WBS의 붉은 삼각형도 User B의 메모 유무에 따라서만 표시됨 |
| `TC-NEG-02` | 연계 이슈 삭제 시 메모 보존 | 이슈 #101에 연계된 메모가 있는 상태에서 이슈 #101 삭제 | `SetNull` 격리 | 연계 이슈가 삭제되어도 메모는 삭제되지 않고 단독 메모(`issueId = null`)로 안전하게 유지됨 |
| `TC-NEG-03` | 로컬스토리지 용량 초과 또는 직렬화 에러 | 브라우저 Quota 초과 또는 손상된 JSON 문자열 | `STORAGE_ERROR` | `safeStorage` 예외 처리를 통해 애플리케이션 충돌을 방지하고 "저장 공간 부족" 경고 토스트 안내 |

### 5.3 데이터 정합성 및 회귀 검증 (Data Integrity Points)
- **컴포넌트 리렌더링 최적화**: 마우스 호버 시 칸반 전체 보드나 WBS 간트 타임라인 전체가 리렌더링되지 않도록 `MemoIndicator` 독립 상태 관리 적용.
- **다중 탭 동기화**: 브라우저 `storage` 이벤트를 감지하여 동일 브라우저의 다른 탭에서 메모를 수정/삭제했을 때 실시간으로 상태 동기화.

---

## 6. 개발 파이프라인 산출물 체크리스트 (Deliverables Checklist)

[GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md)에 정의된 **Concurrent & API-Viewer Bridge Pipeline**에 따른 필수 산출물입니다.

### 🚩 Phase 1: 병렬 동시 착수 (Parallel Initiation)
- [ ] **Backend (`backend-developer`)** *(향후 DB 전환 대비)*:
  - [ ] Prisma 스키마 반영: `prisma/schema.workspace.prisma` 내 `model UserMemo`
  - [ ] API 스펙 산출물 문서 작성: `docs/api/memo/createMemo.md`, `docs/api/memo/getMemos.md`
  - [ ] DTO 및 3-Tier 모듈 작성: `src/modules/memo/*` (Routes, Controllers, Sub-Services)
  - [ ] 단위 테스트 작성 및 통과: `src/tests/memo.*.test.ts` (`npm test` 100% Pass)
- [ ] **Frontend (`frontend-developer`)** *(현재 즉시 착수)*:
  - [ ] 컴포넌트 사양서 문서 작성: `docs/components/Memo_COMPONENTS.md`
  - [ ] 도메인 타입 정의: `src/types/memo.ts`
  - [ ] 로컬 스토어 구현: `src/stores/useMemoStore.ts` (`safeStorage` 기반 네임스페이스 및 디바운스 자동저장)
  - [ ] UI 모듈러 서브 컴포넌트 구현: `src/components/memos/*` (Max 400줄 준수 + `index.ts`)
    - `MemoIndicator.tsx` (칸반/스프린트/WBS 연동용 붉은 삼각형 뱃지)
    - `MemoCard.tsx` (프로젝트 카드 스타일의 포스트잇 카드)
    - `MemoEditorModal.tsx` (중앙 확대 에디터, 스크롤 지원, 바깥 클릭 닫기)
    - `MemoFilterBar.tsx` (필터 및 검색 툴바)
    - `MemoGrid.tsx` (반응형 레이아웃)
  - [ ] 페이지 및 라우트 연동: `src/pages/MemosPage.tsx`, `Sidebar.tsx` 내 '메모' 탭 추가
  - [ ] 기존 컴포넌트 침투 연동:
    - `KanbanCard.tsx`에 `MemoIndicator` 탑재
    - `SprintIssuesTab.tsx` / `SprintCard.tsx`에 `MemoIndicator` 탑재
    - `WBSTreeRow.tsx` 및 `WBSGanttBar.tsx`에 `MemoIndicator` 탑재

### 🚩 Phase 2: API 완성 및 브릿지 전달 (API Bridge)
- [ ] **Bridge Hub (`api-viewer`)**:
  - [ ] `api_inspector.py` 실행을 통한 `docs/api/memo/` 및 백엔드 실제 구현 소스 스캔
  - [ ] `frontend-developer`에게 실제 API DTO 및 엔드포인트 변경사항 인계
  - [ ] `qa-tester`에게 에러 코드 및 유효성 검증 규칙 인계

### 🚩 Phase 3: 실제 연동 및 풀스택 QA (Integration & QA)
- [ ] **Frontend 연동 & 품질 검증**:
  - [ ] 실제 API Call 바인딩: `src/api/memo.ts` (TanStack Query 훅 연결 및 백그라운드 동기화)
  - [ ] 아키텍처 정적 분석 통과: `python .agents/skills/react-component-reviewer/scripts/component_reviewer.py` (0 errors)
  - [ ] 프로덕션 빌드 성공: `npm run build`
- [ ] **QA 테스터 (`qa-tester`)**:
  - [ ] 시나리오 테스트 문서 작성: `docs/qa/scenarios/memo.md` (Positive & Negative TC)
  - [ ] 풀스택 회귀 검증 통과: `python .agents/skills/scenario-qa-runner/scripts/qa_runner.py --run-all`
- [ ] **마스터 문서 동기화**:
  - [ ] 백엔드 API 색인: `docs/api/README.md`
  - [ ] 프론트엔드 컴포넌트 색인: `docs/FRONTEND_SPECIFICATION.md`
  - [ ] QA 시나리오 색인: `docs/qa/README.md`
