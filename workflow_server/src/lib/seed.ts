// -*- coding: utf-8 -*-
import path from 'path';
import { globalPrisma } from './globalPrisma.js';
import { workspaceManager } from './workspaceManager.js';
import { prisma } from './prisma.js';

export async function seedDatabase() {
  console.log('🌱 Starting Global & Default Workspace Database Initial Seeding...');

  // 1. Global DB Admin Account (worean@naver.com)
  const adminUser = await globalPrisma.user.upsert({
    where: { email: 'worean@naver.com' },
    update: {
      name: '시스템 최고 관리자',
      role: 'ADMIN',
    },
    create: {
      email: 'worean@naver.com',
      name: '시스템 최고 관리자',
      role: 'ADMIN',
    },
  });

  // 2. Global DB Default Workspace
  const defaultWsDbPath = path.resolve(process.cwd(), '.tmp/workspaces/default.db').replace(/\\/g, '/');
  const defaultWorkspace = await globalPrisma.workspace.upsert({
    where: { slug: 'default-workspace' },
    update: {
      dbUrl: `file:${defaultWsDbPath}`,
    },
    create: {
      slug: 'default-workspace',
      name: '기본 워크스페이스',
      description: '기본 시스템 워크스페이스',
      ownerId: adminUser.id,
      dbType: 'sqlite',
      dbUrl: `file:${defaultWsDbPath}`,
      status: 'ACTIVE',
    },
  });

  // 3. UserWorkspace Membership
  await globalPrisma.userWorkspace.upsert({
    where: {
      userId_workspaceId: {
        userId: adminUser.id,
        workspaceId: defaultWorkspace.id,
      },
    },
    update: {
      role: 'OWNER',
      status: 'ACTIVE',
    },
    create: {
      userId: adminUser.id,
      workspaceId: defaultWorkspace.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  // 4. Default Workspace Metadata & User Sync
  await workspaceManager.seedDefaultMetadata(prisma);
  await workspaceManager.syncUserToWorkspace(prisma, {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role,
  });

  console.log('✅ Global Admin & Default Workspace Seed Completed Cleanly!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding Failed:', err);
      process.exit(1);
    });
}
