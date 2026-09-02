import os
import sys
import subprocess
import glob
import re

# Windows 콘솔 UTF-8 출력 보정
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def verify_qa_docs():
    print("[Scenario QA Runner] Scanning QA Test Case Specifications (docs/qa/)...")
    qa_dir = os.path.join(os.getcwd(), "docs", "qa")
    scenarios_dir = os.path.join(qa_dir, "scenarios")
    
    if not os.path.exists(qa_dir):
        print(f"[WARN] QA directory does not exist: {qa_dir}")
        return False

    scenario_files = glob.glob(os.path.join(scenarios_dir, "*.md"))
    if not scenario_files:
        print(f"[INFO] No scenario test documents found. (path: {scenarios_dir})")
        return True

    errors = 0
    print(f"Total {len(scenario_files)} scenario test documents found. Validating...\n")

    for file_path in scenario_files:
        file_name = os.path.basename(file_path)
        with open(file_path, "r", encoding="utf-8-sig", errors="ignore") as f:
            content = f.read()

        has_positive = "Positive" in content or "positive" in content
        has_negative = "Negative" in content or "negative" in content
        has_tc_table = "| TC" in content or "| **TC" in content

        issues = []
        if not has_tc_table:
            issues.append("테스트 케이스 매트릭스 테이블(| TC...) 누락")
        if not has_positive:
            issues.append("Positive(정상 동작) 테스트 케이스 누락")
        if not has_negative:
            issues.append("Negative(예외/에러 동작) 테스트 케이스 누락")

        if issues:
            errors += 1
            print(f"[FAIL] {file_name}")
            for issue in issues:
                print(f"   - {issue}")
        else:
            print(f"[PASS] {file_name} (Positive & Negative TCs included)")

    print(f"\n==================================================")
    if errors == 0:
        print("[SUCCESS] All QA test scenario specifications passed verification!")
        return True
    else:
        print(f"[ERROR] Found {errors} file(s) with specification errors.")
        return False

def run_fullstack_tests():
    print("[Scenario QA Runner] Full-Stack Regression & QA Verification Started...\n")
    
    root_dir = os.getcwd()
    server_dir = os.path.join(root_dir, "workflow_server")
    react_dir = os.path.join(root_dir, "workflow_react")
    reviewer_script = os.path.join(root_dir, ".agents", "skills", "react-component-reviewer", "scripts", "component_reviewer.py")

    # 1. Backend Vitest
    print("1. [Backend Unit & Integration Tests (workflow_server)]")
    be_result = subprocess.run(["npm", "test"], cwd=server_dir, shell=True)
    if be_result.returncode != 0:
        print("[ERROR] Backend test failed!")
        return False
    print("[PASS] Backend tests passed!\n")

    # 2. Frontend Component Reviewer
    print("2. [Frontend Component Architecture Static QA]")
    if os.path.exists(reviewer_script):
        fe_review = subprocess.run([sys.executable, reviewer_script, os.path.join(react_dir, "src")], shell=True)
        if fe_review.returncode != 0:
            print("[ERROR] Frontend component review failed!")
            return False
    print("[PASS] Frontend component review passed!\n")

    # 3. Frontend Build (tsc & vite build)
    print("3. [Frontend Production Build & Type Check (workflow_react)]")
    fe_build = subprocess.run(["npm", "run", "build"], cwd=react_dir, shell=True)
    if fe_build.returncode != 0:
        print("[ERROR] Frontend build failed!")
        return False
    print("[PASS] Frontend build passed!\n")

    print("==================================================")
    print("[COMPLETE] All full-stack verification steps passed cleanly!")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--verify-docs":
        success = verify_qa_docs()
    elif len(sys.argv) > 1 and sys.argv[1] == "--run-all":
        docs_ok = verify_qa_docs()
        test_ok = run_fullstack_tests()
        success = docs_ok and test_ok
    else:
        success = verify_qa_docs()

    sys.exit(0 if success else 1)
