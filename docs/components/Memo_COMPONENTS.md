# 📝 AntiGravity Personal Memo Components Specification (개인 메모 컴포넌트 설계 사양서)

본 문서는 [`workflow_react/src/components/memos/`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/memos) 및 [`workflow_react/src/pages/MemosPage.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/pages/MemosPage.tsx)에 위치한 개인 메모 도메인의 7종 컴포넌트에 대한 상세 기능 명세, Props 인터페이스, 시각 디자인 및 사용 가이드를 정의합니다.

---

## 1. 컴포넌트 목록 및 역할 요약

| 컴포넌트 | 소스 파일 | 주요 역할 및 기능 |
| :--- | :--- | :--- |
| **`MemoIndicator`** | [`MemoIndicator.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/memos/MemoIndicator.tsx) | 칸반/스프린트/WBS 카드 및 행 좌측 상단 붉은색 삼각형(clip-path) 뱃지 & 최상위 Portal 호버 마크다운 팝오버 |
| **`MemoCard`** | [`MemoCard.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/memos/MemoCard.tsx) | 프로젝트 카드 스타일의 포스트잇 메모 카드 (마크다운 렌더링, 세로 유연 확장, 중앙 확대 모달 트리거) |
| **`MemoEditorModal`** | [`MemoEditorModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/memos/MemoEditorModal.tsx) | 화면 중앙 확대 인플레이스 에디터 (가로/세로 스크롤 지원, 바깥 클릭 시 자동 저장 및 닫힘, ESC 닫기) |
| **`MemoFilterBar`** | [`MemoFilterBar.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/memos/MemoFilterBar.tsx) | 검색창, 이슈 연동 필터(전체/이슈연계/단독), 색상 필터(5색) 및 새 메모 작성 버튼 |
| **`MemoGrid`** | [`MemoGrid.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/memos/MemoGrid.tsx) | 반응형 카드 그리드 레이아웃 (고정 메모 상단 분리, Empty State 처리) |
| **`MemoQuickAdd`** | [`MemoQuickAdd.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/memos/MemoQuickAdd.tsx) | 이슈 상세 또는 인라인 영역에서 즉시 메모를 등록할 수 있는 간이 퀵 에디터 |
| **`MemosPage`** | [`MemosPage.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/pages/MemosPage.tsx) | 개인 메모 전용 순수 오케스트레이터 페이지 |

---

## 2. 세부 컴포넌트 사양 명세

### 2.1 `MemoIndicator`
- **I/O Definition (Props)**:
  - `issueId: number`: 연동된 이슈 ID
  - `size?: number`: 삼각형 뱃지 한 변의 크기 (기본값: `14px`)
- **렌더링 및 동작**:
  - `useMemoStore`에서 해당 `issueId`를 가진 메모가 없으면 `null` 반환.
  - 존재할 경우 부모(`position: relative`)의 좌측 상단 모서리에 CSS `clip-path: polygon(0 0, 100% 0, 0 100%)` 붉은색 삼각형 뱃지 렌더링.
  - 마우스 호버 시 부모의 `overflow: hidden` Stacking Context를 탈출하기 위해 React `Portal`을 활용하여 화면 최상단(`z-index: 99999`)에 마크다운 파싱 팝오버를 표시.
  - 클릭 또는 더블 클릭 시 `useMemoStore.setActiveMemoId(memo.id)`를 호출하여 확대 에디터를 오픈.

### 2.2 `MemoCard`
- **I/O Definition (Props)**:
  - `memo: UserMemoItem`: 표시할 메모 데이터
  - `onEdit: (memo: UserMemoItem) => void`: 편집 확대 모달 열기 핸들러
  - `onDelete: (memoId: string) => void`: 삭제 핸들러
  - `onTogglePin: (memo: UserMemoItem) => void`: 상단 고정 토글 핸들러
  - `onSelectIssue?: (issueId: number) => void`: 연계 이슈 클릭 시 이동 핸들러
- **디자인 토큰**:
  - 5가지 포스트잇 테마 컬러(`yellow`, `blue`, `green`, `pink`, `purple`)를 글래스모피즘 반투명 배경 및 테두리로 매핑.
  - 긴 텍스트의 경우 세로 방향으로 자연스럽게 늘어남 (`align-self: start`).

### 2.3 `MemoEditorModal`
- **I/O Definition (Props)**:
  - `isOpen: boolean`: 모달 노출 여부
  - `memoId: string | null`: 편집 대상 메모 식별자
  - `onClose: () => void`: 닫기 핸들러 (바깥 영역 클릭 시 자동 저장 후 호출)
- **핵심 정책**:
  - `ModalWrapper` 기반으로 구현되어 ESC 키 닫기, 스크롤 락, 백드롭 클릭 자동 저장 완비.
  - 600ms 디바운스 자동 저장이 적용되며 모달이 닫힐 때 즉시 flush 저장 수행.

### 2.4 `MemoFilterBar`
- **I/O Definition (Props)**:
  - `search: string`: 검색어
  - `issueFilter: MemoFilterType`: 이슈 연동 여부 필터 (`ALL` | `ISSUE_ONLY` | `STANDALONE`)
  - `selectedColor: MemoColor | 'ALL'`: 색상 필터
  - `onSearchChange`, `onIssueFilterChange`, `onColorChange`: 필터 변경 핸들러
  - `totalCount: number`, `filteredCount: number`: 카운트 표시
  - `onNewMemo: () => void`: 새 메모 작성 버튼 클릭

### 2.5 `MemoGrid`
- **I/O Definition (Props)**:
  - `memos: UserMemoItem[]`: 렌더링할 메모 배열
  - `onEdit`, `onDelete`, `onTogglePin`, `onSelectIssue`, `onNewMemo`: 자식 카드 위임 액션
- **레이아웃**:
  - `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px;`
  - 고정된 메모(`isPinned === true`)가 있을 경우 상단 섹션에 분리 노출.

### 2.6 `MemoQuickAdd`
- **I/O Definition (Props)**:
  - `issueId?: number | null`: 연계할 이슈 ID
  - `onSuccess?: (memo: UserMemoItem) => void`: 작성 완료 콜백
  - `onCancel?: () => void`: 취소 콜백
  - `placeholder?: string`: 안내 문구

### 2.7 `MemosPage`
- **역할**: 순수 오케스트레이터(Pure Orchestrator).
- **I/O Definition (Props)**:
  - `onOpenAuth?: () => void`: 미로그인 사용자 로그인 유도 모달
  - `onSelectIssue?: (issue: any) => void`: 연계 이슈 클릭 시 상세 조회
