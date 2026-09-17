import path from 'path';
import dotenv from 'dotenv';
import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

// 테스트 전용 .env.test 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

export async function setup() {
  console.log('\n🔒 [Test Safety Guard] Verifying isolated test database connection...');

  const globalUrl = process.env.GLOBAL_DATABASE_URL || '';
  const workspaceUrl = process.env.WORKSPACE_DATABASE_URL || '';

  // 🛡️ Fail-Safe 가드: 만약 개발용 DB(끝이 /global 또는 /workspace)로 지정되어 있다면 테스트 중단
  if (
    globalUrl.endsWith('/global') ||
    workspaceUrl.endsWith('/workspace') ||
    (!globalUrl.includes('test') && !workspaceUrl.includes('test'))
  ) {
    throw new Error(
      `🚨 FATAL: Tests attempted to run against DEV/PROD databases!\n` +
      `GLOBAL_DATABASE_URL: ${globalUrl}\n` +
      `WORKSPACE_DATABASE_URL: ${workspaceUrl}\n` +
      `Tests must ONLY run against isolated test databases (e.g. global_test, workspace_test).`
    );
  }

  console.log(`✅ [Test Safety Guard] Test databases verified:\n - Global: ${globalUrl}\n - Workspace: ${workspaceUrl}`);

  // 테스트 DB 기본 메타데이터 및 어드민 시드 보장
  try {
    const adminUser = await globalPrisma.user.upsert({
      where: { email: 'worean@naver.com' },
      update: { name: '시스템 최고 관리자', role: 'ADMIN' },
      create: { email: 'worean@naver.com', name: '시스템 최고 관리자', role: 'ADMIN' },
    });

    const defaultWs = await globalPrisma.workspace.upsert({
      where: { slug: 'antigravity-test' },
      update: { dbUrl: workspaceUrl, ownerId: adminUser.id },
      create: {
        slug: 'antigravity-test',
        name: 'AntiGravity Test Workspace',
        ownerId: adminUser.id,
        dbType: 'postgresql',
        dbUrl: workspaceUrl,
        status: 'ACTIVE',
      },
    });

    await globalPrisma.userWorkspace.upsert({
      where: {
        userId_workspaceId: {
          userId: adminUser.id,
          workspaceId: defaultWs.id,
        },
      },
      update: { role: 'OWNER', status: 'ACTIVE' },
      create: {
        userId: adminUser.id,
        workspaceId: defaultWs.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    await workspaceManager.seedDefaultMetadata(prisma);
    await workspaceManager.syncUserToWorkspace(prisma, {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });

    // PostgreSQL autoincrement sequence 동기화 (명시적 id 삽입 후 시퀀스 꼬임 방지)
    try {
      await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 1));`);
      await globalPrisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 1));`);
      await globalPrisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Workspace"', 'id'), COALESCE((SELECT MAX(id) FROM "Workspace"), 1));`);
    } catch {
      // SQLite 등 타 환경 무시
    }

    console.log('🌱 [Test DB Setup] Test database seeds initialized cleanly.\n');
  } catch (err: any) {
    console.warn('⚠️ [Test DB Setup] Note during seed initialization:', err.message);
  }
}

export async function teardown() {
  console.log('\n🧹 [Test DB Teardown] Cleaning up test client connections...');
  try {
    await workspaceManager.closeAll();
    await prisma.$disconnect();
    await globalPrisma.$disconnect();
    console.log('✨ [Test DB Teardown] All test connections disconnected.\n');
  } catch (err: any) {
    console.warn('⚠️ [Test DB Teardown] Error during disconnect:', err.message);
  }
}
