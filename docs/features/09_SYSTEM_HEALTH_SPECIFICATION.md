# 📋 시스템 진단 및 상태 점검(System Health) Feature Specification & Planning Document

> **문서 상태**: Approved  
> **기능 ID**: `FEAT-SYSTEM-HEALTH-01`  
> **대상 도메인**: `system`  
> **작성자 / 일자**: AntiGravity Spec Planner / 2026-10-07  
> **관련 문서**: [GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md)

---

## 1. 기능 개요 및 사용자 가치 (Feature Overview)

### 1.1 배경 및 목적 (Background & Objective)
- **배경**: 분산형 듀얼 데이터베이스(Global DB 및 Multi-tenant Workspace DB) 환경에서 서버 및 각 DB 인스턴스의 연결 상태, 시스템 리소스 사용량(메모리, 업타임)을 정밀하게 모니터링할 필요가 있습니다.
- **목적**: 3-Tier Layered 아키텍처를 준수하는 전용 REST API (`GET /api/system/health`, `GET /api/system/version`)를 제공하고, 프론트엔드에 실시간 연결 상태 및 핑(Latency ms)을 시각화하는 `ServerHealthBadge` 컴포넌트를 구축합니다.

### 1.2 핵심 사용자 시나리오 (User Journey & Core Value)
1. **실시간 서버 및 DB 상태 진단**:
   - 운영자 및 사용자는 시스템 상태를 조회하여 글로벌 DB와 테넌트 DB가 정상 연결되어 있는지 즉시 파악합니다.
2. **네트워크 지연시간(Latency) 모니터링**:
   - 프론트엔드 설정 페이지에서 서버와의 왕복 지연시간(ms)을 녹색 뱃지로 확인하고, 클릭 시 세부 시스템 리소스 정보를 확인합니다.

---

## 2. 데이터 모델 및 비즈니스 규칙 (Data Model & Business Rules)

### 2.1 데이터베이스 스키마 요구사항 (Prisma Schema Target)
시스템 진단은 기존 데이터베이스 연결 상태 및 메트릭을 실시간 계측하며, 모델 정의는 다음과 같습니다:

```prisma
// workflow_server/prisma/schema.global.prisma

model SystemMetricLog {
  id          Int      @id @default(autoincrement())
  status      String   @default("HEALTHY")
  uptimeSec   Int      @map("uptime_sec")
  memoryMb    Float    @map("memory_mb")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("system_metric_logs")
}
```

---

## 3. 백엔드 REST API 명세 (REST API Specification)

### 3.1 REST API 엔드포인트 목록
| 메서드 | 엔드포인트 | 설명 | 인증 필요 여부 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/system/health` | 시스템 및 듀얼 DB 연결 상태 진단 | 불필요 |
| `GET` | `/api/system/version` | 서버 버전 및 환경 정보 조회 | 불필요 |

### 3.2 응답 데이터 샘플 (JSON Response)
```json
{
  "status": "HEALTHY",
  "uptimeSeconds": 1420,
  "memoryUsageMb": 85.4,
  "database": {
    "globalDb": { "status": "CONNECTED", "userCount": 5 },
    "workspaceDb": { "status": "CONNECTED", "projectCount": 3 }
  },
  "timestamp": "2026-10-07T12:00:00.000Z"
}
```

---

## 4. 프론트엔드 UI/UX 사양 (Frontend Specification)

### 4.1 Mock Data 스키마 계약
```typescript
export const MOCK_SYSTEM_HEALTH: SystemHealthResponse = {
  status: 'HEALTHY',
  uptimeSeconds: 120,
  memoryUsageMb: 64.2,
  database: {
    globalDb: { status: 'CONNECTED', userCount: 1 },
    workspaceDb: { status: 'CONNECTED', projectCount: 2 },
  },
  timestamp: new Date().toISOString(),
};
```

### 4.2 컴포넌트 구조
- `src/components/common/ServerHealthBadge.tsx`: 실시간 핑 및 상태 표시 뱃지 (Max 400줄 미만).

---

## 5. QA 및 통합 테스트 시나리오 (QA Test Scenarios)

### 5.1 Positive Test Cases (TC-POS)
- **`TC-POS-01`**: `GET /api/system/health` 호출 시 HTTP 200과 함께 `status: "HEALTHY"`, `uptimeSeconds > 0`을 반환해야 한다.
- **`TC-POS-02`**: `GET /api/system/version` 호출 시 HTTP 200과 함께 유효한 버전 및 환경 문자열을 반환해야 한다.

### 5.2 Negative Test Cases (TC-NEG)
- **`TC-NEG-01`**: 허용되지 않은 HTTP 메서드(`POST /api/system/health`) 호출 시 적절한 404 또는 405 에러를 반환해야 한다.

---

## 6. 개발 파이프라인 산출물 체크리스트 (Pipeline Checklist)
- [x] Phase 0: 기획 사양서 작성 및 `spec_validator.py` 통과 (`SPEC_APPROVED`)
- [ ] Phase 1: 백엔드 3-Tier Layered 구현 및 Vitest 100% Pass
- [ ] Phase 2: 프론트엔드 API 클라이언트 및 컴포넌트 연동
- [ ] Phase 3: 회귀 테스트 및 Vite 빌드 검증
