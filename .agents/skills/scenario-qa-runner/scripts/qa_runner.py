import os
import sys
import subprocess
import glob
import re
import json

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

def find_project_dirs():
    root_dir = os.getcwd()
    server_dir = None
    for cand in ["workflow_server", "server", "backend"]:
        p = os.path.join(root_dir, cand)
        if os.path.exists(p) and os.path.exists(os.path.join(p, "package.json")):
            server_dir = p
            break
    if not server_dir:
        server_dir = root_dir

    react_dir = None
    for cand in ["workflow_react", "client", "frontend"]:
        p = os.path.join(root_dir, cand)
        if os.path.exists(p) and os.path.exists(os.path.join(p, "package.json")):
            react_dir = p
            break
    if not react_dir:
        react_dir = root_dir

    return root_dir, server_dir, react_dir

def run_fullstack_tests():
    print("[Scenario QA Runner] Full-Stack Regression & QA Verification Started...\n")
    
    root_dir, server_dir, react_dir = find_project_dirs()
    reviewer_script = os.path.join(root_dir, ".agents", "skills", "react-component-reviewer", "scripts", "component_reviewer.py")

    # 1. Backend Unit Tests
    print(f"1. [Backend Unit & Integration Tests ({os.path.basename(server_dir)})]")
    if os.path.exists(server_dir):
        be_result = subprocess.run(["npm", "test"], cwd=server_dir, shell=True)
        if be_result.returncode != 0:
            print("[ERROR] Backend test failed!")
            return False
        print("[PASS] Backend tests passed!\n")
    else:
        print("[SKIP] Backend directory not found.\n")

    # 2. Frontend Component Reviewer
    print("2. [Frontend Component Architecture Static QA]")
    if os.path.exists(reviewer_script):
        src_path = os.path.join(react_dir, "src") if os.path.exists(os.path.join(react_dir, "src")) else react_dir
        fe_review = subprocess.run([sys.executable, reviewer_script, src_path], shell=True)
        if fe_review.returncode != 0:
            print("[ERROR] Frontend component review failed!")
            return False
        print("[PASS] Frontend component review passed!\n")

    # 3. Frontend Build (tsc & vite build)
    print(f"3. [Frontend Production Build & Type Check ({os.path.basename(react_dir)})]")
    if os.path.exists(react_dir):
        fe_build = subprocess.run(["npm", "run", "build"], cwd=react_dir, shell=True)
        if fe_build.returncode != 0:
            print("[ERROR] Frontend build failed!")
            return False
        print("[PASS] Frontend build passed!\n")
    else:
        print("[SKIP] Frontend directory not found.\n")

    print("==================================================")
    print("[COMPLETE] All full-stack verification steps passed cleanly!")
    return True

def generate_api_report():
    print("[Scenario QA Runner] Generating REST API Test & Inspection Report (HTML & PDF)...")
    _, server_dir, _ = find_project_dirs()
    if not os.path.exists(server_dir):
        print("[SKIP] Server directory not found, skipping API inspection report.")
        return True

    # package.json에 test:api:report 스크립트가 있는지 확인
    pkg_json_path = os.path.join(server_dir, "package.json")
    has_script = False
    if os.path.exists(pkg_json_path):
        try:
            with open(pkg_json_path, "r", encoding="utf-8") as f:
                pkg_data = json.load(f)
                has_script = "test:api:report" in pkg_data.get("scripts", {})
        except Exception:
            pass

    if not has_script:
        print("[INFO] 'test:api:report' script not defined in backend package.json. Skipping report generation.")
        return True

    result = subprocess.run(["npm", "run", "test:api:report"], cwd=server_dir, shell=True)
    if result.returncode != 0:
        print("[ERROR] Failed to generate API inspection report!")
        return False
    print("[SUCCESS] API inspection report generated successfully!")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--verify-docs":
        success = verify_qa_docs()
    elif len(sys.argv) > 1 and sys.argv[1] == "--generate-api-report":
        success = generate_api_report()
    elif len(sys.argv) > 1 and sys.argv[1] == "--run-all":
        docs_ok = verify_qa_docs()
        test_ok = run_fullstack_tests()
        report_ok = generate_api_report()
        success = docs_ok and test_ok and report_ok
    else:
        success = verify_qa_docs()

    sys.exit(0 if success else 1)
