import fs from 'fs';
import path from 'path';

console.log(`\n=============================================================`);
console.log(`🧪 [Clean PC Setup & Prisma Environment Diagnostic Script]`);
console.log(`=============================================================`);

// 1. .env 파일 검사
const envPath = path.resolve(process.cwd(), '.env');
const envExamplePath = path.resolve(process.cwd(), '.env.example');

console.log(`\n1️⃣  [.env Configuration File Check]`);
if (fs.existsSync(envPath)) {
  console.log(`   ✓ .env 파일이 감지되었습니다: ${envPath}`);
} else {
  console.log(`   ⚠️  .env 파일이 없습니다! (Clean PC 초기 상태)`);
  if (fs.existsSync(envExamplePath)) {
    console.log(`   💡 안내: '.env.example' 템플릿이 존재합니다.`);
    console.log(`      'cp .env.example .env' 또는 복사하여 환경에 맞게 DB 연결 정보를 설정하세요.`);
  }
}

// 2. env.ts 모듈 로딩 및 유효성 검사 테스트
console.log(`\n2️⃣  [Environment Variables Loading & Default Fallback Test]`);
import '../src/lib/env.js';
import { printEnvSummary, checkPrismaClients } from '../src/lib/env.js';

printEnvSummary();

// 3. Prisma Client 생성 상태 점검
console.log(`3️⃣  [Prisma Client Generation Check]`);
const prismaStatus = checkPrismaClients();
if (prismaStatus.isReady) {
  console.log(`   ✓ Global Client & Workspace Client 모두 정상 생성되어 있습니다.`);
} else {
  console.error(`   ❌ Prisma Client가 일부 또는 전부 생성되지 않았습니다!`);
  for (const m of prismaStatus.missing) {
    console.error(`      - ${m}`);
  }
  console.log(`\n   👉 생성 명령어: npm run prisma:generate`);
}

// 4. Prisma Client 모듈 동적 Import 및 인스턴스화 테스트
console.log(`\n4️⃣  [Prisma Client Instantiation & DB Connection Test]`);
async function testPrismaConnections() {
  try {
    const { globalPrisma } = await import('../src/lib/globalPrisma.js');
    console.log(`   ✓ Global Prisma Client 인스턴스화 성공`);

    try {
      await globalPrisma.$connect();
      console.log(`   ✓ Global Database ($connect) 연결 성공!`);
      const userCount = await globalPrisma.user.count();
      console.log(`      - 등록된 사용자 수: ${userCount}명`);
    } catch (dbErr: any) {
      console.warn(`   ⚠️  Global Database 연결 실패:`, dbErr.message);
      console.warn(`      (PostgreSQL 서비스가 구동 중인지, .env의 GLOBAL_DATABASE_URL이 올바른지 확인하세요.)`);
    }
  } catch (err: any) {
    console.error(`   ❌ Global Prisma Client 로딩 실패:`, err.message);
  }

  try {
    const { prisma } = await import('../src/lib/prisma.js');
    console.log(`   ✓ Workspace Prisma Client 인스턴스화 성공`);

    try {
      await prisma.$connect();
      console.log(`   ✓ Workspace Database ($connect) 연결 성공!`);
      const projectCount = await prisma.project.count();
      console.log(`      - 등록된 프로젝트 수: ${projectCount}개`);
    } catch (dbErr: any) {
      console.warn(`   ⚠️  Workspace Database 연결 실패:`, dbErr.message);
      console.warn(`      (PostgreSQL 서비스가 구동 중인지, .env의 WORKSPACE_DATABASE_URL이 올바른지 확인하세요.)`);
    }
  } catch (err: any) {
    console.error(`   ❌ Workspace Prisma Client 로딩 실패:`, err.message);
  }

  console.log(`\n=============================================================`);
  console.log(`🎉 [진단 완료] 환경 점검이 완료되었습니다.`);
  console.log(`=============================================================\n`);
}

testPrismaConnections();
