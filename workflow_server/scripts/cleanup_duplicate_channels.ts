import dotenv from 'dotenv';
dotenv.config();

import { globalPrisma } from '../src/lib/globalPrisma.js';
import { prisma as workspacePrisma } from '../src/lib/prisma.js';

async function main() {
  try {
    console.log('--- 🔍 Analyzing Chat Channels ---');

    // 1. 실제 Workspace DB의 프로젝트와 그룹 확인
    const activeProjects = await workspacePrisma.project.findMany({ select: { id: true, name: true } });
    const activeProjectIds = new Set(activeProjects.map((p) => p.id));

    const activeGroups = await workspacePrisma.group.findMany({ select: { id: true, name: true } });
    const activeGroupIds = new Set(activeGroups.map((g) => g.id));

    console.log(`Active Projects in Workspace: ${activeProjects.length} (${activeProjects.map(p => `${p.name}#${p.id}`).join(', ')})`);
    console.log(`Active Groups in Workspace: ${activeGroups.length} (${activeGroups.map(g => `${g.name}#${g.id}`).join(', ')})`);

    // 2. Global DB의 모든 채널 조회
    const allChannels = await globalPrisma.chatChannel.findMany({
      include: {
        _count: { select: { messages: true, members: true } },
      },
      orderBy: { id: 'asc' },
    });

    console.log(`\nTotal Existing Chat Channels in Global DB: ${allChannels.length}`);

    const toDeleteIds: number[] = [];

    // (1) GROUP 채널 중복 체크: 동일 workspaceId & groupId 또는 동일 workspaceId & name
    const seenGroups = new Map<string, typeof allChannels[0]>();
    for (const ch of allChannels.filter(c => c.type === 'GROUP')) {
      // 만약 실제 Group 테이블에 존재하지 않는 고아 그룹 채널이고 메시지가 0개라면 삭제
      if (ch.groupId && !activeGroupIds.has(ch.groupId) && ch._count.messages === 0) {
        console.log(`[Target Delete - Orphan Group] ID: ${ch.id}, Name: "${ch.name}", GroupId: ${ch.groupId}, Messages: ${ch._count.messages}`);
        toDeleteIds.push(ch.id);
        continue;
      }

      const key = `${ch.workspaceId}_${ch.groupId || ch.name}`;
      if (seenGroups.has(key)) {
        const prev = seenGroups.get(key)!;
        // 메시지가 있는 것을 유지
        if (ch._count.messages > prev._count.messages) {
          console.log(`[Target Delete - Duplicate Group] ID: ${prev.id}, Name: "${prev.name}" (replacing with ID: ${ch.id})`);
          toDeleteIds.push(prev.id);
          seenGroups.set(key, ch);
        } else {
          console.log(`[Target Delete - Duplicate Group] ID: ${ch.id}, Name: "${ch.name}" (keeping ID: ${prev.id})`);
          toDeleteIds.push(ch.id);
        }
      } else {
        seenGroups.set(key, ch);
      }
    }

    // (2) PROJECT 채널 중복 및 고아 체크
    const seenProjects = new Map<string, typeof allChannels[0]>();
    for (const ch of allChannels.filter(c => c.type === 'PROJECT')) {
      // 실제 프로젝트가 없고 메시지가 0개인 고아 프로젝트 채널 삭제
      if (ch.projectId && !activeProjectIds.has(ch.projectId) && ch._count.messages === 0) {
        console.log(`[Target Delete - Orphan Project] ID: ${ch.id}, Name: "${ch.name}", ProjectId: ${ch.projectId}, Messages: ${ch._count.messages}`);
        toDeleteIds.push(ch.id);
        continue;
      }

      const key = `${ch.workspaceId}_${ch.projectId || ch.name}`;
      if (seenProjects.has(key)) {
        const prev = seenProjects.get(key)!;
        if (ch._count.messages > prev._count.messages) {
          console.log(`[Target Delete - Duplicate Project] ID: ${prev.id}, Name: "${prev.name}" (replacing with ID: ${ch.id})`);
          toDeleteIds.push(prev.id);
          seenProjects.set(key, ch);
        } else {
          console.log(`[Target Delete - Duplicate Project] ID: ${ch.id}, Name: "${ch.name}" (keeping ID: ${prev.id})`);
          toDeleteIds.push(ch.id);
        }
      } else {
        seenProjects.set(key, ch);
      }
    }

    // (3) GENERAL 채널 중복 체크
    const seenGeneral = new Map<string, typeof allChannels[0]>();
    for (const ch of allChannels.filter(c => c.type === 'GENERAL' || c.type === 'GLOBAL')) {
      const key = `${ch.workspaceId}_${ch.name}`;
      if (seenGeneral.has(key)) {
        const prev = seenGeneral.get(key)!;
        if (ch._count.messages > prev._count.messages) {
          console.log(`[Target Delete - Duplicate General] ID: ${prev.id}, Name: "${prev.name}" (replacing with ID: ${ch.id})`);
          toDeleteIds.push(prev.id);
          seenGeneral.set(key, ch);
        } else {
          console.log(`[Target Delete - Duplicate General] ID: ${ch.id}, Name: "${ch.name}" (keeping ID: ${prev.id})`);
          toDeleteIds.push(ch.id);
        }
      } else {
        seenGeneral.set(key, ch);
      }
    }

    console.log(`\nTotal Channels to Delete: ${toDeleteIds.length}`);
    console.log('Channels to Delete IDs:', toDeleteIds);

    if (toDeleteIds.length > 0) {
      const res = await globalPrisma.chatChannel.deleteMany({
        where: { id: { in: toDeleteIds } },
      });
      console.log(`✅ Successfully deleted ${res.count} duplicate/orphan chat channels!`);
    } else {
      console.log('No duplicate channels to delete.');
    }
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await globalPrisma.$disconnect();
    await workspacePrisma.$disconnect();
  }
}

main();
