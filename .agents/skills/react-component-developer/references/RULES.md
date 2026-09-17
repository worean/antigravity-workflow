# 📐 Frontend State, Modal & Storage Conventions

AntiGravity Workflow 프론트엔드(`workflow_react/`) 구현 규칙 명세서입니다.

---

## 1. 기술 스택 & 상태 분류 매핑

| 구분 | 기술 스택 | 파일 경로 / 표준 함수 | 사용 규칙 |
| :--- | :--- | :--- | :--- |
| **Server State** | TanStack Query v5 | `src/api/{domain}.ts` (`useQuery`, `useMutation`) | DB/API 데이터 전담. Zustand/Context 중복 저장 금지. |
| **Global Client State** | Zustand 5.x | `src/stores/use{Domain}Store.ts` | UI 전역 상태(사이드바, 모달, 뷰모드, 드래프트). `(s) => s.x` 셀렉터 필수. |
| **Session Context** | React Context | `src/context/` (`useContext`) | 변경이 드문 정적 인증/테넌트(`AuthContext`, `WorkspaceContext`). |
| **Local State** | React Hook | 컴포넌트 내부 (`useState`) | 특정 컴포넌트 내부에 국한된 인풋/포커스/탭 상태. |

---

## 2. 모달/팝업 제어 2대 규칙 (Modal Hoisting 금지)

모든 모달은 반드시 `ModalWrapper`(`src/components/common/ModalWrapper.tsx`)를 최상위 셸로 사용합니다 (Portal, ESC 키, 바디 스크롤 락, A11y 내장).

```text
[모달 분류 기준]
 ├── 🌐 전역 모달 (헤더, 사이드바, 단축키, API 에러 등 전역 호출)
 │    ├── 1) src/stores/useUIStore.ts 에 isXOpen, openX(), closeX() 정의
 │    ├── 2) src/components/GlobalModalManager.tsx 에 모달 마운트
 │    └── 3) 호출처에서 useUIStore.getState().openX() 또는 useUIStore(s => s.openX)() 단 1줄 호출 (Props 전달 0건)
 └── 📄 페이지 모달 (특정 화면/도메인에 국한된 모달)
      ├── 1) App.tsx로 끌어올리지 않음 (Hoisting 금지)
      └── 2) 해당 Page/컴포넌트 내부에 useState 선언 및 Colocation 렌더링
```

- **Ghost State 금지**: `const [, setModalOpen] = useState(false)` 언팩 묵살 패턴 금지.

---

## 3. Zustand 스토어 작성 규칙

- **파일 위치**: `src/stores/use{Domain}Store.ts`
- **구독 최적화 (필수)**: 
  - ❌ 전체 비구조화 금지: `const { a, b } = useStore();`
  - ✅ 단일 값/액션: `const a = useStore((s) => s.a);`
  - ✅ 다중 값: `useShallow` 활용 (`import { useShallow } from 'zustand/react/shallow'`)
- **영속화(persist)**:
  - 네임스페이스 `name: 'ag_{domain}'` 지정.
  - `partialize` 옵션을 사용하여 모달 열림 등 일시적 UI 상태는 영속화 대상에서 제외.

```typescript
// 템플릿: src/stores/useFeatureStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FeatureState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useFeatureStore = create<FeatureState>()(
  persist(
    (set) => ({
      activeTab: 'all',
      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: 'ag_feature',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeTab: s.activeTab }),
    }
  )
);
```

---

## 4. LocalStorage 안전 사용 규칙

- **네임스페이스 강제**: 모든 스토리지 키는 `ag_` 접두사 필수 (`ag_ui_state`, `ag_draft_*`).
- **Raw `localStorage` 직접 호출 금지**:
  - React 스토어 상태: Zustand `persist` 미들웨어 사용.
  - 비-스토어 일반 접근: `safeStorage.getItem(key, fallback)` / `safeStorage.setItem(key, value)` (`src/utils/safeStorage.ts`) 사용.
- **보안**: 평문 비밀번호, OTP 등 민감 정보 저장 금지.
