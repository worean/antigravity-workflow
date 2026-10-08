import os
import sys
import json
import subprocess
from datetime import datetime

# Windows 콘솔 UTF-8 출력 보정
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

STATE_FILE = os.path.join(os.getcwd(), ".agents", "state", "pipeline_state.json")
REPORT_FILE = os.path.join(os.getcwd(), "docs", "qa", "reports", "AUTONOMOUS_PIPELINE_REPORT.md")
QA_RUNNER = os.path.join(os.getcwd(), ".agents", "skills", "scenario-qa-runner", "scripts", "qa_runner.py")

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8-sig") as f:
                return json.load(f)
        except Exception:
            pass
    return None

def cmd_start(feature_name):
    print(f"\n🚀 [Orchestrator] Starting Autonomous Closed-Loop Pipeline for: '{feature_name}'")
    subprocess.run([sys.executable, QA_RUNNER, "--init-loop", feature_name], check=True)
    
    print("\n📋 [Action Guide: Phase 1 Concurrent Dispatch]")
    print("메인 에이전트는 invoke_subagent 도구를 호출하여 Backend와 Frontend를 단일 호출로 동시 런칭하세요:")
    example_dispatch = {
        "Subagents": [
            {
                "TypeName": "backend-developer",
                "Role": "Backend Developer",
                "Model": "pro",
                "Workspace": "branch",
                "Prompt": f"사양서(docs/features/)를 기반으로 {feature_name}의 REST API 및 Prisma 모델을 구현하고 Vitest 단위 테스트를 100% 통과시키세요."
            },
            {
                "TypeName": "frontend-developer",
                "Role": "Frontend Developer",
                "Model": "pro",
                "Workspace": "branch",
                "Prompt": f"사양서의 MOCK DATA를 기반으로 {feature_name}의 UI 컴포넌트를 선행 개발하고 component_reviewer 규칙을 준수하세요."
            }
        ]
    }
    print(json.dumps(example_dispatch, indent=2, ensure_ascii=False))

def cmd_check():
    print("\n🧪 [Orchestrator] Running Closed-Loop QA Runner...")
    res = subprocess.run([sys.executable, QA_RUNNER, "--check-loop"])
    state = load_state()
    if not state:
        return

    status = state.get("status")
    iter_num = state.get("iteration", 0)
    same_err = state.get("sameErrorCount", 0)

    print("\n------------------------------------------------------------")
    if status == "SUCCESS":
        print(f"🎉 [Pipeline COMPLETED] All QA checks passed cleanly at iteration #{iter_num}!")
        print(f"📄 Report available: {REPORT_FILE}")
    elif status == "CIRCUIT_BREAKER":
        print(f"🚨 [CIRCUIT BREAKER TRIGGERED] Same error repeated {same_err} times! Loop halted.")
        print(f"📄 Defect Report generated: {REPORT_FILE}")
        print("👉 사람 개발자 또는 집중 디버깅 모드로 원인을 수동 확인하세요.")
    else:
        print(f"⚠️ [Pipeline Needs Debugging] Iteration #{iter_num} failed (Same error: {same_err}/3).")
        target = "backend-developer" if "BACKEND" in state.get("lastErrorSignature", "") else "frontend-developer"
        print(f"👉 권장 다음 단계: '{target}' 에이전트에게 디버깅 메시지를 발송하세요.")
    print("------------------------------------------------------------\n")

def cmd_status():
    state = load_state()
    if not state:
        print("파이프라인 상태가 없습니다. 먼저 'start' 명령으로 초기화하세요.")
        return

    print("\n📊 [Pipeline Current Status]")
    print(f"- Feature: {state.get('featureName')}")
    print(f"- Status: {state.get('status')}")
    print(f"- Iteration: {state.get('iteration')}")
    print(f"- Same Error Count: {state.get('sameErrorCount', 0)} / 3")
    print(f"- Last Error Signature: {state.get('lastErrorSignature')}")
    print(f"- Updated At: {state.get('updatedAt')}")

def cmd_report():
    subprocess.run([sys.executable, QA_RUNNER, "--generate-report"], check=True)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/autonomous_orchestrator.py [start|check|status|report] [args...]")
        sys.exit(1)

    action = sys.argv[1].lower()
    if action == "start":
        feat = sys.argv[2] if len(sys.argv) > 2 else "New Feature"
        cmd_start(feat)
    elif action == "check":
        cmd_check()
    elif action == "status":
        cmd_status()
    elif action == "report":
        cmd_report()
    else:
        print(f"Unknown action: {action}")
        sys.exit(1)
