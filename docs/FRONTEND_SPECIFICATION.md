// -*- coding: utf-8 -*-
# 📌 AntiGravity Frontend Specification (프론트엔드 설계 사양서)

## 1. 개요
AntiGravity Workflow 프론트엔드는 **React 18 + TypeScript + Vite + TanStack Query** 기반의 이슈 및 일감 관리(Issue & Task Management) SPA 시스템입니다.

---

## 2. 주요 페이지 및 기능 사양

### 2.1 대시보드 (`DashboardPage`)
- **통계 위젯**: 프로젝트 수, 전체 이슈 수, 진행/완료 현황, 담당 업무 요약 카드.
- **최근 이슈 & 내 작업 목록**: 본인에게 할당된 일감 및 최근 변경된 일감 리스트.
- **상태 차트 & 진척률 바**: 프로젝트별 진척률 시각화.

### 2.2 이슈 & 칸반 보드 (`IssuesPage`)
- **드래그 앤 드롭 (DnD)**: 상태 컬럼 간 이슈 카드 드래그 앤 드롭 이동 및 상태 변경.
- **다중 필터링**:
  - 프로젝트 필터 (`filterProjectId`)
  - 담당자 필터 (`filterAssigneeId`: ALL, MY, 개별 담당자)
  - 해시태그 필터 (`filterTag`: 전체 태그 드롭다운)
  - 통합 텍스트/해시태그 검색 (`searchTerm`: 제목, 설명, `#태그`)
- **실시간 상호작용**: 이슈 좋아요(Like), 즐겨찾기(Favorite), 인라인 상태 전환, 삭제 확인 모달.

### 2.3 이슈 상세 & 편집 (`IssueDetailDrawer` / `IssueDetailPage` / `IssueModal`)
- **3계층 디테일 뷰**: 제목, 상태/유형/우선순위 뱃지, 태그 목록, 작성자/담당자, 일정(시작일/기한/실제일), 진척도, 하위 이슈 트리, 댓글/대댓글 트리, 작업로그(Worklog).
- **인라인/모달 에디터**: Markdown 실시간 미리보기 에디터 지원.
- **임시 저장(Draft Persistence)**: 600ms 자동 저장, 이탈 후 재진입 시 자동 복원 배너 및 원본 되돌리기 지원.

### 2.4 해시태그(`#태그`) 시스템 (`TagBadge` / `TagInput`)
- **태그 파싱 & 칩 인풋**: `#태그명` 입력 후 Space/Enter 시 태그 칩 등록, 태그 자동완성 추천 드롭다운.
- **클릭 필터링**: 카드 및 상세 뷰의 `#태그` 뱃지 클릭 시 즉시 해당 태그로 목록 필터링.

### 2.5 프로젝트 관리 (`ProjectsPage` / `ProjectDetailPage`)
- **프로젝트 CRUD**: 프로젝트 키(Key), 이름, 설명, 태그, 상태, 우선순위, 일정.
- **멤버 및 조직 연동**: 프로젝트 멤버(Admin/Member/Viewer) 및 그룹(부서) 권한 매핑.

### 2.6 스프린트 & WBS (`SprintsPage` / `WBSPage`)
- **스프린트 백로그 & 번다운**: 스프린트 생성, 이슈 할당, 기간 설정, 진행률 트래킹.
- **WBS/Gantt 차트**: 계층형 하위 일감 구조 및 일정 타임라인 시각화, 일괄 일정 변경(Batch Schedule).

### 2.7 실시간 채팅 & 협업 (`ChatDrawer` / `ChatPage`)
- **채널/DM**: 프로젝트 및 공개/비공개 채팅방, 스레드, 이모지 반응(Reaction), 링크 프리뷰.

---

## 3. 데이터 통신 및 렌더링 최적화 정책
- **TanStack Query (React Query)**:
  - `placeholderData: (previousData) => previousData`를 통한 렌더링 깜빡임 제거.
  - `setQueriesData`를 활용한 In-place 메모리 즉시 갱신 (Optimistic-like Smooth Updates).
  - 불필요한 전체 리마운트(key 변경) 방지.
- **API 클라이언트**: Axios 인스턴스 (`apiClient`) 기반 JWT Bearer 인증 헤더 자동 주입.
