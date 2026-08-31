// -*- coding: utf-8 -*-
# 🏛️ WorkspaceContext 기반 UI/편집 상태 관리 및 영속성 아키텍처

> **문서 버전**: v1.1.0  
> **최종 갱신**: 2026-08-31  
> **상태**: Standard Architecture Specification

---

## 1. 아키텍처 개요 (Overview)

AntiGravity Workflow 프론트엔드(`workflow_react`)는 사용자가 일감(Issue)을 작성/수정하거나, 화면을 탐색하고, 레이아웃을 조절할 때 **예기치 않은 새로고침(F5), 실수로 인한 모달 닫힘, 워크스페이스 전환 시에도 사용자의 작업 맥락(Context)이 유실되지 않도록 보존**하는 상태 분리 아키텍처를 채택합니다.

- **`WorkspaceContext`**: 워크스페이스 세션별 일감 작성/수정 초안(`IssueDraft`), 사이드바 메뉴 상태, 선택된 프로젝트/채널, 라우팅 이력 등 **워크스페이스 종속 상태 및 테넌트 격리 스토리지 전담 관리**.
- **`PrefRepository`**: 테마, 주 시작 요일, 알림, 기본 우선순위, 인증 토큰 등 **순수 앱 전역 환경설정(App Preferences) 전담 관리**.

```mermaid
flowchart TD
    subgraph UI_Layer ["🎨 UI / Component Layer"]
        IssueModal["IssueModal (작성/수정 모달)"]
        Sidebar["Sidebar (메뉴 아코디언)"]
        ChatPage["ChatPage (채팅방 선택/메시지)"]
        AppRouting["App / Routing (이전 Route, Tab)"]
    end

    subgraph Workspace_Layer ["🏢 Workspace Context & Tenant Storage (WorkspaceContext)"]
        WS_State["WorkspaceContext State"]
        Draft_State["issueDrafts: Record<string, IssueDraft>"]
        UI_State["sidebarSubmenus, prevRoute, selectedChannelId, selectedProjectId"]
        WS_Storage[("LocalStorage (ws_${workspaceId}_drafts, etc.)")]
        
        WS_State --- Draft_State
        WS_State --- UI_State
        WS_State <--> WS_Storage
    end

    subgraph App_Pref_Layer ["⚙️ App Preferences (PrefRepository)"]
        PrefRepo["PrefRepository (Single Source of Truth)"]
        PrefStorage[("LocalStorage (pref_is_sunday_start, auth_token, etc.)")]
        
        PrefRepo <--> PrefStorage
    end

    UI_Layer <-->|useWorkspace() 실시간 읽기/쓰기| Workspace_Layer
    UI_Layer <-->|prefRepo 앱 환경설정 읽기/쓰기| App_Pref_Layer
```

---

## 2. 역할 분리 원칙 (Separation of Concerns)

1. **워크스페이스 & UI 세션 상태 (`WorkspaceContext`)**:
   - 컴포넌트 트리 전역에서 워크스페이스별 상태 공유 및 React 반응형 리렌더링 담당.
   - 워크스페이스가 전환(`switchWorkspace`)될 때 해당 테넌트 격리 상태로 자동 스위칭.
   - 일감 작성/수정 임시 저장본(`IssueDraft`)의 테넌트별 안전 I/O 보장.

2. **앱 전역 환경설정 (`PrefRepository`)**:
   - 워크스페이스와 무관한 공통 사용자 옵션(시작 요일, 알림, 기본 우선순위 등) 및 인증 세션(Token, User) 관리.

---

## 3. 관리 대상 상태 항목 (Managed State Domains)

### 3.1 📝 편집 중인 작업 내용 (Issue Drafts)
- **위치**: `WorkspaceContext.tsx`
- **대상**: 신규 일감 등록 폼(`new`), 기존 일감 수정 폼(`edit_{issueId}`)
- **보존 항목**: 제목(`title`), 설명(`description`), 프로젝트 ID, 상태, 우선순위, 담당자, 시작/마감일, 태그, 커스텀 필드
- **라이프사이클**:
  - `입력 발생`: 디바운스/실시간으로 `saveIssueDraft(key, draft)` 호출
  - `모달 재오픈`: 저장된 초안이 존재하면 "작성 중이던 임시 저장본 복원" 안내 배너 노출
  - `등록/수정 완료`: `clearIssueDraft(key)` 호출로 초안 자동 소멸

### 3.2 🧭 내비게이션 & 라우팅 이력 (Navigation & Route History)
- **위치**: `WorkspaceContext.tsx`
- **보존 항목**:
  - `prevRoute`: 이전 라우트 및 히스토리 스택 (뒤로가기 지원)
  - `selectedProjectId`: 직전 선택한 프로젝트 ID
  - `selectedChannelId`: 마지막 열람한 채팅 채널 ID

### 3.3 📐 화면 UI 레이아웃 상태 (UI & Layout Preferences)
- **위치**: `WorkspaceContext.tsx`
- **보존 항목**:
  - `sidebarSubmenus`: 사이드바 아코디언 메뉴 펼침/접힘 상태 (`{ projects: true, issues: false, ... }`)

---

## 4. 인터페이스 명세 (Interface Specifications)

```typescript
// 1. 이슈 드래프트 데이터 모델 (WorkspaceContext)
export interface IssueDraft {
  title: string;
  description: string;
  projectId?: number;
  statusId?: number;
  priorityId?: number;
  assigneeId?: number | null;
  dueDate?: string | null;
  startDate?: string | null;
  plannedStartDate?: string | null;
  tags?: string[];
  customFields?: Record<string, any>;
  updatedAt: number; // 저장 타임스탬프 (ms)
}

// 2. WorkspaceContext 인터페이스
export interface WorkspaceContextType {
  // 🏢 워크스페이스 관리
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoadingWorkspaces: boolean;
  switchWorkspace: (workspaceId: number) => void;
  createWorkspace: (data: { name: string; slug?: string; description?: string; icon?: string }) => Promise<Workspace>;
  inviteMember: (data: { email?: string; userId?: number; role?: string }) => Promise<WorkspaceMember>;
  refetchWorkspaces: () => void;

  // 📝 일감 작성/수정 초안(Draft) 관리 (실수 방어)
  issueDrafts: Record<string, IssueDraft>;
  getIssueDraft: (key: string | number) => IssueDraft | null;
  saveIssueDraft: (key: string | number, draft: Partial<IssueDraft>) => void;
  clearIssueDraft: (key: string | number) => void;
  hasIssueDraft: (key: string | number) => boolean;

  // 📐 화면 UI 레이아웃 및 메뉴 상태
  sidebarSubmenus: Record<string, boolean>;
  setSidebarSubmenus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // 🧭 라우팅 및 세션 이력
  prevRoute: string | null;
  setPrevRoute: (route: string | null) => void;
  selectedProjectId: number | null;
  setSelectedProjectId: (projectId: number | null) => void;
  selectedChannelId: number | null;
  setSelectedChannelId: (channelId: number | null) => void;
}
```
