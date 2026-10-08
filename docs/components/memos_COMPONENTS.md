# 🎨 Shared Memos Component Specification (`src/components/memos/`)

> **문서 상태**: Approved  
> **대상 도메인**: `memos`  
> **상위 기능 사양**: [08_SHARED_MEMO_SPECIFICATION.md](file:///C:/Users/admin/antigravity-workflow/docs/features/08_SHARED_MEMO_SPECIFICATION.md)  
> **표준 지침 준수**: [GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md) (400줄 제한, Sub-Components, Theme Tokens, Modal Portal)

---

## 1. 컴포넌트 아키텍처 및 분할 구조

```text
src/components/memos/
├── index.ts               # Barrel Export
├── MemoCard.tsx           # 개별 메모 카드 컴포넌트 (공개/비공개 뱃지, 첨부파일 개수)
├── MemoDetailModal.tsx    # 전역 팝업 모달 (@멘션 및 카드 클릭 시 열람, Portal 렌더링)
├── MemoEditorModal.tsx    # 메모 작성/수정 모달 (마크다운 에디터 + 5MB 파일 첨부)
├── MemoFilterBar.tsx      # 검색창 및 필터 탭 (전체/공개 메모/내 메모)
├── MemoGrid.tsx           # 반응형 카드 그리드 뷰 및 빈 상태 안내
└── MemoMentionLink.tsx    # @메모제목 정규식 파서 및 하이퍼링크 렌더러
```

---

## 2. 서브 컴포넌트별 상세 사양

### 2.1 `MemoCard.tsx`
- **역할**: 개별 메모 카드 컴포넌트.
- **주요 기능**:
  - 공개 여부 뱃지 (`isPublic` -> 녹색 "공개" / 노란색 "비공개")
  - 첨부파일 개수 뱃지 (첨부파일 존재 시 클립 아이콘 + 카운트)
  - 제목 및 마크다운 본문 3줄 말줄임 미리보기
  - 작성자 이름 및 작성일자 표시
  - 작성자 본인인 경우 수정/삭제 버튼 노출
  - 카드 클릭 시 `onClick` 콜백 호출 (상세 팝업 오픈)

### 2.2 `MemoDetailModal.tsx`
- **역할**: `@메모제목` 멘션 링크 클릭 및 카드 클릭 시 메모 내용을 어디서든 팝업으로 열람하는 전역 모달.
- **주요 기능**:
  - `createPortal`을 사용하여 DOM 최상위(`#ag-portal-root`) 마운트.
  - `target`이 숫자 ID인 경우 `useMemo(id)`, 문자열 제목인 경우 `useMemoByTitle(title)` 훅 자동 바인딩.
  - 마크다운 본문 렌더링 및 본문 내 재귀적 `@` 멘션 링크 지원.
  - 첨부파일 목록 표시 및 다운로드 링크 제공.
  - `role="dialog"`, `aria-modal="true"`, ESC 키 닫기 및 배경 클릭 닫기, 스크롤 락 지원.

### 2.3 `MemoEditorModal.tsx`
- **역할**: 새 메모 등록 및 기존 메모 수정 팝업 모달.
- **주요 기능**:
  - 제목 필수 입력 유효성 검사.
  - 공개 범위 라디오/버튼 토글 (비공개: 본인 전용 / 공개: 워크스페이스 전체 공유).
  - 마크다운 에디터 지원.
  - **첨부파일 업로드 및 5MB 용량 제한 검증**:
    - 파일 선택 시 `file.size > 5 * 1024 * 1024` (5,242,880 bytes) 즉시 차단.
    - 초과 시 경고 메시지 노출 및 토스트 알림.
  - 저장 시 TanStack Query 캐시 자동 무효화.

### 2.4 `MemoFilterBar.tsx`
- **역할**: 메모 목록 필터링 및 조작 상단 바.
- **주요 기능**:
  - 검색 인풋 (제목 및 본문 실시간 검색)
  - 필터 탭 (전체 / 공개 메모 / 내 메모)
  - 총 개수 카운트 표시
  - `+ 새 메모 작성` 액션 버튼

### 2.5 `MemoGrid.tsx`
- **역할**: 메모 카드 목록을 반응형 그리드로 배치.
- **주요 기능**:
  - 로딩 스켈레톤 애니메이션 처리.
  - 등록된 메모가 없을 시 친절한 빈 상태 안내 및 첫 작성 유도 버튼 제공.

### 2.6 `MemoMentionLink.tsx`
- **역할**: 시스템 어디서든 `@메모제목` 텍스트를 감지하여 클릭 가능한 하이퍼링크 뱃지로 변환.
- **주요 기능**:
  - 클릭 시 `useUIStore.getState().openMemoDetail(title)` 호출.
  - `renderTextWithMemoMentions` 유틸리티 함수 제공.

---

## 3. 코드 품질 및 테마 표준 준수
- **400줄 제한**: 모든 서브 컴포넌트가 400줄 이하로 분할 구현됨.
- **테마 시맨틱 변수**: 하드코딩 색상 배제, `var(--bg-card)`, `var(--text-main)`, `var(--border-light)`, `var(--primary)` 등 100% 바인딩.
- **모달/오버레이 표준**: `createPortal` 및 `GlobalModalManager`를 통한 집중 관리, Ghost State 원천 배제.
