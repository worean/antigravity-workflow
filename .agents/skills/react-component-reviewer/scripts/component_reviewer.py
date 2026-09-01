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
            # JSX 본문에서 해당 모달 변수가 조건부 렌더링이나 prop으로 사용되는지 확인
            # 예: showModal && <SomeModal ...> or isOpen={showModal}
            usage_pattern = re.compile(rf'({modal_var}\s*&&|<[A-Za-z0-9_]+Modal[^>]*isOpen=\{{\s*{modal_var}\s*\}})')
            if not usage_pattern.search(content):
                issues.append({
                    'type': 'WARNING',
                    'line': idx,
                    'msg': f"모달 상태 `{modal_var}`가 선언되었으나 JSX 본문에서 조건부 마운트(`{modal_var} && <Modal />`) 또는 `isOpen={{{modal_var}}}` 패턴이 탐지되지 않았습니다. 모달 렌더링 누락 여부를 확인하세요."
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
            if file.endswith(('.tsx', '.jsx')):
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
    target = sys.argv[1] if len(sys.argv) > 1 else 'workflow_react/src'
    
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

    print(f"\n📊 검사 완료: 총 {total_files}개 컴포넌트 파일 검사됨 (오류: {total_errors}개, 경고: {total_warnings}개)\n")

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
        print("⚠️ 경고 사항을 검토하여 필요한 경우 컴포넌트를 서브 모듈로 리팩토링하세요.")
        sys.exit(0)

if __name__ == '__main__':
    main()
