// -*- coding: utf-8 -*-
# 🎨 AntiGravity Frontend Design System & UI Guide (디자인 및 UI 가이드)

## 1. 디자인 철학 및 비주얼 테마
- **Dark Modern Tech**: VS Code / Linear 스타일의 딥 다크 테마 기반으로 시각적 피로도를 최소화하고 일감 및 코드 가독성을 극대화합니다.
- **Glassmorphism & Micro-Interactions**: 미세한 반투명 패널, 경계선 글로우, 호버 인터랙션을 적용합니다.
- **Smooth Transition**: 불필요한 번쩍임이나 빈 스피너를 지양하고, 부드러운 인플레이스 데이터 갱신과 페이드 전환을 지향합니다.

---

## 2. 디자인 토큰 & 색상 팔레트 (CSS Variables)

### 2.1 기본 테마 변수 (`index.css`)
| 변수명 | 값 / 설명 | 용도 |
| :--- | :--- | :--- |
| `--primary` | `#007acc` / `#3b82f6` | 주요 액션 버튼, 강조 링크, 선택 테두리 |
| `--primary-hover` | `#0098ff` / `#60a5fa` | 버튼 마우스 호버 시 강조 |
| `--bg-main` | `#1e1e1e` | 전체 페이지 메인 배경 |
| `--bg-card` | `#252526` | 카드, 모달, 패널 기본 배경 |
| `--bg-input` | `#1e1e1e` / `#2d2d2d` | 폼 인풋 및 셀렉트박스 배경 |
| `--border-light` | `#3c3c3c` / `#454545` | 컨테이너 및 카드 구분선 |
| `--text-bright` | `#ffffff` | 주요 제목 및 헤더 텍스트 |
| `--text-main` | `#cccccc` | 기본 본문 텍스트 |
| `--text-sub` | `#9cdcfe` | 코드 심볼, 서브 텍스트 |
| `--text-muted` | `#858585` | 힌트, 보조 설명, 비활성 라벨 |

### 2.2 상태 및 우선순위 색상 체계
- **상태 (Status)**:
  - `TODO` (대기): `#94a3b8` (Slate Grey)
  - `IN_PROGRESS` (진행중): `#38bdf8` (Cyan Blue)
  - `IN_REVIEW` (검토중): `#fbbf24` (Amber Gold)
  - `DONE` (완료): `#34d399` (Emerald Green)
- **우선순위 (Priority)**:
  - `CRITICAL` (긴급): `#ef4444` (Red)
  - `HIGH` (높음): `#f97316` (Orange)
  - `MEDIUM` (보통): `#3b82f6` (Blue)
  - `LOW` (낮음): `#10b981` (Green)
- **해시태그 (Tag)**:
  - 태그 문자열 해시 기반의 8색 팔레트 자동 배정 (`#3b82f6`, `#10b981`, `#f59e0b`, `#ec4899`, `#8b5cf6`, `#06b6d4`, `#14b8a6`, `#84cc16`).

---

## 3. 공통 컴포넌트 가이드라인

### 3.1 뱃지 컴포넌트 (`StatusBadge`, `PriorityBadge`, `TagBadge`)
- **형태**: 인라인 플렉스, 둥근 모서리(`border-radius: 3~4px`), 저채도 반투명 배경 + 고대비 텍스트.
- **TagBadge**: `#` 접두사 아이콘 + 클릭 시 필터링 인터랙션 제공.

### 3.2 입력 컴포넌트 (`TagInput`, `MarkdownEditor`)
- **TagInput**: 공백 및 엔터 키 입력 시 자동 칩 생성, 백스페이스 삭제, 자동완성 드롭다운 팝업.
- **MarkdownEditor**: 본문 작성 탭 / 실시간 Markdown 프리뷰 탭 지원.

### 3.3 레이아웃 & 패널 (`KanbanBoard`, `IssueDetailDrawer`, `ModalWrapper`)
- **모달 (Modal)**: 화면 중앙 오버레이, 외부 클릭 닫기 및 ESC 키 단축키 바인딩.
- **드로어 (Drawer)**: 우측 슬라이드 아웃 패널로 상세 정보 및 서브 태스크/댓글/작업로그 탭을 확장 렌더링.
- **칸반 보드 (Kanban)**: 가로 스크롤 가능한 컬럼 영역, 드래그 시 고스트 카드 및 컬럼 하이라이트 제공.
