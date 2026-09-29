#!/usr/bin/env python3
import os
import re
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def review_component_file(file_path):
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            lines = f.readlines()
    except Exception as e:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except Exception as e2:
            return [{'type': 'ERROR', 'line': 0, 'msg': f"파일 열기 실패: {str(e2)}"}]

    total_lines = len(lines)
    content = "".join(lines)
    norm_path = file_path.replace('\\', '/')

    # 1. 파일 크기 검사 (대규모 단일 파일 방지, 400줄 초과 시 경고)
    if total_lines > 400 and not file_path.endswith('.d.ts'):
        issues.append({
            'type': 'WARNING',
            'line': total_lines,
            'msg': f"파일 라인 수가 {total_lines}줄로 400줄을 초과합니다. 서브 컴포넌트(Sub-components)로의 분할 및 모듈화가 강력히 권장됩니다."
        })

    # 2. Ghost State (언팩 린트 묵살 패턴) 검사: const [, setX] = useState(...)
    ghost_state_regex = re.compile(r'const\s*\[\s*,\s*set([A-Za-z0-9_]+)\s*\]\s*=\s*useState')
    for idx, line in enumerate(lines, start=1):
        match = ghost_state_regex.search(line)
        if match:
            state_name = match.group(1)
            issues.append({
                'type': 'ERROR',
                'line': idx,
                'msg': f"Ghost State 발견: `const [, set{state_name}] = useState` 패턴은 상태가 렌더링에 사용되지 않는 버그 유발 패턴입니다. 상태 변수를 정상 선언하거나 제거하세요."
            })

    # 3. Modal / Overlay 상태 선언 대비 JSX 렌더링 누락 검사
    modal_state_regex = re.compile(r'const\s*\[\s*(show[A-Za-z0-9_]*Modal|is[A-Za-z0-9_]*ModalOpen|[A-Za-z0-9_]*ModalOpen)\s*,\s*set[A-Za-z0-9_]+\s*\]\s*=\s*useState')
    for idx, line in enumerate(lines, start=1):
        match = modal_state_regex.search(line)
        if match:
            modal_var = match.group(1)
            usage_pattern = re.compile(rf'({modal_var}\s*&&|<[A-Za-z0-9_]+Modal[^>]*isOpen=\{{\s*{modal_var}\s*\}})')
            if not usage_pattern.search(content):
                issues.append({
                    'type': 'WARNING',
                    'line': idx,
                    'msg': f"모달 상태 `{modal_var}`가 선언되었으나 JSX 본문에서 조건부 마운트(`{modal_var} && <Modal />`) 또는 `isOpen={{{modal_var}}}` 패턴이 탐지되지 않았습니다. 모달 렌더링 누락 여부를 확인하세요."
                })

    # 4. 컴포넌트 레이어 내 Raw localStorage 직접 접근 검사
    # (안전한 유틸리티 `safeStorage`나 Zustand `persist` 스토어, 인프라 파일 제외)
    is_storage_exempt = any(exempt in norm_path for exempt in [
        'safeStorage.ts', 'prefRepository.ts', 'draftStorage.ts', '/stores/', '/context/AuthContext.tsx'
    ])
    if not is_storage_exempt:
        raw_storage_regex = re.compile(r'(localStorage\.(getItem|setItem|removeItem|clear)|window\.localStorage)')
        for idx, line in enumerate(lines, start=1):
            if raw_storage_regex.search(line) and not line.strip().startswith('//'):
                issues.append({
                    'type': 'WARNING',
                    'line': idx,
                    'msg': "컴포넌트 내 Raw `localStorage` 직접 접근 발견: 예외 안전성과 네임스페이스 격리를 위해 `safeStorage` 유틸리티 또는 Zustand `persist` 미들웨어 사용을 권장합니다."
                })

    # 5. 모달 컴포넌트(*Modal.tsx)의 Portal / ModalWrapper 적용 여부 검사
    if norm_path.endswith('Modal.tsx') and not norm_path.endswith('ModalWrapper.tsx'):
        has_portal_usage = any(kw in content for kw in ['ModalWrapper', 'Portal', 'createPortal'])
        if not has_portal_usage:
            issues.append({
                'type': 'WARNING',
                'line': 1,
                'msg': "모달 컴포넌트에서 `ModalWrapper` 또는 `Portal` 사용이 탐지되지 않았습니다. CSS Stacking Context 격리를 위해 Portal 기반 래퍼 사용을 권장합니다."
            })

    # 6. 테마 호환성 검사: JSX style 내 하드코딩 테마 컬러 및 Tailwind 임의 색상 클래스 검사
    if not norm_path.endswith(('.css', '.scss')) and '/styles/' not in norm_path:
        # 1) 태그 인라인 background / backgroundColor 내 고정 색상(#hex, rgb) 작성 전면 탐지
        bg_hardcode_regex = re.compile(
            r'(background|backgroundColor)\s*:\s*[\'"`](#([0-9a-fA-F]{3,8})|rgb\s*\([^)]+\))[\'"`]',
            re.IGNORECASE
        )
        # 2) 텍스트 및 테두리 색상 중 테마를 무력화하는 다크/화이트/그레이 고정 색상 탐지
        theme_fixed_palette = (
            r'#(1e1e1e|252526|2d2d2d|282828|2b2d31|18181b|313338|1e1f22|232428|2f3136|'
            r'383a40|282b30|1f2023|202022|202020|3c3c3c|383838|27272a|35373c|393c43|'
            r'333333|333|8e9297|b9bbbe|dcddde|72767d|cccccc|ccc|ffffff|fff|000000|000)'
        )
        color_border_regex = re.compile(
            rf'(color|borderColor|borderTop|borderBottom|borderLeft|borderRight)\s*:\s*[\'"`]({theme_fixed_palette})[\'"`]',
            re.IGNORECASE
        )
        # 3) Tailwind 임의 색상 클래스 탐지 (예: bg-[#2d2d2d], text-[#fff], border-[#333])
        tailwind_color_regex = re.compile(r'(?:bg|text|border)-\[#([0-9a-fA-F]{3,8})\]')

        for idx, line in enumerate(lines, start=1):
            if line.strip().startswith('//') or line.strip().startswith('/*'):
                continue
            
            # 인라인 스타일 색상 검사 (var() 참조 제외)
            if 'var(' not in line:
                bg_match = bg_hardcode_regex.search(line)
                if bg_match:
                    prop = bg_match.group(1)
                    val = bg_match.group(2)
                    issues.append({
                        'type': 'WARNING',
                        'line': idx,
                        'msg': f"태그 인라인 스타일에 하드코딩된 배경색 `{val}`({prop}) 사용 감지: 태그 내 직접 배경색 코딩은 라이트/다크 테마 전환을 무력화합니다. 반드시 `src/styles/theme.css`의 시맨틱 CSS 변수(`var(--bg-card)`, `var(--bg-main)`, `var(--bg-subtle)` 등)를 사용하세요."
                    })
                else:
                    cb_match = color_border_regex.search(line)
                    if cb_match:
                        prop = cb_match.group(1)
                        val = cb_match.group(2)
                        issues.append({
                            'type': 'WARNING',
                            'line': idx,
                            'msg': f"태그 인라인 스타일에 고정 테마 색상 `{val}`({prop}) 사용 감지: Light/Dark 테마 호환성을 위해 `src/styles/theme.css`의 시맨틱 CSS 변수(`var(--text-main)`, `var(--text-bright)`, `var(--border-light)` 등)를 사용하세요."
                        })

            # Tailwind 임의 색상 클래스 검사
            tw_match = tailwind_color_regex.search(line)
            if tw_match:
                tw_val = tw_match.group(1)
                issues.append({
                    'type': 'WARNING',
                    'line': idx,
                    'msg': f"Tailwind 임의 색상 클래스(`#{tw_val}`) 사용 감지: Light/Dark 테마 호환성을 위해 Tailwind 임의 색상 대신 시맨틱 CSS 변수나 전역 클래스를 사용해야 합니다."
                })

    # 7. CSS Modules (*.module.css) 테마 색상 분리 원칙 검사 (고정 색상 작성 금지)
    if norm_path.endswith('.module.css') or norm_path.endswith('.module.scss'):
        fixed_color_regex = re.compile(r'(color|background|background-color|border-color)\s*:\s*([^;]+);')
        color_val_pattern = re.compile(r'(#[0-9a-fA-F]{3,8}|rgb\s*\(|hsl\s*\()')
        for idx, line in enumerate(lines, start=1):
            if line.strip().startswith('/*') or line.strip().startswith('*') or line.strip().startswith('//'):
                continue
            match = fixed_color_regex.search(line)
            if match:
                prop = match.group(1).strip()
                val = match.group(2).strip()
                # var(--...) 참조가 아닌 고정 색상(hex, rgb 등)이 선언된 경우
                if color_val_pattern.search(val) and 'var(' not in val:
                    issues.append({
                        'type': 'ERROR',
                        'line': idx,
                        'msg': f"CSS 모듈(`*.module.css`) 내 고정 색상값(`{val}`) 선언 금지: CSS 모듈은 레이아웃/구조(flex, grid, margin 등)만 전담해야 하며, 색상은 전역 테마 토큰(`var(--bg-card)`, `var(--text-main)` 등)을 사용해야 합니다."
                    })

    return issues

def scan_directory(target_dir):
    all_results = {}
    total_files_checked = 0
    total_errors = 0
    total_warnings = 0

    for root, _, files in os.walk(target_dir):
        if 'node_modules' in root or 'dist' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith(('.tsx', '.jsx', '.ts', '.module.css', '.module.scss')):
                # 타입 정의나 설정 파일 제외
                if file.endswith(('.d.ts', 'vite.config.ts')):
                    continue
                full_path = os.path.join(root, file)
                total_files_checked += 1
                issues = review_component_file(full_path)
                if issues:
                    all_results[full_path] = issues
                    for issue in issues:
                        if issue['type'] == 'ERROR':
                            total_errors += 1
                        elif issue['type'] == 'WARNING':
                            total_warnings += 1

    return all_results, total_files_checked, total_errors, total_warnings

def main():
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        # 프론트엔드 소스 디렉토리 자동 감지
        target = 'workflow_react/src'
        for cand in ['workflow_react/src', 'client/src', 'frontend/src', 'src']:
            if os.path.exists(cand):
                target = cand
                break
    
    print(f"🔍 [React Component Reviewer] Scanning target: {target}")
    
    if os.path.isfile(target):
        issues = review_component_file(target)
        if not issues:
            print(f"✅ [PASS] {target}: 규칙 준수 (0 errors, 0 warnings)")
            sys.exit(0)
        else:
            print(f"\n📂 {target}")
            for issue in issues:
                icon = "❌" if issue['type'] == 'ERROR' else "⚠️"
                print(f"   {icon} Line {issue['line']}: [{issue['type']}] {issue['msg']}")
            sys.exit(1 if any(i['type'] == 'ERROR' for i in issues) else 0)

    results, total_files, total_errors, total_warnings = scan_directory(target)

    print(f"\n📊 검사 완료: 총 {total_files}개 컴포넌트/모듈 파일 검사됨 (오류: {total_errors}개, 경고: {total_warnings}개)\n")

    if not results:
        print("🎉 모든 React 컴포넌트가 모듈화 및 코딩 안전 규칙을 완벽히 준수하고 있습니다!")
        sys.exit(0)

    for file_path, issues in results.items():
        rel_path = os.path.relpath(file_path, os.getcwd())
        print(f"📂 {rel_path}")
        for issue in issues:
            icon = "❌" if issue['type'] == 'ERROR' else "⚠️"
            print(f"   {icon} Line {issue['line']}: [{issue['type']}] {issue['msg']}")
        print()

    if total_errors > 0:
        print(f"❌ 총 {total_errors}개의 심각한 규칙 위반(Ghost State 등)이 발견되었습니다. 수정한 후 다시 검증하세요.")
        sys.exit(1)
    else:
        print("⚠️ 경고 사항을 검토하여 필요한 경우 컴포넌트를 서브 모듈 및 Portal/safeStorage 표준으로 리팩토링하세요.")
        sys.exit(0)

if __name__ == '__main__':
    main()
