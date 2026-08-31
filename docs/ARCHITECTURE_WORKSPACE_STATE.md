# 🏛️ WorkspaceContext 기반 UI/편집 상태 관리 및 영속성 아키텍처

> **문서 버전**: v1.0.0  
> **작성 일자**: 2026-08-31  
> **상태**: Standard Architecture Specification

---

## 1. 아키텍처 개요 (Overview)

AntiGravity Workflow 프론트엔드(`workflow_react`)는 사용자가 일감(Issue)을 작성/수정하거나, 화면을 탐색하고, 레이아웃을 조절할 때 **예기치 않은 새로고침(F5), 실수로 인한 모달 닫힘, 워크스페이스 전환 시에도 사용자의 작업 맥락(Context)이 유실되지 않도록 보존**하는 2계층 하이브리드 상태 아키텍처를 채택합니다.

```mermaid
flowchart TD
    subgraph UI_Layer ["🎨 UI / Component Layer"]
        IssueModal["IssueModal (작성/수정 모달)"]
        Sidebar["Sidebar (메뉴 아코디언)"]
        Navigation["App / Routing (이전 Route, Tab)"]
        WBS["WBS / Gantt (줌/분할 폭)"]
    end

    subgraph Memory_Layer ["⚡ Reactive Memory Layer (WorkspaceContext)"]
        WS_State["WorkspaceContext State"]
        Draft_State["issueDrafts: Record<string, IssueDraft>"]
        UI_State["sidebarSubmenus, prevRoute, activeFilters"]
        
        WS_State --- Draft_State
        WS_State --- UI_State
    end

    subgraph Storage_Layer ["💾 Persistence Layer (PrefRepository)"]
        PrefRepo["PrefRepository (Single Source of Truth)"]
        LocalStorage[("Browser LocalStorage")]
        
        PrefRepo <--> LocalStorage
    end

    UI_Layer <-->|useWorkspace() 실시간 읽기/쓰기| Memory_Layer
    Memory_Layer <-->|워크스페이스별 자동 동기화| Storage_Layer
```

---

## 2. 2계층 상태 분리 원칙 (Two-Tier State Separation)

1. **Reactive Memory Layer (`WorkspaceContext`)**:
   - 컴포넌트 트리 전역에서 실시간 상태 공유 및 React 반응형 리렌더링 담당.
   - 워크스페이스가 전환(`switchWorkspace`)될 때 해당 테넌트 격리 상태로 자동 스위칭.

2. **Persistence Storage Layer (`PrefRepository`)**:
   - 앱 종료, 브라우저 재시작, 새로고침 시에도 데이터가 보존되도록 LocalStorage I/O 및 JSON 직렬화/역직렬화 캡슐화.
   - 워크스페이스 ID를 prefix/key로 분리하여 **워크스페이스 간 임시 데이터 오염 원천 차단**.

---

## 3. 관리 대상 상태 항목 (Managed State Domains)

### 3.1 📝 편집 중인 작업 내용 (Issue Drafts)
- **대상**: 신규 일감 등록 폼(`new`), 기존 일감 수정 폼(`edit_{issueId}`)
- **보존 항목**: 제목(`title`), 설명(`description`), 프로젝트 ID, 상태, 우선순위, 담당자, 시작/마감일, 태그, 커스텀 필드
- **라이프사이클**:
  - `입력 발생`: 디바운스/실시간으로 `saveIssueDraft(key, draft)` 호출
  - `모달 재오픈`: 저장된 초안이 존재하면 "작성 중이던 임시 저장본 복원" 안내 배너 노출
  - `등록/수정 완료`: `clearIssueDraft(key)` 호출로 초안 자동 소멸

### 3.2 🧭 내비게이션 & 라우팅 이력 (Navigation & Route History)
- **보존 항목**:
  - `activeTab`: 현재 활성화된 탭 (`dashboard`, `issues`, `wbs`, `chat` 등)
  - `prevRoute`: 이전 라우트 및 히스토리 스택 (뒤로가기 지원)
  - `selectedProjectId`: 직전 선택한 프로젝트 ID
  - `selectedChannelId`: 마지막 열람한 채팅 채널 ID

### 3.3 📐 화면 UI 레이아웃 상태 (UI & Layout Preferences)
- **보존 항목**:
  - `sidebarSubmenus`: 사이드바 아코디언 메뉴 펼침/접힘 상태 (`{ projects: true, issues: false, ... }`)
  - `wbsDayWidth`: WBS 간트차트 확대/축소 줌 레벨
  - `wbsTableWidth`: WBS 좌측 테이블 분할 영역 폭
  - `issuesFilters`: 마지막 적용한 담당자/상태 필터 조건

---

## 4. 인터페이스 명세 (Interface Specifications)

```typescript
// 1. 이슈 드래프트 데이터 모델
export interface IssueDraft {
  title: string;
  description: string;
  projectId?: number;
  statusId?: number;
  priorityId?: number;
  assigneeId?: number | null;
  dueDate?: string | null;
  startDate?: string | null;
  tags?: string[];
  customFields?: Record<string, any>;
  updatedAt: number; // 저장 타임스탬프 (ms)
}

// 2. WorkspaceContext 확장 인터페이스
export interface WorkspaceContextType {
  // 워크스페이스 기본
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  switchWorkspace: (workspaceId: number) => void;

  // 📝 일감 드래프트 관리 API
  issueDrafts: Record<string, IssueDraft>;
  getIssueDraft: (key: string | number) => IssueDraft | null;
  saveIssueDraft: (key: string | number, draft: Partial<IssueDraft>) => void;
  clearIssueDraft: (key: string | number) => void;
  hasIssueDraft: (key: string | number) => boolean;

  // 📐 UI 레이아웃 및 메뉴 상태
  sidebarSubmenus: Record<string, boolean>;
  setSidebarSubmenus: (submenus: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  
  // 🧭 라우팅 및 네비게이션
  prevRoute: string | null;
  setPrevRoute: (route: string | null) => void;
}
```

---

## 5. 보안 및 멀티 테넌트 격리 보장

- 모든 드래프트 및 UI 상태는 내부적으로 **`ws_{workspaceId}_draft_...`** 형식으로 네임스페이스 격리 저장됩니다.
- User A가 Workspace Alpha에서 작성하던 초안은 Workspace Beta로 전환 시 노출되지 않으며, 다른 사용자의 브라우저 세션과도 철저히 분리됩니다.

---

## 6. 관련 소스 코드 링크
- 설정/영속화 레포지토리: [`src/lib/prefRepository.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/lib/prefRepository.ts)
- 워크스페이스 컨텍스트: [`src/context/WorkspaceContext.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/context/WorkspaceContext.tsx)
- 일감 작성 모달: [`src/components/IssueModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/IssueModal.tsx)
- 사이드바 내비게이션: [`src/components/Sidebar.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/Sidebar.tsx)
