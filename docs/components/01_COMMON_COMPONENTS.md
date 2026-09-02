# 🧩 AntiGravity Common Components Specification (공통 UI 컴포넌트 설계 사양서)

본 문서는 [`workflow_react/src/components/common/`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common) 디렉토리에 위치한 16종의 공통 UI 컴포넌트에 대한 상세 기능 명세, Props 인터페이스, 시각 디자인 및 사용 가이드를 정의합니다.

---

## 1. 컴포넌트 목록 및 역할 요약

| 컴포넌트 | 소스 파일 | 주요 역할 및 기능 |
| :--- | :--- | :--- |
| **`Avatar`** | [`Avatar.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/Avatar.tsx) | 사용자 프로필 이미지 또는 이름 이니셜 + 배경색 원형/사각 아바타 렌더링 |
| **`Button`** | [`Button.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/Button.tsx) | 다크 모던 테마 기반 표준 버튼 (Primary, Secondary, Danger, Ghost, Outline) |
| **`Card`** | [`Card.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/Card.tsx) | 통일된 패딩, 테두리, 글래스모피즘 배경을 제공하는 범용 카드 컨테이너 |
| **`FavoriteButton`** | [`FavoriteButton.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/FavoriteButton.tsx) | 프로젝트/이슈/스프린트/채널 즐겨찾기(별 아이콘) 토글 버튼 및 낙관적 갱신 |
| **`Indicator`** | [`Indicator.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/Indicator.tsx) | 접속 상태(온라인, 오프라인, 부재중) 및 알림 표시 도트 인디케이터 |
| **`IssueTypeBadge`** | [`IssueTypeBadge.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/IssueTypeBadge.tsx) | 이슈 유형(BUG, FEATURE, TASK, STORY, EPIC) 아이콘 및 컬러 뱃지 |
| **`MarkdownEditor`** | [`MarkdownEditor.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/MarkdownEditor.tsx) | 툴바, 단축키 및 실시간 미리보기를 지원하는 Markdown 텍스트 에디터 |
| **`MarkdownViewer`** | [`MarkdownViewer.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/MarkdownViewer.tsx) | Markdown 문법을 안전하고 미려한 HTML로 파싱 렌더링하는 전용 뷰어 |
| **`ModalWrapper`** | [`ModalWrapper.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/ModalWrapper.tsx) | 딤드 오버레이, ESC 키 닫기, 바깥 클릭 닫기 및 일관된 헤더/푸터를 제공하는 모달 래퍼 |
| **`PriorityBadge`** | [`PriorityBadge.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/PriorityBadge.tsx) | 우선순위(URGENT, HIGH, MEDIUM, LOW, LOWEST) 색상 및 화살표 뱃지 |
| **`ProjectBadge`** | [`ProjectBadge.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/ProjectBadge.tsx) | 소속 프로젝트의 Key 및 이름을 나타내는 미니 뱃지 |
| **`Skeleton`** | [`Skeleton.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/Skeleton.tsx) | 데이터 로딩 중 레이아웃 깜빡임을 방지하는 애니메이션 스켈레톤 UI |
| **`StatusBadge`** | [`StatusBadge.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/StatusBadge.tsx) | 이슈 상태(TODO, IN_PROGRESS, IN_REVIEW, DONE) 카테고리 컬러 뱃지 |
| **`TagBadge`** | [`TagBadge.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/TagBadge.tsx) | 해시태그(`#태그명`) 칩, 클릭 필터링 및 삭제 버튼 지원 |
| **`TagInput`** | [`TagInput.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/TagInput.tsx) | `#` 트리거 기반 자동완성 추천 및 Space/Enter 태그 등록 인풋 |
| **`UserBadge`** | [`UserBadge.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/common/UserBadge.tsx) | 사용자 아바타 + 이름 + 역할(Role) 일체형 뱃지 |

---

## 2. 세부 컴포넌트 사양 명세

### 2.1 `Avatar`
- **I/O Definition (Props)**:
  - `user?: User | { name?: string | null; email?: string | null; avatar?: string | null; avatarColor?: string | null }`: 사용자 객체
  - `name?: string`: 표시할 이름 (미지정 시 `user.name` 또는 `email` 기반 자동 산출)
  - `size?: number`: 아바타 직경 (px 단위, 기본값 `28`)
  - `shape?: 'circle' | 'square'`: 아바타 형태 (기본값 `'circle'`)
  - `showOnlineStatus?: boolean`: 온라인 도트 표시 여부
  - `isOnline?: boolean`: 온라인 상태
- **렌더링 동작**:
  - `avatar` 이미지 URL이 유효하면 `<img>` 태그를 렌더링하고 이미지 로드 실패 시 이니셜 폴백.
  - 이미지가 없으면 이름의 첫 글자(한국어 1글자, 영문 1~2글자)를 추출하여 `avatarColor` 배경색에 흰색 텍스트로 중앙 정렬.

### 2.2 `Button`
- **I/O Definition (Props)**:
  - `variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'`: 버튼 시각 테마 (기본값 `'secondary'`)
  - `size?: 'sm' | 'md' | 'lg' | 'icon'`: 버튼 크기 규격 (기본값 `'md'`)
  - `isLoading?: boolean`: 로딩 스피너 노출 및 클릭 비활성화
  - `leftIcon?: React.ReactNode`, `rightIcon?: React.ReactNode`: 좌/우측 아이콘 슬롯
  - `React.ButtonHTMLAttributes<HTMLButtonElement>` 상속
- **디자인 토큰**:
  - `primary`: `--primary-accent` (#007acc) 배경, 흰색 텍스트
  - `danger`: `--danger-color` (#f43f5e) 배경, 위험 작업용
  - `ghost`: 투명 배경, 마우스 호버 시 `--bg-subtle` 반투명 배경 강조

### 2.3 `Card`
- **I/O Definition (Props)**:
  - `title?: React.ReactNode`: 카드 상단 헤더 제목
  - `extra?: React.ReactNode`: 우측 상단 액션/버튼 영역
  - `footer?: React.ReactNode`: 카드 하단 푸터 영역
  - `variant?: 'solid' | 'glass' | 'outline'`: 배경 스타일 (기본값 `'solid'`)
  - `padding?: 'none' | 'sm' | 'md' | 'lg'`: 내부 여백
  - `onClick?: () => void`: 클릭 핸들러 (지정 시 마우스 커서 포인터 및 호버 하이라이트)

### 2.4 `FavoriteButton`
- **I/O Definition (Props)**:
  - `targetType: 'PROJECT' | 'ISSUE' | 'SPRINT' | 'CHAT_CHANNEL'`: 즐겨찾기 대상 도메인
  - `targetId: number`: 대상 엔티티 고유 ID
  - `isFavorite?: boolean`: 현재 즐겨찾기 등록 여부
  - `size?: number`: 별 아이콘 크기 (기본값 `16`)
  - `onToggle?: (nextState: boolean) => void`: 토글 콜백
- **API 연동**: `toggleFavorite(targetType, targetId)` 백엔드 호출 및 TanStack Query In-place 캐시 즉시 갱신.

### 2.5 `MarkdownEditor` & `MarkdownViewer`
- **`MarkdownEditor`**:
  - `value: string`, `onChange: (val: string) => void`
  - 툴바 지원 (굵게, 기울임, 헤더, 코드블록, 리스트, 링크, 체크박스)
  - 편집 모드: 'edit' (단일 편집기), 'preview' (미리보기만), 'split' (좌우 분할)
- **`MarkdownViewer`**:
  - `content: string`: 렌더링할 마크다운 문자열
  - XSS 방지를 위한 HTML Sanitization 적용 및 테마 일치 코드 하이라이팅

### 2.6 `ModalWrapper`
- **I/O Definition (Props)**:
  - `isOpen: boolean`: 모달 표시 상태
  - `onClose: () => void`: 닫기 핸들러
  - `title?: React.ReactNode`: 상단 모달 제목
  - `size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'`: 모달 가로폭 규격
  - `children: React.ReactNode`: 모달 본문 콘텐츠
  - `footer?: React.ReactNode`: 푸터 버튼 액션 영역
- **접근성 & 인터랙션**: ESC 키 입력 감지 시 `onClose` 자동 호출, 외부 영역(딤드 백드롭) 클릭 시 닫기 지원.

### 2.7 `TagBadge` & `TagInput`
- **`TagBadge`**:
  - `tag: Tag | { id?: number; name: string; color?: string }`: 태그 데이터
  - `onClick?: () => void`: 태그 클릭 시 검색/필터링 연동
  - `onRemove?: () => void`: 삭제 버튼('X') 핸들러
- **`TagInput`**:
  - `tags: Tag[]`: 현재 등록된 태그 배열
  - `onAddTag: (tagName: string) => void`: 태그 추가 핸들러
  - `onRemoveTag: (tagIdOrName: number | string) => void`: 태그 제거 핸들러
  - `availableTags?: Tag[]`: 자동완성 추천 태그 목록
  - `#` 입력 시 자동완성 드롭다운 팝업, Space/Enter 키 입력으로 칩 추가.
