# 📐 Frontend State, Modal & Storage Conventions

React 프론트엔드 상태 관리, 모달 및 스토리지 구현 규칙 명세서입니다.

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

- **네임스페이스 강제**: 모든 스토리지 키는 프로젝트 고유 접두사 필수 (예: `app_`, `ag_` 등 네임스페이스 격리).
- **Raw `localStorage` 직접 호출 금지**:
  - React 스토어 상태: Zustand `persist` 미들웨어 사용.
  - 비-스토어 일반 접근: `safeStorage.getItem(key, fallback)` / `safeStorage.setItem(key, value)` (`src/utils/safeStorage.ts`) 사용.
- **보안**: 평문 비밀번호, OTP 등 민감 정보 저장 금지.

---

## 5. CSS 디자인 토큰 및 테마(Dark/Light) 표준

모든 UI 컴포넌트는 다크/라이트 테마 변경에 즉각 반응할 수 있도록 하드코딩 색상 대신 `src/styles/theme.css`의 시맨틱 CSS 변수를 사용해야 합니다.

### 5.1 표준 시맨틱 CSS 변수 매핑표

| 범주 | 시맨틱 변수 | 다크 모드 기본값 | 라이트 모드 기본값 | 용도 및 가이드라인 |
| :--- | :--- | :--- | :--- | :--- |
| **배경 (Background)** | `--bg-app` (또는 `--bg-dark`) | `#1e1e1e` | `#f8fafc` | 앱 전체 캔버스 및 페이지 메인 배경 |
| | `--bg-sidebar` | `#252526` | `#f1f5f9` | 좌측 네비게이션 사이드바 배경 |
| | `--bg-header` | `#2d2d2d` | `#ffffff` | 최상단 타이틀바/헤더 배경 |
| | `--bg-card` | `#252526` | `#ffffff` | 카드, 패널, 모달 컨텐츠 기본 배경 |
| | `--bg-card-hover` | `#2a2d2e` | `#f1f5f9` | 리스트/아이템 마우스 호버 배경 |
| | `--bg-card-active` | `#37373d` | `#e2e8f0` | 선택/활성화된 메뉴 및 카드 배경 |
| | `--bg-input` | `#3c3c3c` | `#ffffff` | 폼 인풋, 셀렉트, 텍스트에어리어 배경 |
| | `--bg-subtle` | `#2d2d2d` | `#f8fafc` | 테이블 헤더, 부가 컨테이너 서브 배경 |
| **테두리 (Border)** | `--border-light` | `#3c3c3c` | `#e2e8f0` | 카드, 구분선, 인풋 기본 테두리 |
| | `--border-subtle` | `#2d2d2d` | `#edf2f7` | 미세 경계선 및 트리 서브 아이템 선 |
| | `--border-focus` | `#007acc` | `#007acc` | 인풋 및 버튼 포커스 아웃라인 |
| **텍스트 (Text)** | `--text-bright` | `#ffffff` | `#0f172a` | 제목(h1~h6), 활성 텍스트, 카드 타이틀 |
| | `--text-main` | `#cccccc` | `#334155` | 일반 본문 텍스트, 설명문, 라벨 |
| | `--text-sub` | `#969696` | `#64748b` | 보조 정보, 타임스탬프, 부가 설명 |
| | `--text-muted` | `#6e6e6e` | `#94a3b8` | 플레이스홀더, 비활성 텍스트, 아이콘 |
| **강조 (Accent)** | `--primary` | `#007acc` | `#007acc` | 주 액션 버튼, 브랜드 강조 색상 |
| | `--primary-subtle` | `rgba(0,122,204,0.15)` | `rgba(0,122,204,0.12)` | 선택된 칩, 배너 연한 강조 배경 |
| **그림자 (Shadow)** | `--shadow-sm`, `--shadow-md`, `--shadow-lg` | 다크 섀도우 | 은은한 소프트 섀도우 | 팝오버, 드롭다운, 모달 그림자 |

### 5.2 코딩 금지 및 권장 패턴

```tsx
// ❌ 금지 패턴: 하드코딩된 색상 직접 사용 (테마 전환 시 깨짐)
<div style={{ background: '#252526', color: '#ffffff', border: '1px solid #3c3c3c' }}>

// ✅ 권장 패턴: 시맨틱 CSS 변수 참조
<div style={{ background: 'var(--bg-card)', color: 'var(--text-bright)', border: '1px solid var(--border-light)' }}>
```

### 5.3 테마 상태 연동
- 테마 상태는 `usePrefStore((s) => s.theme)` 및 `setTheme((s) => s.setTheme)`로 조회/변경합니다.
- 최상위 `html`/`document.documentElement`의 `data-theme="dark" | "light"` 속성에 따라 토큰이 자동 전환됩니다.
- 신규 테마를 확장하거나 색상을 변경할 때는 반드시 `src/styles/theme.css` 내의 토큰을 업데이트합니다.

### 5.4 CSS Modules (`*.module.css`) 작성 규칙 및 테마 오염 방지
- **문제점**: `*.module.css` 내부에 고정 색상값(hex, rgb 등)을 작성하면 CSS 모듈의 해시 클래스 스코핑 및 명시도로 인해 전역 테마 토큰(`[data-theme="light"]`) 오버라이드가 무력화되어 색상이 고정되는 결함이 발생합니다.
- **구조와 색상의 분리**:
  - `*.module.css`는 컴포넌트의 레이아웃, 여백(padding/margin), Flex/Grid 정렬, 크기(width/height), 위치(position) 등 **구조와 배치(Layout & Structure)**만 전담합니다.
  - 색상(background-color, color, border-color, box-shadow 등)은 절대로 고정값을 적지 말고 반드시 전역 시맨틱 토큰(`var(--bg-card)`, `var(--text-main)`, `var(--border-light)` 등)을 참조하도록 작성합니다.
- **예시**:
```css
/* ❌ 금지: *.module.css 내 고정 색상 하드코딩 (테마 전환 무력화) */
.cardContainer {
  display: flex;
  background-color: #252526; /* 금지! */
  color: #ffffff;            /* 금지! */
  border: 1px solid #3c3c3c; /* 금지! */
}

/* ✅ 권장: 구조 배치 및 시맨틱 CSS 변수 바인딩 */
.cardContainer {
  display: flex;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-card);
  color: var(--text-main);
  border: 1px solid var(--border-light);
```

### 5.5 태그 인라인 스타일(`style={{ ... }}`) 및 Tailwind 색상 직접 하드코딩 금지
- **문제점**: JSX 태그에 직접 `style={{ background: '#2d2d2d', color: '#fff' }}` 또는 Tailwind 임의 값 `bg-[#2d2d2d]`를 작성하면, 라이트 모드 전환 시 CSS 변수의 동적 오버라이드가 무시되어 해당 요소가 어두운 상태로 고정되는 심각한 시각적 버그가 발생합니다.
- **인라인 스타일 및 Tailwind 색상 제한 원칙**:
  - JSX 태그 내 `style={{ ... }}` 속성에 실제 색상 코드(hex `#1e1e1e`, `#252526`, `#2d2d2d`, rgb/rgba 고정값) 직접 작성을 전면 금지합니다.
  - Tailwind CSS 임의 값 색상 클래스(`bg-[#...]`, `text-[#...]`, `border-[#...]` 등) 사용을 금지합니다.
  - 색상이 필요한 모든 인라인 스타일 및 클래스는 반드시 `var(--bg-card)`, `var(--bg-main)`, `var(--bg-subtle)`, `var(--border-light)`, `var(--text-main)`, `var(--text-muted)` 등 CSS 시맨틱 변수를 참조해야 합니다.
- **예시**:
```tsx
// ❌ 금지: 태그에 직접 색상 코드 하드코딩
<div style={{ background: '#252526', color: '#ffffff', border: '1px solid #3c3c3c' }}>
<div className="bg-[#252526] text-[#ffffff] border-[#3c3c3c]">

// ✅ 권장: CSS 시맨틱 변수 바인딩
<div style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}>
<div className="glass-panel" style={{ color: 'var(--text-main)' }}>
```


