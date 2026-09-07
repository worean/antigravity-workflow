import 'dotenv/config';
import { prisma } from './src/lib/prisma.js';
import { globalPrisma } from './src/lib/globalPrisma.js';

async function main() {
  console.log('ENV GLOBAL_DATABASE_URL:', process.env.GLOBAL_DATABASE_URL);
  console.log('ENV WORKSPACE_DATABASE_URL:', process.env.WORKSPACE_DATABASE_URL);

  try {
    console.log('\n--- 1. Testing Global Database (PostgreSQL) ---');
    const users = await globalPrisma.user.findMany();
    console.log('Global Users Count:', users.length);
    for (const u of users) {
      console.log(` - User #${u.id}: ${u.email} (${u.name})`);
    }

    // 레거시 file: 워크스페이스들을 PostgreSQL URL로 동기화
    const updatedCount = await globalPrisma.workspace.updateMany({
      where: {
        OR: [
          { dbType: 'sqlite' },
          { dbUrl: { startsWith: 'file:' } }
        ]
      },
      data: {
        dbType: 'postgresql',
        dbUrl: process.env.WORKSPACE_DATABASE_URL || 'postgresql://juyeong:qkrwndud@localhost:5432/workspace'
      }
    });
    console.log(`Updated legacy workspaces count: ${updatedCount.count}`);

    const workspaces = await globalPrisma.workspace.findMany();
    console.log('Global Workspaces Count:', workspaces.length);
    for (const w of workspaces) {
      console.log(` - Workspace #${w.id}: ${w.name} (dbType: ${w.dbType}, dbUrl: ${w.dbUrl})`);
    }

    console.log('\n--- 2. Testing Workspace Database (PostgreSQL) ---');
    const projects = await prisma.project.findMany();
    console.log('Workspace Projects Count:', projects.length);
    for (const p of projects) {
      console.log(` - Project #${p.id}: ${p.name} (${p.key})`);
    }

    const statuses = await prisma.issueStatus.findMany();
    console.log('Workspace IssueStatuses Count:', statuses.length);

    const issues = await prisma.issue.findMany();
    console.log('Workspace Issues Count:', issues.length);

    console.log('\n--- 3. Testing Global Chat Channels ---');
    // 레거시 workspaceId: null 채널 정리
    const deletedLegacyChannels = await globalPrisma.chatChannel.deleteMany({
      where: { workspaceId: null },
    });
    console.log(`Deleted legacy channels with null workspaceId: ${deletedLegacyChannels.count}`);

    const channels = await globalPrisma.chatChannel.findMany();
    console.log('Global Chat Channels Count:', channels.length);
    for (const c of channels) {
      console.log(` - Channel #${c.id}: ${c.name} (type: ${c.type}, workspaceId: ${c.workspaceId})`);
    }

    console.log('\n✅ PostgreSQL connection and data queries SUCCESSFUL!');
  } catch (err) {
    console.error('❌ Database Query Error:', err);
  } finally {
    await globalPrisma.$disconnect();
    await prisma.$disconnect();
  }
}

main();
