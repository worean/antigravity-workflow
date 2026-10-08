import os
import sys
import subprocess
import glob
import re
import json
import hashlib
from datetime import datetime

# Windows 콘솔 UTF-8 출력 보정
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

STATE_DIR = os.path.join(os.getcwd(), ".agents", "state")
STATE_FILE = os.path.join(STATE_DIR, "pipeline_state.json")
REPORT_DIR = os.path.join(os.getcwd(), "docs", "qa", "reports")
REPORT_FILE = os.path.join(REPORT_DIR, "AUTONOMOUS_PIPELINE_REPORT.md")

MAX_CIRCUIT_BREAKER_ERRORS = 3

def ensure_dirs():
    os.makedirs(STATE_DIR, exist_ok=True)
    os.makedirs(REPORT_DIR, exist_ok=True)

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

def load_pipeline_state():
    ensure_dirs()
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8-sig") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "featureName": "Current Work",
        "iteration": 0,
        "status": "IDLE", # IDLE, RUNNING, SUCCESS, CIRCUIT_BREAKER
        "sameErrorCount": 0,
        "lastErrorSignature": None,
        "history": [],
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }

def save_pipeline_state(state):
    ensure_dirs()
    state["updatedAt"] = datetime.now().isoformat()
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def reset_pipeline_state(feature_name="Feature Implementation"):
    ensure_dirs()
    state = {
        "featureName": feature_name,
        "iteration": 0,
        "status": "RUNNING",
        "sameErrorCount": 0,
        "lastErrorSignature": None,
        "history": [],
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    save_pipeline_state(state)
    print(f"🔄 [Closed-Loop Pipeline] State initialized for feature: '{feature_name}' (Iteration 0)")
    return state

def normalize_error_signature(error_type, error_text):
    """
    에러 텍스트에서 타임스탬프, 임의의 숫자, 경로의 가변적인 부분을 제거하여
    동일한 에러인지 판별할 수 있는 정규화된 해시를 생성합니다.
    """
    cleaned = error_text.strip()
    # 타임스탬프 제거
    cleaned = re.sub(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?', '', cleaned)
    cleaned = re.sub(r'\d{1,2}:\d{2}:\d{2}', '', cleaned)
    # 소요 시간 제거 (e.g. 1476ms, 3.14s)
    cleaned = re.sub(r'\d+(?:\.\d+)?(?:ms|s)', '', cleaned)
    # 임의의 프로세스 번호/포트 번호 제거
    cleaned = re.sub(r'pid \d+', '', cleaned, flags=re.IGNORECASE)
    # 연속 공백 정리
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # 대표 500자 추출 후 MD5 해시 생성
    sample = cleaned[:500]
    sig_hash = hashlib.md5(f"{error_type}:{sample}".encode('utf-8')).hexdigest()[:12]
    return f"{error_type}_{sig_hash}", sample[:200]

def verify_qa_docs():
    print("[Scenario QA Runner] Scanning QA Test Case Specifications (docs/qa/)...")
    qa_dir = os.path.join(os.getcwd(), "docs", "qa")
    scenarios_dir = os.path.join(qa_dir, "scenarios")
    
    if not os.path.exists(qa_dir):
        print(f"[WARN] QA directory does not exist: {qa_dir}")
        return True, None

    scenario_files = glob.glob(os.path.join(scenarios_dir, "*.md"))
    if not scenario_files:
        print(f"[INFO] No scenario test documents found. (path: {scenarios_dir})")
        return True, None

    errors = []
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
            err_msg = f"{file_name}: " + ", ".join(issues)
            errors.append(err_msg)
            print(f"[FAIL] {file_name}")
            for issue in issues:
                print(f"   - {issue}")
        else:
            print(f"[PASS] {file_name} (Positive & Negative TCs included)")

    if errors:
        return False, "\n".join(errors)
    return True, None

def run_backend_tests(server_dir):
    print(f"\n1. [Backend Unit & Integration Tests ({os.path.basename(server_dir)})]")
    if not os.path.exists(server_dir):
        print("[SKIP] Backend directory not found.")
        return True, None

    proc = subprocess.run(["npm", "test"], cwd=server_dir, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    if proc.returncode != 0:
        output = (proc.stdout + "\n" + proc.stderr).strip()
        print("[ERROR] Backend test failed!")
        # 핵심 실패 에러 라인 파싱
        fail_lines = [line for line in output.split('\n') if "FAIL" in line or "Error:" in line or "AssertionError" in line or "expected" in line]
        summary = "\n".join(fail_lines[-10:]) if fail_lines else output[-500:]
        return False, summary
    print("[PASS] Backend tests passed!")
    return True, None

def run_frontend_review(root_dir, react_dir):
    print("\n2. [Frontend Component Architecture Static QA]")
    reviewer_script = os.path.join(root_dir, ".agents", "skills", "react-component-reviewer", "scripts", "component_reviewer.py")
    if not os.path.exists(reviewer_script):
        print("[SKIP] Component reviewer script not found.")
        return True, None

    src_path = os.path.join(react_dir, "src") if os.path.exists(os.path.join(react_dir, "src")) else react_dir
    proc = subprocess.run([sys.executable, reviewer_script, src_path], shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    if proc.returncode != 0:
        output = (proc.stdout + "\n" + proc.stderr).strip()
        print("[ERROR] Frontend component review failed!")
        return False, output[-500:]
    print("[PASS] Frontend component review passed!")
    return True, None

def run_frontend_build(react_dir):
    print(f"\n3. [Frontend Production Build & Type Check ({os.path.basename(react_dir)})]")
    if not os.path.exists(react_dir):
        print("[SKIP] Frontend directory not found.")
        return True, None

    proc = subprocess.run(["npm", "run", "build"], cwd=react_dir, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    if proc.returncode != 0:
        output = (proc.stdout + "\n" + proc.stderr).strip()
        print("[ERROR] Frontend build failed!")
        return False, output[-600:]
    print("[PASS] Frontend build passed!")
    return True, None

def run_fullstack_tests():
    print("[Scenario QA Runner] Full-Stack Regression & QA Verification Started...\n")
    root_dir, server_dir, react_dir = find_project_dirs()

    docs_ok, docs_err = verify_qa_docs()
    if not docs_ok:
        return False, "QA_DOCS_ERROR", docs_err

    be_ok, be_err = run_backend_tests(server_dir)
    if not be_ok:
        return False, "BACKEND_TEST_ERROR", be_err

    fe_rev_ok, fe_rev_err = run_frontend_review(root_dir, react_dir)
    if not fe_rev_ok:
        return False, "FRONTEND_REVIEW_ERROR", fe_rev_err

    fe_build_ok, fe_build_err = run_frontend_build(react_dir)
    if not fe_build_ok:
        return False, "FRONTEND_BUILD_ERROR", fe_build_err

    print("\n==================================================")
    print("[COMPLETE] All full-stack verification steps passed cleanly!")
    return True, None, None

def check_closed_loop():
    """
    폐루프 검증 실행 함수:
    - 전체 테스트 실행
    - 성공 시: SUCCESS 리포트 자동 생성
    - 실패 시: 동일 에러 연속 발생 횟수 추적
      - 3회 연속 동일 에러 발생 시: CIRCUIT_BREAKER 발동 및 중단 리포트 생성
      - 미만 시: 다음 디버깅 에이전트(BE or FE) 지정 및 피드백 JSON 출력
    """
    state = load_pipeline_state()
    state["iteration"] += 1
    current_iter = state["iteration"]

    print(f"\n🔄 ========================================================")
    print(f"🚀 [Closed-Loop Pipeline] Iteration #{current_iter} Started")
    print(f"🎯 Feature: {state.get('featureName', 'Current Work')}")
    print(f"========================================================\n")

    passed, err_type, err_detail = run_fullstack_tests()

    history_entry = {
        "iteration": current_iter,
        "timestamp": datetime.now().isoformat(),
        "passed": passed
    }

    if passed:
        state["status"] = "SUCCESS"
        state["sameErrorCount"] = 0
        state["lastErrorSignature"] = None
        history_entry["status"] = "PASSED"
        state["history"].append(history_entry)
        save_pipeline_state(state)

        print(f"\n🎉 [Closed-Loop Pipeline] All QA checks passed successfully at iteration #{current_iter}!")
        generate_pipeline_report(state)
        return True

    # 실패 발생 시 에러 시그니처 분석
    sig_id, sig_summary = normalize_error_signature(err_type, err_detail)
    history_entry["status"] = "FAILED"
    history_entry["errorType"] = err_type
    history_entry["signature"] = sig_id
    history_entry["summary"] = sig_summary
    history_entry["details"] = err_detail

    # 동일 에러 카운팅
    if state.get("lastErrorSignature") == sig_id:
        state["sameErrorCount"] += 1
    else:
        state["sameErrorCount"] = 1
        state["lastErrorSignature"] = sig_id

    same_count = state["sameErrorCount"]
    state["history"].append(history_entry)

    print(f"\n⚠️ [Closed-Loop QA Failure] Detected Error: {err_type}")
    print(f"🔑 Error Signature: {sig_id}")
    print(f"🔁 Same Error Consecutive Count: {same_count} / {MAX_CIRCUIT_BREAKER_ERRORS}")
    print(f"📄 Summary:\n{sig_summary}\n")

    # 서킷 브레이커 검사 (3회 이상 동일 에러)
    if same_count >= MAX_CIRCUIT_BREAKER_ERRORS:
        state["status"] = "CIRCUIT_BREAKER"
        save_pipeline_state(state)
        print("🚨 ========================================================")
        print(f"🛑 [CIRCUIT BREAKER TRIGGERED] Same error repeated {same_count} times!")
        print("🛑 Autonomous loop stopped to prevent infinite hallucination.")
        print("🚨 ========================================================\n")
        generate_pipeline_report(state)
        return False

    state["status"] = "RUNNING"
    save_pipeline_state(state)

    # 타겟 디버깅 에이전트 결정
    target_agent = "backend-developer" if "BACKEND" in err_type else "frontend-developer"
    feedback = {
        "event": "QA_DEFECT_REPORTED",
        "iteration": current_iter,
        "targetAgent": target_agent,
        "errorType": err_type,
        "signature": sig_id,
        "sameErrorCount": same_count,
        "maxAllowed": MAX_CIRCUIT_BREAKER_ERRORS,
        "errorDetails": err_detail,
        "actionRequired": f"Resolve {err_type} and trigger QA re-run."
    }
    
    print("📤 [Handoff Defect Message]")
    print(json.dumps(feedback, indent=2, ensure_ascii=False))
    return False

def generate_pipeline_report(state=None):
    if state is None:
        state = load_pipeline_state()

    ensure_dirs()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status = state.get("status", "UNKNOWN")
    feature_name = state.get("featureName", "Feature Implementation")
    total_iters = state.get("iteration", 0)
    history = state.get("history", [])

    status_badge = "🟢 **SUCCESS (전체 통과)**" if status == "SUCCESS" else "🔴 **CIRCUIT BREAKER (동일 에러 3회 반복 중단)**" if status == "CIRCUIT_BREAKER" else "🟡 **RUNNING (진행 중)**"

    lines = [
        "# 📊 자율 폐루프 파이프라인 종합 실행 리포트 (Autonomous Closed-Loop Report)",
        "",
        f"- **작업 기능명**: `{feature_name}`",
        f"- **리포트 생성 일시**: `{now_str}`",
        f"- **최종 파이프라인 상태**: {status_badge}",
        f"- **총 실행 반복 횟수 (Iterations)**: `{total_iters} 회`",
        f"- **동일 에러 연속 횟수**: `{state.get('sameErrorCount', 0)} / {MAX_CIRCUIT_BREAKER_ERRORS}`",
        "",
        "---",
        "",
        "## 1. 🎯 실행 요약 (Executive Summary)",
        ""
    ]

    if status == "SUCCESS":
        lines.extend([
            "> [!NOTE] ✅ 모든 품질 게이트가 완벽히 통과되었습니다.",
            "> 백엔드 단위/통합 테스트, 프론트엔드 컴포넌트 린트 규칙(400줄/테마/Portal), 프로덕션 Vite 빌드가 모두 100% 정상 완료되었습니다.",
            ""
        ])
    elif status == "CIRCUIT_BREAKER":
        lines.extend([
            "> [!CAUTION] 🚨 서킷 브레이커(Circuit Breaker)가 발동되었습니다.",
            f"> 동일한 에러 시그니처(`{state.get('lastErrorSignature')}`)가 **3회 연속 반복**되어 무한 루프 및 컨텍스트 오염을 방지하기 위해 자율 디버깅을 일시 중단했습니다.",
            "> 하단의 에러 상세 로그를 확인하여 근본 원인을 수동 또는 집중 분석하세요.",
            ""
        ])
    else:
        lines.extend([
            "> [!IMPORTANT] 🔄 파이프라인이 현재 진행 중입니다.",
            ""
        ])

    lines.extend([
        "## 2. ⏱️ 반복 이터레이션 이력 (Iteration History)",
        "",
        "| 회차 (#) | 시각 | 결과 | 실패 유형 | 에러 시그니처 | 요약 |",
        "| :---: | :---: | :---: | :---: | :--- | :--- |"
    ])

    for h in history:
        it_num = h.get("iteration", "-")
        t_str = h.get("timestamp", "")[11:19]
        res = "✅ PASS" if h.get("passed") else "❌ FAIL"
        e_type = h.get("errorType", "-")
        e_sig = f"`{h.get('signature', '-')}`" if h.get("signature") else "-"
        summary = (h.get("summary", "-") or "-").replace("\n", " ")[:60]
        lines.append(f"| #{it_num} | {t_str} | {res} | `{e_type}` | {e_sig} | {summary} |")

    lines.extend([
        "",
        "---",
        "",
        "## 3. 🚨 최근 에러 상세 내역 (Latest Error Details)",
        ""
    ])

    last_fail = next((h for h in reversed(history) if not h.get("passed")), None)
    if last_fail:
        lines.extend([
            f"### 📍 실패 유형: `{last_fail.get('errorType')}`",
            f"- **시그니처 해시**: `{last_fail.get('signature')}`",
            "",
            "```text",
            last_fail.get("details", "No raw error detail available."),
            "```",
            ""
        ])
    else:
        lines.extend([
            "특이 에러 사항 없음 (모든 테스트 통과).",
            ""
        ])

    lines.extend([
        "## 4. 🛠️ 에이전트 권장 조치사항 (Actionable Recommendations)",
        ""
    ])

    if status == "CIRCUIT_BREAKER":
        lines.extend([
            "1. **`backend-developer`**: 데이터베이스 스키마와 Prisma 모델 매핑, 또는 모듈 경로(`Path Alias`)가 올바른지 점검하세요.",
            "2. **`frontend-developer`**: TypeScript 인터페이스 타입 정의 및 TanStack Query 훅의 반환형 불일치를 확인하세요.",
            "3. **`spec-planner`**: 기획 사양서(`docs/features/`)의 API DTO와 실제 구현 간의 불일치가 있는지 검토하세요.",
            ""
        ])
    elif status == "SUCCESS":
        lines.extend([
            "- 모든 테스트가 성공적으로 승인되었으므로 최종 배포 또는 상위 브랜치 머지가 가능합니다.",
            ""
        ])

    content = "\n".join(lines)
    # UTF-8 with BOM 저장
    with open(REPORT_FILE, "w", encoding="utf-8-sig") as f:
        f.write(content)

    print(f"📄 [Report Generated] Pipeline report saved to: {REPORT_FILE}")
    return REPORT_FILE

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "--verify-docs":
            ok, _ = verify_qa_docs()
            sys.exit(0 if ok else 1)
        elif cmd == "--run-all":
            ok, _, _ = run_fullstack_tests()
            sys.exit(0 if ok else 1)
        elif cmd == "--check-loop":
            ok = check_closed_loop()
            sys.exit(0 if ok else 1)
        elif cmd == "--init-loop":
            feature_name = sys.argv[2] if len(sys.argv) > 2 else "New Feature"
            reset_pipeline_state(feature_name)
            sys.exit(0)
        elif cmd == "--reset-loop":
            reset_pipeline_state("Reset")
            sys.exit(0)
        elif cmd == "--generate-report":
            generate_pipeline_report()
            sys.exit(0)
        else:
            print(f"Unknown command: {cmd}")
            sys.exit(1)
    else:
        ok, _, _ = run_fullstack_tests()
        sys.exit(0 if ok else 1)
