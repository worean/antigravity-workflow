# 🪟 AntiGravity Global Modals & Layout Specification (레이아웃 및 전역 모달 사양서)

본 문서는 앱 셸 레이아웃([`Header.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/Header.tsx), [`Sidebar.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/Sidebar.tsx)) 및 전역 팝업 모달 컴포넌트 12종의 설계 사양을 정의합니다.

---

## 1. 컴포넌트 목록 및 역할 요약

| 컴포넌트 | 소스 파일 | 주요 역할 및 기능 |
| :--- | :--- | :--- |
| **`Header`** | [`Header.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/Header.tsx) | 상단 글로벌 바 (워크스페이스 전환 드롭다운, 검색창, 알림 벨, 사용자 프로필 메뉴) |
| **`Sidebar`** | [`Sidebar.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/Sidebar.tsx) | 좌측 메인 내비게이션 바 (대시보드, 일감, 프로젝트, 스프린트, WBS, 작업로그, 채팅, 설정) |
| **`ProfileCard`** | [`ProfileCard.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/ProfileCard.tsx) | 사용자 아바타 클릭 시 노출되는 프로필 정보 및 로그아웃 팝오버 카드 |
| **`AuthModal`** | [`AuthModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/AuthModal.tsx) | 이메일 로그인 및 회원가입 인증 모달 |
| **`ActionFeedbackModal`** | [`ActionFeedbackModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/ActionFeedbackModal.tsx) | 비동기 작업 성공/실패 결과 피드백 토스트 다이얼로그 (`useActionFeedback`) |
| **`AvatarCropModal`** | [`AvatarCropModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/AvatarCropModal.tsx) | 프로필 이미지 업로드 시 HTML5 Canvas 기반 정사각형/원형 크롭 모달 |
| **`ConfirmModal`** | [`ConfirmModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/ConfirmModal.tsx) | 삭제, 초기화 등 위험 작업 시 사용자 확인을 받는 공통 컨펌 모달 |
| **`CustomFieldsModal`** | [`CustomFieldsModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/CustomFieldsModal.tsx) | 커스텀 필드(문자열, 숫자, 날짜, 셀렉트) 정의 생성/수정 다이얼로그 |
| **`GroupModal`** | [`GroupModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/GroupModal.tsx) | 조직도 부서/팀 생성 및 상위 부서 지정 다이얼로그 |
| **`IssueModal`** | [`IssueModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/IssueModal.tsx) | 신규 이슈 생성 및 단독 팝업 수정 모달 (Markdown, 태그, 일정, 커스텀필드 지원) |
| **`ProjectModal`** | [`ProjectModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/ProjectModal.tsx) | 신규 프로젝트 생성 및 프로젝트 정보 수정 모달 |
| **`SprintModal`** | [`SprintModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/SprintModal.tsx) | 스프린트 생성 및 일정/목표 설정 모달 |
| **`WorkspaceCreateModal`** | [`WorkspaceCreateModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/workspace/WorkspaceCreateModal.tsx) | 신규 테넌트 워크스페이스 생성 모달 |
| **`WorkspaceInviteModal`** | [`WorkspaceInviteModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/workspace/WorkspaceInviteModal.tsx) | 워크스페이스 초대 링크 발급 및 이메일 초대 모달 |

---

## 2. 모달 설계 및 Colocation 원칙 준수 가이드

1. **상태 관리 및 마운트 보장**:
   - 모든 모달은 부모 컴포넌트의 `isOpen={showModal}` 또는 `{showModal && <Modal />}` 형태로 JSX 트리에 확실하게 마운트되어야 합니다.
2. **닫기 및 ESC 키보드 이벤트**:
   - `ModalWrapper`를 기반으로 ESC 키 및 딤드 백드롭 클릭 시 안전하게 `onClose()`가 호출됩니다.
3. **폼 초기화 및 임시 저장**:
   - 대형 폼 모달(`IssueModal`, `ProjectModal`)은 작성 중 이탈 방지를 위해 `draftStorage` 유틸리티와 연동되어 작성 내용을 자동 보존합니다.
