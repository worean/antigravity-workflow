# 🤖 AI Chatbot Popup Components Specification (`chatbot_COMPONENTS.md`)

본 문서는 AntiGravity Workflow 시스템에서 AI 모델 연동, 자연어 질의응답 및 시스템 제어(Function Calling)를 지원하는 **플로팅 AI 챗봇 팝업 컴포넌트군**의 설계 명세서입니다.

---

## 🏗️ 1. 컴포넌트 계층도 (Component Hierarchy)

```text
GlobalModalManager (or App Level)
 └── ChatbotPopup (Portal 기반, #ag-portal-root 최상위 플로팅 윈도우)
      ├── ChatbotHeader (모델 셀렉트, 최소화, 초기화, 닫기)
      ├── ChatbotMessageList (메시지 히스토리 스크롤 영역)
      │    ├── ChatbotWelcomeBanner (추천 프롬프트 칩 포함)
      │    └── ChatbotMessageItem (마크다운 버블)
      │         └── ChatbotActionCard (이슈/프로젝트 생성 등 인터랙티브 액션 제안 카드)
      └── ChatbotInputArea (멀티라인 입력, 전송 버튼, 로딩 인디케이터)

Sidebar / Header / Floating Launcher
 └── ChatbotLauncher (우측 하단 원형 플로팅 트리거 버튼)
```

---

## 🧠 2. 상태 관리 아키텍처 (Zustand: `useChatbotStore`)

- **파일 위치**: `src/stores/useChatbotStore.ts`
- **영속화**: `persist` 미들웨어 적용 (`name: 'ag_chatbot_state'`), 대화 히스토리 및 선택 모델 저장.

| 상태 (State) | 타입 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean` | `false` | 챗봇 팝업 오픈 여부 |
| `isMinimized` | `boolean` | `false` | 최소화(작은 바) 모드 여부 |
| `selectedModel` | `ChatbotModel` | `'gemini-1.5-flash'` | 현재 활성화된 AI 모델 |
| `messages` | `ChatbotMessage[]` | `[]` | 대화 메시지 및 액션 히스토리 |
| `isThinking` | `boolean` | `false` | AI 모델 응답 대기/생성 중 여부 |

| 액션 메서드 (Actions) | 파라미터 | 설명 |
| :--- | :--- | :--- |
| `openChatbot` | `()` | 챗봇 팝업 열기 |
| `closeChatbot` | `()` | 챗봇 팝업 닫기 |
| `toggleChatbot` | `()` | 챗봇 팝업 토글 (단축키/런처 연동) |
| `toggleMinimize` | `()` | 최소화 모드 토글 |
| `setModel` | `(model: ChatbotModel)` | AI 모델 변경 |
| `sendMessage` | `(prompt: string)` | 메시지 전송 및 AI 응답/액션 처리 |
| `executeAction` | `(actionId: string)` | 제안된 기능(이슈 생성 등) 실제 실행 |
| `clearMessages` | `()` | 대화 히스토리 초기화 |

---

## 🚪 3. Portal Popup 및 인터랙션 규격

1. **Stacking Context 격리**:
   - `ChatbotPopup`은 `<Portal containerId="ag-portal-root">`를 통해 렌더링되어 우측 하단 고정 플로팅(`position: fixed; bottom: 24px; right: 24px; z-index: var(--z-popup, 1100)`).
2. **단축키 연동**:
   - `Alt + J` 또는 `Ctrl + J`: 챗봇 열기/닫기 토글.
   - `Escape`: 최소화 또는 닫기.
3. **접근성(A11y)**:
   - `role="dialog"`, `aria-label="AI 어시스턴트"` 적용.
