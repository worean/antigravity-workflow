# 📌 AntiGravity Frontend Specification (프론트엔드 종합 컴포넌트 설계 사양서)

## 1. 개요 (System Overview)
AntiGravity Workflow 프론트엔드는 **React 18 + TypeScript + Vite + TanStack Query v5** 기반의 이슈 및 일감 관리(Issue & Task Management) 풀스택 웹 애플리케이션의 클라이언트 SPA 시스템입니다.
본 사양서는 시스템을 구성하는 **111개의 모든 React 컴포넌트**에 대한 역할, I/O 데이터 규격(Props & State), 백엔드 REST API 연동 및 서브 컴포넌트 모듈화 아키텍처를 정의합니다.

> **📖 연관 아키텍처 문서**:
> - **프론트엔드 전체 아키텍처**: [`docs/FRONTEND_ARCHITECTURE.md`](file:///C:/Users/admin/antigravity-workflow/docs/FRONTEND_ARCHITECTURE.md)
> - **디자인 시스템 & 토큰**: [`docs/FRONTEND_DESIGN_SYSTEM.md`](file:///C:/Users/admin/antigravity-workflow/docs/FRONTEND_DESIGN_SYSTEM.md)
> - **백엔드 REST API 명세**: [`docs/api/README.md`](file:///C:/Users/admin/antigravity-workflow/docs/api/README.md)

---

## 2. 도메인별 세부 컴포넌트 설계 사양서 인덱스

각 도메인별 세부 서브 컴포넌트, Props 인터페이스, 백엔드 API 매핑 및 이벤트 플로우는 아래 개별 전담 사양서를 참조합니다:

| 도메인 | 전담 사양서 링크 | 주요 컴포넌트 및 서브 모듈 |
| :--- | :--- | :--- |
| **공통 UI (16종)** | [`01_COMMON_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/01_COMMON_COMPONENTS.md) | `Avatar`, `Button`, `Card`, `FavoriteButton`, `Indicator`, `IssueTypeBadge`, `MarkdownEditor`, `MarkdownViewer`, `ModalWrapper`, `PriorityBadge`, `ProjectBadge`, `Skeleton`, `StatusBadge`, `TagBadge`, `TagInput`, `UserBadge` |
| **대시보드 (4종)** | [`02_DASHBOARD_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/02_DASHBOARD_COMPONENTS.md) | `DashboardPage`, `DashboardSummaryToolbar`, `DashboardStatCards`, `DashboardIssueLists`, `DashboardFocusSprints` |
| **이슈 & 칸반 보드 (4종)** | [`03_KANBAN_ISSUES_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/03_KANBAN_ISSUES_COMPONENTS.md) | `IssuesPage`, `KanbanFilterBar`, `KanbanBoard`, `KanbanColumn`, `KanbanCard` |
| **이슈 상세 & 드로어 (7종)** | [`04_ISSUE_DETAIL_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/04_ISSUE_DETAIL_COMPONENTS.md) | `IssueDetailPage`, `IssueDetailDrawer`, `IssueDetailHeader`, `IssueDetailMainCard`, `IssueDetailEditForm`, `IssueComments`, `IssueWorklogs`, `IssueDetailView` |
| **프로젝트 관리 (9종)** | [`05_PROJECTS_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/05_PROJECTS_COMPONENTS.md) | `ProjectsPage`, `ProjectsGrid`, `ProjectCard`, `ProjectDetailPage`, `ProjectDetailHeader`, `ProjectInfoCard`, `ProjectSidebar`, `ProjectParticipationSection`, `ProjectMembersTab`, `ProjectGroupsTab` |
| **스프린트 관리 (14종)** | [`06_SPRINTS_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/06_SPRINTS_COMPONENTS.md) | `SprintsPage`, `SprintStarredHud`, `SprintToolbar`, `SprintGrid`, `SprintCard`, `SprintFormModal`, `SprintDetailModal`, `SprintManageIssuesModal`, `SprintDetailPage`, `SprintDetailBanner`, `SprintIssuesTab`, `SprintDiscussionsTab`, `SprintWorklogsTab`, `SprintNotesTab` |
| **WBS & 간트 차트 (7종)** | [`07_WBS_GANTT_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/07_WBS_GANTT_COMPONENTS.md) | `WBSPage`, `WBSToolbar`, `WBSMainSplitView`, `WBSTreeTable`, `WBSTreeRow`, `WBSGanttHeader`, `WBSGanttTimeline`, `WBSGanttBar` |
| **작업로그 공수 관리 (4종)** | [`08_WORKLOGS_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/08_WORKLOGS_COMPONENTS.md) | `WorklogsPage`, `WorklogsHeaderToolbar`, `WorklogCreateForm`, `WorklogsList`, `WorklogListItem` |
| **실시간 채팅 (9종)** | [`09_CHAT_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/09_CHAT_COMPONENTS.md) | `ChatPage`, `ChatCategoryNav`, `ChatChannelSidebar`, `ChatMainArea`, `ChatHeader`, `ChatMessageList`, `ChatMessageItem`, `ChatInputArea`, `ChatMemberSidebar`, `ChatCreateModal` |
| **환경설정 (8종)** | [`10_SETTINGS_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/10_SETTINGS_COMPONENTS.md) | `SettingsPage`, `SettingsHeaderToolbar`, `SettingsSidebarNav`, `SettingsProfileTab`, `SettingsWorkspaceTab`, `SettingsOrgTab`, `SettingsDisplayTab`, `SettingsSystemTab`, `SettingsCustomFieldsTab` |
| **전역 모달 & 레이아웃 (12종)** | [`11_GLOBAL_MODALS_LAYOUT.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/11_GLOBAL_MODALS_LAYOUT.md) | `Header`, `Sidebar`, `ProfileCard`, `AuthModal`, `ActionFeedbackModal`, `AvatarCropModal`, `ConfirmModal`, `CustomFieldsModal`, `GroupModal`, `IssueModal`, `ProjectModal`, `SprintModal`, `WorkspaceCreateModal`, `WorkspaceInviteModal` |

---

## 3. 핵심 컴포넌트 아키텍처 및 구현 표준

### 3.1 서브 컴포넌트 모듈화 (Sub-Component Modular Architecture, Max 400줄)
- 단일 컴포넌트가 **400줄을 초과하지 않도록** 책임 단위로 세분화합니다.
- 복잡한 화면은 `src/pages/*.tsx`가 순수 오케스트레이터(Pure Orchestrator) 역할을 수행하고, 하위 렌더링은 `src/components/{domain}/`의 서브 컴포넌트들이 전담합니다.
- 각 도메인 디렉토리는 `index.ts`를 통해 깔끔한 Barrel Export를 제공합니다.

### 3.2 Modal Colocation 및 Ghost State 금지
- 특정 서브 탭이나 서브 뷰에서만 사용되는 모달은 해당 서브 컴포넌트 내부에 직접 배치(Colocation)하거나 부모의 JSX 트리에 명시적으로 마운트(`isOpen={showModal}` 또는 `{showModal && <Modal />}`)합니다.
- `const [, setOpen] = useState(false)` 처럼 상태 변수를 버리는 패턴(Ghost State)을 절대 금지합니다.

### 3.3 Server State (TanStack Query v5) 및 부드러운 전환 정책
- **깜빡임 없는 전환**: `placeholderData: (previousData) => previousData`를 기본 적용하여 탭 전환이나 필터링 시 로딩 스피너로 인한 화면 번쩍거림을 제거합니다.
- **In-place 캐시 갱신 (Smooth Optimistic Updates)**: Mutation 성공 시 불필요한 전체 Refetch 대신 `queryClient.setQueriesData`를 통해 메모리 상의 캐시 데이터를 즉시 동기화합니다.
- **Draft Persistence**: `draftStorage.ts`를 통해 작성 중인 폼 데이터(이슈/프로젝트 생성 및 편집)를 600ms 디바운스로 로컬 영속화하여 이탈 시 복원을 지원합니다.

---

## 4. `react-component-reviewer` 품질 검증 보고서 요약

전체 111개 컴포넌트에 대한 정적 품질 분석 스크립트 실행 결과:

- **검사 대상**: 총 111개 컴포넌트 파일 (`pages/`, `components/`, `context/`)
- **오류 (Error)**: **0개 (Pass)** (Ghost State 및 치명적 렌더링 결함 없음)
- **경고 (Warning)**: 19개
  - 대형 컴포넌트 서브 모듈 분할 권고: `IssueModal.tsx` (1565줄), `SettingsWorkspaceTab.tsx` (746줄), `IssueDetailDrawer.tsx` (698줄) 등 향후 지속적 리팩토링 타깃.
  - 모달 Props 위임 패턴: `ProjectDetailPage.tsx`, `SprintsPage.tsx`의 하위 탭 컴포넌트 모달 위임 구조 정상 확인.
