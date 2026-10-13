import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 1. 현재 환경에 따른 .env 파일 로드
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

// .env.test 또는 .env 우선 로드
const envTestPath = path.resolve(process.cwd(), '.env.test');
const envDefaultPath = path.resolve(process.cwd(), '.env');

if (isTest && fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
} else if (fs.existsSync(envDefaultPath)) {
  dotenv.config({ path: envDefaultPath });
} else {
  // .env 파일이 아예 없는 경우 경고 출력
  if (!isTest) {
    console.warn(`\n⚠️  [ENV WARNING] .env 파일을 찾을 수 없습니다: ${envDefaultPath}`);
    console.warn(`👉 필요 시 '.env.example' 파일을 복사하여 '.env'를 생성하고 로컬 환경에 맞게 수정하세요.\n`);
  }
}

export interface EnvValidationResult {
  hasWarnings: boolean;
  warnings: string[];
  hasErrors: boolean;
  errors: string[];
}

const validation: EnvValidationResult = {
  hasWarnings: false,
  warnings: [],
  hasErrors: false,
  errors: [],
};

// 2. 환경변수 검증 및 기본값(Default) 주입 헬퍼
function requireOrDefault(
  key: string,
  defaultValue: string,
  options: { requiredInProd?: boolean; isSecret?: boolean; description?: string } = {}
): string {
  const currentVal = process.env[key]?.trim();

  if (currentVal && currentVal.length > 0) {
    return currentVal;
  }

  // 값이 없는 경우
  if (isProduction && options.requiredInProd) {
    const errorMsg = `[ENV ERROR] 필수 환경변수 '${key}'(${options.description || ''})가 설정되지 않았습니다. 운영 환경에서는 기본값을 허용하지 않습니다.`;
    validation.hasErrors = true;
    validation.errors.push(errorMsg);
    return '';
  }

  // 개발/테스트 환경: 경고 출력 후 기본값 적용
  const warnMsg = `[ENV WARNING] '${key}' 미설정 -> 기본값('${options.isSecret ? '******' : defaultValue}') 자동 적용`;
  validation.hasWarnings = true;
  validation.warnings.push(warnMsg);

  process.env[key] = defaultValue;
  return defaultValue;
}

// ----------------------------------------------------
// 3. 각 환경변수별 검증 및 기본값 설정
// ----------------------------------------------------

// NODE_ENV
process.env.NODE_ENV = nodeEnv;

// PORT (기본값: 4000)
export const PORT = Number(
  requireOrDefault('PORT', '4000', { description: '서버 바인딩 포트' })
);

// CLIENT_BASE_URL (기본값: http://localhost:5173)
export const CLIENT_BASE_URL = requireOrDefault(
  'CLIENT_BASE_URL',
  'http://localhost:5173',
  { description: '프론트엔드 웹 클라이언트 URL' }
);

// TASK_STORAGE_MODE (기본값: postgresql)
export const TASK_STORAGE_MODE = requireOrDefault(
  'TASK_STORAGE_MODE',
  'postgresql',
  { description: '스토리지 모드' }
);

// DEFAULT_WORKSPACE_NAME (기본값: AntiGravity)
export const DEFAULT_WORKSPACE_NAME = requireOrDefault(
  'DEFAULT_WORKSPACE_NAME',
  'AntiGravity',
  { description: '초기 기본 워크스페이스 명' }
);

// JWT_SECRET (운영 필수, 개발용 기본값 제공)
export const JWT_SECRET = requireOrDefault(
  'JWT_SECRET',
  'antigravity-dev-jwt-secret-key-2026',
  { requiredInProd: true, isSecret: true, description: 'JWT Access Token 서명 키' }
);

// JWT_EXPIRES_IN (기본값: 7d)
export const JWT_EXPIRES_IN = requireOrDefault(
  'JWT_EXPIRES_IN',
  '7d',
  { description: 'JWT 토큰 유효 기간' }
);

// DATABASE_URL 기본값 폴백
const defaultDevGlobalDb = 'postgresql://postgres:postgres@localhost:5432/global?schema=public';
const defaultDevWorkspaceDb = 'postgresql://postgres:postgres@localhost:5432/workspace?schema=public';

// GLOBAL_DATABASE_URL
export const GLOBAL_DATABASE_URL = requireOrDefault(
  'GLOBAL_DATABASE_URL',
  process.env.DATABASE_URL || defaultDevGlobalDb,
  { requiredInProd: true, description: '시스템 글로벌 데이터베이스 URL' }
);

// WORKSPACE_DATABASE_URL
export const WORKSPACE_DATABASE_URL = requireOrDefault(
  'WORKSPACE_DATABASE_URL',
  process.env.DATABASE_URL || defaultDevWorkspaceDb,
  { requiredInProd: true, description: '워크스페이스 테넌트 데이터베이스 URL' }
);

// Fallback DATABASE_URL 동기화
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = WORKSPACE_DATABASE_URL;
}

// ----------------------------------------------------
// 4. Prisma Client 생성 상태 사전 점검 (Clean PC 자가진단)
// ----------------------------------------------------
export function checkPrismaClients(): { isReady: boolean; missing: string[] } {
  const missing: string[] = [];
  const globalClientPath = path.resolve(process.cwd(), 'src/generated/global-client/index.js');
  const workspaceClientPath = path.resolve(process.cwd(), 'src/generated/workspace-client/index.js');

  if (!fs.existsSync(globalClientPath)) {
    missing.push('Global Prisma Client (src/generated/global-client)');
  }
  if (!fs.existsSync(workspaceClientPath)) {
    missing.push('Workspace Prisma Client (src/generated/workspace-client)');
  }

  return {
    isReady: missing.length === 0,
    missing,
  };
}

// ----------------------------------------------------
// 5. 환경변수 상태 콘솔 요약 출력
// ----------------------------------------------------
let hasPrintedSummary = false;

export function printEnvSummary(): void {
  if (hasPrintedSummary || isTest) return;
  hasPrintedSummary = true;

  console.log(`\n==================================================`);
  console.log(`⚙️  [Environment & Configuration Status]`);
  console.log(`   - Mode        : ${process.env.NODE_ENV}`);
  console.log(`   - Port        : ${process.env.PORT}`);
  console.log(`   - Client URL  : ${process.env.CLIENT_BASE_URL}`);

  const maskUrl = (u?: string) => {
    if (!u) return '(None)';
    return u.replace(/:([^:@]+)@/, ':****@');
  };

  console.log(`   - Global DB   : ${maskUrl(process.env.GLOBAL_DATABASE_URL)}`);
  console.log(`   - Workspace DB: ${maskUrl(process.env.WORKSPACE_DATABASE_URL)}`);
  console.log(`   - JWT Secret  : ${process.env.JWT_SECRET ? '✓ Configured' : '❌ Missing'}`);

  // 경고 목록 출력
  if (validation.warnings.length > 0) {
    console.log(`--------------------------------------------------`);
    console.log(`⚠️  [ENV Default Fallbacks Applied (${validation.warnings.length})]:`);
    for (const w of validation.warnings) {
      console.log(`   • ${w}`);
    }
  }

  // 에러 목록 출력 및 운영 중단
  if (validation.errors.length > 0) {
    console.error(`--------------------------------------------------`);
    console.error(`❌ [Critical Configuration Errors]:`);
    for (const e of validation.errors) {
      console.error(`   • ${e}`);
    }
    console.error(`\n🚨 서버를 시작할 수 없습니다. 위 환경변수를 .env에 설정해 주세요.`);
    process.exit(1);
  }

  // Prisma Client 점검
  const clientStatus = checkPrismaClients();
  if (!clientStatus.isReady) {
    console.error(`--------------------------------------------------`);
    console.error(`❌ [Prisma Client Not Found Error]`);
    for (const m of clientStatus.missing) {
      console.error(`   • 누락됨: ${m}`);
    }
    console.error(`👉 해결 방법: 다음 명령어를 실행하여 Prisma Client를 생성해 주세요:`);
    console.error(`   npm run prisma:generate`);
    console.error(`--------------------------------------------------\n`);
  } else {
    console.log(`   - Prisma Clt  : ✓ Generated & Ready`);
    console.log(`==================================================\n`);
  }
}

// 모듈 로드 시 운영 환경 치명적 오류 즉시 검사
if (isProduction && validation.hasErrors) {
  printEnvSummary();
}
