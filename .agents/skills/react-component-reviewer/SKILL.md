---
name: react-component-reviewer
description: React 컴포넌트의 모듈화 아키텍처(Sub-components 구조), 파일 크기 제한(400줄), 모달/오버레이 Colocation 및 Ghost State([, setX] 언팩) 누락 여부를 정적 분석하고 검증하는 전담 스킬입니다.
---

# 🛡️ React Component Reviewer Skill (`react-component-reviewer`)

React 컴포넌트 개발 및 수정 시 **컴포넌트 모듈화 아키텍처**, **하위 컴포넌트(Sub-components) 분할 표준**, **모달/오버레이 유실 방지(Colocation)** 및 **안전한 상태 관리 규칙**을 자동으로 검증하는 품질 보증(QA) 스킬입니다.

---

## 🎯 핵심 검증 규칙 (Core Verification Standards)

1. **대규모 단일 컴포넌트 금지 (Max 400 Lines)**:
   - 컴포넌트가 400줄을 초과하여 비대해지지 않도록, 반드시 `src/components/{domain}/` 하위의 전담 서브 컴포넌트(Sub-components)로 역할을 분할해야 합니다.
2. **Ghost State (언팩 린트 묵살) 절대 금지**:
   - `const [, setModalOpen] = useState(false)` 처럼 상태 변수를 생략(Unpack Ignore)하는 패턴은 화면에 렌더링되지 않는 결함의 원인이므로 엄격히 차단합니다.
3. **모달 및 오버레이 마운트 누락 방지 (Colocation)**:
   - 모달 상태(`showXModal`, `isOpen`)를 선언했다면 해당 JSX 내부에서 반드시 모달 컴포넌트가 마운트(`showXModal && <XModal />` 또는 `isOpen={showXModal}`)되어 있는지 확인합니다.
4. **도메인 컴포넌트 디렉토리 및 Barrel Export (`index.ts`)**:
   - 도메인 하위 컴포넌트들은 `src/components/{domain}/index.ts`를 통해 깔끔하게 re-export 되어야 합니다.

---

## 🚀 사용법 및 실행 명령 (Usage)

### 1. 단일 컴포넌트 파일 검사
```bash
python .agents/skills/react-component-reviewer/scripts/component_reviewer.py workflow_react/src/pages/SettingsPage.tsx
```

### 2. 프론트엔드 전체 컴포넌트 일괄 검사
```bash
python .agents/skills/react-component-reviewer/scripts/component_reviewer.py workflow_react/src
```

### 3. 검사 결과 해석
- **`[PASS]`**: 모든 컴포넌트가 모듈화 및 안전 코딩 표준을 준수함 (0 errors).
- **`[ERROR]`**: Ghost State 등 치명적 결함 발견 ➔ 반드시 수정 후 재검증.
- **`[WARNING]`**: 400줄 초과 또는 잠재적 모달 누락 ➔ 서브 컴포넌트 분할 검토.
